import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { RabbitMQService } from '../rabbitmq/rabbitmq.service'; 
import { SimulationRequestType } from './dto/simulation-request-data';
import { SimulationResponseType } from './dto/simulation-response-data';
import { PrismaService } from '../prisma/prisma.service';
import { Simulation } from './dto/simulation';


@Injectable()
export class SimulationService {
  constructor(
    private rabbitMQService: RabbitMQService,
    private prisma: PrismaService
  ) {}
    

    /**
     * This function wraps a simulation run function to properly process and pass request and resposne data
     * from and to simulation module 
     */

    async runSimulationOfPollutionSpreadForDroneFlight(
      simulationData: SimulationRequestType,
      simulationId: number
    ): Promise<void> {
      try {
        const simulationRequest = new SimulationRequestType({
          droneFlight: simulationData.droneFlight,
          numSteps: simulationData.numSteps,
          dt: simulationData.dt,
          pollutants: simulationData.pollutants,
          boxSize: simulationData.boxSize,
          gridDensity: simulationData.gridDensity,
          urbanized: simulationData.urbanized,
          marginBoxes: simulationData.marginBoxes,
          initialDistance: simulationData.initialDistance,
        });
    
        const simulationResult = await this.run(simulationRequest);
    
        await this.updateSimulationResult(simulationId, 'completed', simulationResult);
      } catch (error) {
        if (error instanceof HttpException && error.getStatus() === HttpStatus.REQUEST_TIMEOUT) {
          await this.updateSimulationResult(simulationId, 'timeExceeded');
        } else {
          await this.updateSimulationResult(simulationId, 'failed');
        }
    
        throw error;
      }
    }
    

    async run(data: SimulationRequestType): Promise<SimulationResponseType> {

        const simulationResult = await this.rabbitMQService.sendMessage(
            this.rabbitMQService.requestQueue,
            data
        );

        return this.processSimulationResult(simulationResult);
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
        },
      });
      return newSimulation.id;
    }

    async updateSimulationResult(
      simulationId: number,
      status: 'completed' | 'failed' | 'timeExceeded',
      resultData?: SimulationResponseType
    ): Promise<void> {
      const resultBuffer = resultData
        ? Buffer.from(JSON.stringify(resultData)) 
        : undefined;
    
      await this.prisma.simulation.update({
        where: { id: simulationId },
        data: {
          status,
          result: resultBuffer,
        },
      });
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


