import { Injectable, OnModuleInit, OnModuleDestroy, HttpStatus, HttpException, Inject, forwardRef } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as amqp from 'amqplib';
import { SimulationService } from '../simulation/simulation.service';
import { logWithTime } from '../utils';
import { v4 as uuidv4 } from 'uuid'

@Injectable()
export class RabbitMQService implements OnModuleInit, OnModuleDestroy {
  private connection: amqp.Connection;
  private channel: amqp.Channel;
  public requestQueue: string;
  public rabbitmqUrl: string;


  constructor(
    @Inject(forwardRef(() => SimulationService))
    private simulationService: SimulationService,
    private configService: ConfigService
  ) {
    this.requestQueue = this.configService.get<string>('RABBITMQ_REQUEST_QUEUE');
    this.rabbitmqUrl = this.configService.get<string>('RABBITMQ_URL');
  }

  async onModuleInit() {
    await this.connectToRabbitMQ();
  }

  async onModuleDestroy() {
    await this.closeConnection();
  }

  private async connectToRabbitMQ() {
    try {
      this.connection = await amqp.connect(`${this.rabbitmqUrl}`);
      this.channel = await this.connection.createChannel();
      await this.channel.assertQueue(this.requestQueue, { 
        durable: false
        // arguments: { "x-message-ttl": 30000 }
       });

    } catch (error) {
      console.error('Error connecting to RabbitMQ:', error);
      setTimeout(() => this.connectToRabbitMQ(), 5000);
    }
  }

  private async closeConnection() {
    if (this.channel) {
      await this.channel.close();
    }
    if (this.connection) {
      await this.connection.close();
    }
  }

  /*
  * sendMessage and receiveMessage are blocking functions
  * when running them, backend process, that started simulation
  * needed to wait until it completes, and then could
  * receive data from calc_module (via rabbitmq) and pass them to frontend
  */

  async sendMessage(queue: string, message: any, timeoutMs: number = 60000): Promise<any> {
    if (!this.connection || !this.channel) {
      await this.connectToRabbitMQ();
    }

    const correlationId = uuidv4();
    const serializedMessage = Buffer.from(JSON.stringify(message));

    /**
     * In small systems, where request are being serviced long time (like with simulation), 
     * there is a simple way to create an exclusive request queue for each request
     * It enables quick and easy horizontal scaling, and thanks to optimization in rabbitmq, 
     * does not take much resources
     */
    const { queue: replyTo } = await this.channel.assertQueue('', { exclusive: true });

    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(
          new HttpException(
            'Timeout: No response from simulation module within the given time',
            HttpStatus.REQUEST_TIMEOUT
          )
        );
      }, timeoutMs);

      this.channel.sendToQueue(this.requestQueue, serializedMessage, {
        persistent: false,
        correlationId: correlationId,
        replyTo: replyTo,
      });

      this.channel.consume(
        replyTo,
        (msg) => {
          if (msg && msg.properties.correlationId === correlationId) {
            clearTimeout(timer);
            const result = JSON.parse(msg.content.toString());
            this.channel.ack(msg);
            resolve(result);
          }
        },
        { noAck: false }
      );
    });
  }

  async receiveMessage(queue: string, callback: (message: any) => void) {
    if (!this.connection || !this.channel) {
      await this.connectToRabbitMQ();
    }

    this.channel.consume(
      queue,
      (msg) => {
        if (msg) {
          const messageContent = JSON.parse(msg.content.toString());
          callback(messageContent);
          this.channel.ack(msg);
        }
      },
      { noAck: false }
    );
  }

  /*
  * Changed version of sending and receiving messages,
  * sendTask sends message to rabbitmq and end process,
  * then consumeResults waits for end of task, and
  * updates db when the result is ready
  */


  async sendTask(queue: string, message: any, simulationId: number): Promise<void> {
    try {

      if (!this.connection || !this.channel) {
        await this.connectToRabbitMQ();
      }

      const correlationId = uuidv4();

      const { queue: replyTo } = await this.channel.assertQueue('', { exclusive: true });

      logWithTime(`sendTask -> send simulation with id ${simulationId} and correlationId: ${correlationId}, replyTo: ${replyTo}, queue: ${queue} to rabbitmq`)
    
      const serializedMessage = Buffer.from(JSON.stringify({
        ...message,
        simulationId,
      }));

      this.consumeResults(replyTo, correlationId, simulationId);

      this.channel.sendToQueue(queue, serializedMessage, { 
        persistent: false,
        correlationId: correlationId,
        replyTo: replyTo,
      });

    } catch(error) {
      logWithTime(`sendTask -> error during sending task to rabbitmq or initializing exclusive response queue: ${error}`)
      this.simulationService.updateSimulationResult(simulationId, "failed", null);
    } 
  }


  async consumeResults(
    replyTo: string,
    correlationId: string,
    simulationId: number
  ): Promise<void> {

    try {
      if (!this.connection || !this.channel) {
        await this.connectToRabbitMQ();
      }
  
      /*
       * Prefetch mechanism ensures that rabit sends to consumer next message
       * only if previous n messages has been acknowledged
       * i.e. if prefetch is equal 1, rabbit will send message to consumer only if
       * it is free, and thanks to that, if there are multiple consumers
       * rabbit will distribute fairly all messages, so that each consumer executes max 1 
       * message at a time
       */
      this.channel.prefetch(4, true);
    
      this.channel.consume(
        replyTo,
        async (msg) => {
        if (msg && msg.properties.correlationId === correlationId) {
          logWithTime(`consumeResults -> Received reply with correlationId: ${correlationId}`);
  
          try {
            const rawMessage = msg.content.toString();
            const sanitizedMessage = rawMessage.replace(/\bNaN\b/g, "null");

            const messageContent = JSON.parse(sanitizedMessage);
            const { status, result } = messageContent;
            logWithTime(`consumeResults -> Status of received reply for simulation ${simulationId}: ${status}`);
            
            await this.processMessage(simulationId, result, status);
  
            this.channel.ack(msg);
  
          } catch (error) {
            this.channel.nack(msg, false, false);
            this.simulationService.updateSimulationResult(simulationId, "failed", null)
            logWithTime(`consumeResult -> Error parsing message: ${msg.content.toString()}`);
            logWithTime(`consumeResult -> Error: ${error}`);
          }
        }
      }, { noAck: false });

    } catch(error) {
      logWithTime(`consumeResult -> Error during consuming response for simulation ${simulationId}: ${error}`)
      this.simulationService.updateSimulationResult(simulationId, "failed", null);
    }
  }


  async processMessage(simulationId: number, result: any, status): Promise<void> {
      logWithTime(`processMessage -> Processing result for simulationId: ${simulationId}`);

      try {
          await this.simulationService.updateSimulationResult(
              simulationId,
              status as "failed" | "completed" | "timeExceeded",
              result
          );

      } catch (error) {
          logWithTime(`processMessage -> Error updating simulation result for simulationId: ${simulationId}: ${error}`);
          this.simulationService.updateSimulationResult(simulationId, "failed", null);
      }
  }


}
