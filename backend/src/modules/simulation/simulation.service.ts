import { forwardRef, HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { RabbitMQService } from '../rabbitmq/rabbitmq.service'; 
import { SimulationRequestType } from './dto/simulation-request-data';
import { SimulationResponseType } from './dto/simulation-response-data';
import { PrismaService } from '../prisma/prisma.service';
import { Simulation } from './dto/simulation';
import { gzipSync } from 'zlib';
import { SimulationLight } from './dto/simulation-light';
import { error } from 'console';
import { logWithTime } from '../utils';


@Injectable()
export class SimulationService {
  constructor(
    @Inject(forwardRef(() => RabbitMQService))
    private rabbitMQService: RabbitMQService,
    private prisma: PrismaService
  ) {}
    

    async runSimulationOfPollutionSpreadForDroneFlight(
      simulationData: SimulationRequestType,
      simulationId: number
    ): Promise<void> {
        try {

            const simulationRequest = new SimulationRequestType({
                  droneFlight: simulationData.droneFlight,
                  numSteps: simulationData.numSteps,
                  pollutants: simulationData.pollutants,
                  gridDensity: simulationData.gridDensity,
                  urbanized: simulationData.urbanized,
                  marginBoxes: simulationData.marginBoxes,
                  initialDistance: simulationData.initialDistance,
                  snapInterval: simulationData.snapInterval,
                  decayRate: simulationData.decayRate,
                  simulationId: simulationId
                });

            logWithTime(`runSimulationOfPollutionSpreadForDroneFlight -> Simulation request parsed as SimulationRequestType`)
    
            await this.rabbitMQService.sendTask(this.rabbitMQService.requestQueue, simulationRequest, simulationId);
        } catch (error) {
            logWithTime(`runSimulationOfPollutionSpreadForDroneFlight -> failed passing simulation request to sendTask: ${error}`)
            await this.updateSimulationResult(simulationId, 'failed', null);
        }
    }
  
    
    private processSimulationResult(result: any): SimulationResponseType {
            
      const processedResult = new SimulationResponseType({
        grid: {
          boxes: result.grid.boxes.map((box: any) => ({
            lat_min: box.lat_min,
            lat_max: box.lat_max,
            lon_min: box.lon_min,
            lon_max: box.lon_max,
          })),
        },
        pollutants: {
          final_step: {
            CO: result.pollutants.final_step.CO || [],
            O3: result.pollutants.final_step.O3 || [],
            NO2: result.pollutants.final_step.NO2 || [],
            SO2: result.pollutants.final_step.SO2 || [],
          },
        },
        environment: {
          temperature: result.environment.temperature || [],
          pressure: result.environment.pressure || [],
          windSpeed: result.environment.windSpeed || [],
          windDirection: result.environment.windDirection || [],
        },
      });

      processedResult.pollutants.steps = result.pollutants.steps || {};
    
      return processedResult;
    }


    /*
    * Database functions
    */

    async createSimulation(
      userId: number,
      parameters: SimulationRequestType,
      droneFlightId?: number
    ): Promise<number> {
      const { droneFlight, ...filteredParameters } = parameters;

      const newSimulation = await this.prisma.simulation.create({
        data: {
          userId,
          droneFlightId,
          status: 'pending',
          parameters: filteredParameters,
          updatedAt: undefined
        },
      });
      return newSimulation.id;
    }

    async updateSimulationResult(
      simulationId: number,
      status: 'completed' | 'failed' | 'timeExceeded',
      resultData?
    ): Promise<void> {

      /*
      * Data saved to db are compressed and saved as bytes (binary format)
      * After receiving data by getSimulationById (without decompressing and converting from bytes to json)
      * data format is as following:
      *   { type: "Buffer", data: [...] }
      *   where data is an array of numbers representing each byte from buffer
      */

        let resultBuffer: Buffer | null = null;
        let snapshotsBuffer: Buffer | null = null;
    
        if (resultData) {
            try {
                const processedResult: SimulationResponseType = this.processSimulationResult(resultData);
                resultBuffer = gzipSync(Buffer.from(JSON.stringify(processedResult)));
                
                if (resultData.pollutants && resultData.pollutants.steps) {
                  snapshotsBuffer = gzipSync(
                    Buffer.from(JSON.stringify(resultData.pollutants.steps))
                  );
                }
          
                await this.prisma.simulation.update({
                  where: { id: simulationId },
                  data: {
                      status,
                      result: resultBuffer,
                      snapshots: snapshotsBuffer,
                      updatedAt: new Date()
                  },
                });
                logWithTime(`updateSimulationResult -> Successfully updated simulation with id ${simulationId}, status: ${status}`);
            } catch (error) {
                logWithTime(`updateSimulationResult -> Error during parsing received data to SimulationResponseType: ${error}`);
  
                await this.prisma.simulation.update({
                  where: { id: simulationId },
                  data: {
                      status: "failed",
                      result: null,
                      snapshots: null,
                      updatedAt: new Date()
                  },
              });
            }
        } else {
          await this.prisma.simulation.update({
            where: { id: simulationId },
            data: {
                status,
                result: null,
                snapshots: null,
                updatedAt: new Date()
            },
          });
          logWithTime(`updateSimulationResult -> saving with null result, status: ${status}`);
        }
    }
  
    async getSimulationById(simulationId: number): Promise<Simulation> {
      return this.prisma.simulation.findUnique({
        where: { id: simulationId },
      });
    }
    
    async getSimulationsForUser(userId: number): Promise<Simulation[]> {
      return this.prisma.simulation.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      });
    }

    /*
    * This function enables to get from db all simulation data for user 
    * without result data, it is for viewing puposes, where we need this data
    * only when user downloads them - use getSimulationById in that case
    */
    async getSimulationsForUserLightVersion(userId: number): Promise<SimulationLight[]> {
      return this.prisma.simulation.findMany({
          where: { userId },
          orderBy: { createdAt: 'desc' },
          select: {
              id: true,
              userId: true,
              droneFlightId: true,
              status: true,
              parameters: true,
              createdAt: true,
              updatedAt: true,
          },
      });
  }
  

    async deleteSimulationById(simulationId: number): Promise<void> {
      await this.prisma.simulation.delete({
        where: { id: simulationId },
      });
    }
    
    async deleteAllSimulationsForUser(userId: number): Promise<void> {
      await this.prisma.simulation.deleteMany({
        where: { userId },
      });
    }
        
  
}


