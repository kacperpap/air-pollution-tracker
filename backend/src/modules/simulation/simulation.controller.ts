import { Body, Controller, Delete, Get, HttpException, HttpStatus, Param, Post, UseGuards } from '@nestjs/common';
import { SimulationService } from './simulation.service';
import { TokenGuard } from '../auth/token.guard';
import { UserID } from 'src/decorators/user.decorator';
import { SimulationRequestType } from './dto/simulation-request-data';
import { PrismaService } from '../prisma/prisma.service';
import { Simulation } from './dto/simulation';
import { SimulationLight } from './dto/simulation-light';
import { logWithTime } from '../utils';

@Controller('simulation-pollution-spread')
export class SimulationController {
    constructor(
        private simulationService: SimulationService,
        private prismaService: PrismaService
      ) {}
    
      @UseGuards(TokenGuard)
      @Post('droneFlight/')
      async simulatePollutionSpreadForDroneFlight(
        @UserID() userId: number,
        @Body() simulationData: SimulationRequestType
      ) {

        const droneFlightId = simulationData.droneFlight.id;
        const simulationId = await this.simulationService.createSimulation(
          userId,
          simulationData,
          droneFlightId
        );

        /*
         * Instead of waiting for result of simulation, send simulation id right after
         * creating a db record
         */

        this.simulationService.runSimulationOfPollutionSpreadForDroneFlight(
          simulationData,
          simulationId
        );
    
        logWithTime(`SimulationController (droneFlight/) -> written to db simulationId: ${simulationId}`)
        return { simulationId };
        
      }

      @UseGuards(TokenGuard)
      @Get('light/')
      async getSimulationsForUserLight(@UserID() userId: number): Promise<SimulationLight[]> {
        return this.simulationService.getSimulationsForUserLightVersion(userId);
      }

      @UseGuards(TokenGuard)
      @Get('light/:simulationId')
      async getSimulationLightById(
        @UserID() userId: number,
        @Param('simulationId') simulationId: number
      ): Promise<SimulationLight> {
        return this.simulationService.getSimulationLightVersionById(simulationId);
      }

      @UseGuards(TokenGuard)
      @Get()
      async getSimulationsForUser(@UserID() userId: number): Promise<Simulation[]> {
        return this.simulationService.getSimulationsForUser(userId);
      }

      @UseGuards(TokenGuard)
      @Get(':simulationId')
      async getSimulationById(
        @Param('simulationId') simulationId: number,
        @UserID() userId: number
      ): Promise<Simulation> {
        const simulation = await this.simulationService.getSimulationById(simulationId);
        
        if (!simulation) {
          throw new HttpException('Simulation not found', HttpStatus.NOT_FOUND);
        }

        if (simulation.userId !== userId) {
          throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
        }

        return simulation;
      }


      @UseGuards(TokenGuard)
      @Delete(':simulationId')
      async deleteSimulationById(
        @Param('simulationId') simulationId: number,
        @UserID() userId: number
      ): Promise<{ message: string }> {
        const simulation = await this.simulationService.getSimulationById(simulationId);

        if (!simulation) {
          throw new HttpException('Simulation not found', HttpStatus.NOT_FOUND);
        }

        if (simulation.userId !== userId) {
          throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
        }

        await this.simulationService.deleteSimulationById(simulationId);

        return { message: `Simulation with ID ${simulationId} deleted successfully.` };
      }

      @UseGuards(TokenGuard)
      @Delete()
      async deleteAllSimulationsForUser(@UserID() userId: number): Promise<{ message: string }> {
        await this.simulationService.deleteAllSimulationsForUser(userId);

        return { message: `All simulations for user ID ${userId} deleted successfully.` };
      }
}


