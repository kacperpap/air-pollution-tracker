import { Injectable } from '@nestjs/common';
import { RabbitMQService } from '../rabbitmq/rabbitmq.service'; 
import { SimulationRequestType } from './dto/simulation-request-data';
import { SimulationResponseType } from './dto/simulation-response-data';


@Injectable()
export class SimulationService {
    constructor(private rabbitMQService: RabbitMQService) {}


    /**
     * This function wraps a simulation run function to properly process and pass request and resposne data
     * from and to simulation module 
     */

    async runSimulationOfPollutionSpreadForDroneFlight(simulationData: SimulationRequestType): Promise<SimulationResponseType> {
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
    
      const result = await this.run(simulationRequest);
      return result;
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
    
}


