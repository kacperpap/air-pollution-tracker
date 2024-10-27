import { Injectable, OnModuleInit, OnModuleDestroy, HttpStatus, HttpException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as amqp from 'amqplib';

@Injectable()
export class RabbitMQService implements OnModuleInit, OnModuleDestroy {
  private connection: amqp.Connection;
  private channel: amqp.Channel;
  public requestQueue: string;
  public rabbitmqUrl: string;


  constructor(private configService: ConfigService) {
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
      await this.channel.assertQueue(this.requestQueue, { durable: false });
      // await this.channel.assertQueue(this.responseQueue, { durable: false, exclusive: true });

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

  async sendMessage(queue: string, message: any, timeoutMs: number = 60000): Promise<any> {
    if (!this.connection || !this.channel) {
      await this.connectToRabbitMQ();
    }

    const correlationId = Math.random().toString();
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
        persistent: true,
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
}
