import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { DroneService } from '../drone/drone.service';
import { SimulationService } from './simulation.service';
import { TokenGuard } from '../auth/token.guard';
import { UserID } from 'src/decorators/user.decorator';
import { SimulationRequestType } from './dto/simulation-request-data';

@Controller('simulation-pollution-spread')
export class SimulationController {
    constructor(
        private droneService: DroneService,
        private simulationService: SimulationService
      ) {}
    
      @UseGuards(TokenGuard)
      @Post('droneFlight/')
      async simulatePollutionSpreadForDroneFlight(
        @UserID() userId: number,
        @Body() simulationData: SimulationRequestType
      ) {
        const result = await this.simulationService.runSimulationOfPollutionSpreadForDroneFlight(simulationData);

        return result;
      }
}


