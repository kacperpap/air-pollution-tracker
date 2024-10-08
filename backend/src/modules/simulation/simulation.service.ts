import { Injectable } from '@nestjs/common';
import { RabbitMQService } from '../rabbitmq/rabbitmq.service'; 
import { DroneFlightType } from '../drone/dto/drone-flight';
import { SimulationRequestType } from './dto/simulation-request-data';
import { SimulationResponseType } from './dto/simulation-response-data';


@Injectable()
export class SimulationService {
    constructor(private rabbitMQService: RabbitMQService) {}


    /**
     * This function wraps a simulation run function to properly process and pass request and resposne data
     * from and to simulation module 
     */

    async runSimulationOfPollutionSpreadForDroneFlight(droneFlightData: DroneFlightType): Promise<SimulationResponseType[]> {
      const simulationRequest = new SimulationRequestType({
        measurements: droneFlightData.measurements.map(measurement => ({
          id: measurement.id,
          name: measurement.name,
          latitude: measurement.latitude,
          longitude: measurement.longitude,
          temperature: measurement.temperature,
          windSpeed: measurement.windSpeed,
          windDirection: measurement.windDirection,
          pressure: measurement.pressure,
          pollutionMeasurements: measurement.pollutionMeasurements.map(pollution => ({
            type: pollution.type,
            value: pollution.value,
          })),
          flightId: droneFlightData.id, 
        })),
      });
  
      const result = await this.run(simulationRequest);
  
      return result;
    }


    async run(data: SimulationRequestType): Promise<SimulationResponseType[]> {

        const simulationResult = await this.rabbitMQService.sendMessage(
            this.rabbitMQService.requestQueue,
            data
        );

        return this.processSimulationResult(simulationResult);
    }

    private processSimulationResult(result: any): SimulationResponseType[] {
      const processedResult: SimulationResponseType[] = [];
  
      for (let i = 0; i < result.CO.length; i++) {
        processedResult.push(new SimulationResponseType({
          id: i,
          CO: result.CO[i],
          O3: result.O3 ? result.O3[i] : undefined,
          SO2: result.SO2 ? result.SO2[i] : undefined,
          NO2: result.NO2 ? result.NO2[i] : undefined,
        }));
      }
  
      return processedResult;
    }
}


