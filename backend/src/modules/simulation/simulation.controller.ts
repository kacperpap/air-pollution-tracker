import { Body, Controller, Get, NotFoundException, Param, ParseIntPipe, Post, UseGuards } from '@nestjs/common';
import { DroneService } from '../drone/drone.service';
import { SimulationService } from './simulation.service';
import { TokenGuard } from '../auth/token.guard';
import { UserID } from 'src/decorators/user.decorator';
import { DroneFlightType } from '../drone/dto/drone-flight';

@Controller('simulation-pollution-spread')
export class SimulationController {
    constructor(
        private droneService: DroneService,
        private simulationService: SimulationService
      ) {}
    
      @UseGuards(TokenGuard)
      @Post('droneFlight/:id')
      async simulatePollutionSpreadForDroneFlight(
        @Param('id', ParseIntPipe) id: number,
        @UserID() userId: number
      ) {

        const droneFlight : DroneFlightType = await this.droneService.getDroneFlightById(userId, id);
    
        if (!droneFlight) {
          throw new NotFoundException();
        }
    
        const result = await this.simulationService.runSimulationOfPollutionSpreadForDroneFlight(droneFlight);
    
        return result;
      }
}


