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

    async runSimulationOfPollutionSpreadForDroneFlight(droneFlightData: DroneFlightType): Promise<SimulationResponseType> {
      const simulationRequest = new SimulationRequestType({
        measurements: droneFlightData.measurements.map(measurement => ({
          id: measurement.id,
          name: measurement.name,
          latitude: measurement.latitude,
          longitude: measurement.longitude,
          temperature: measurement.temperature,
          wind_speed: measurement.wind_speed ?? undefined,
          wind_direction: measurement.wind_direction ?? undefined,
          pressure: measurement.pressure ?? undefined,
          CO: measurement.CO ?? undefined,
          O3: measurement.O3 ?? undefined,
          SO2: measurement.SO2 ?? undefined,
          NO2: measurement.NO2 ?? undefined,
          flightId: droneFlightData.id, 
        })),
      });
  
      const result = await this.run(simulationRequest);
  
      return result;
    }


    async run(data: SimulationRequestType): Promise<SimulationResponseType> {

        const simulationResult = await this.rabbitMQService.sendMessage(
            this.rabbitMQService.requestQueue,
            data
        );

        return simulationResult
    }
}


