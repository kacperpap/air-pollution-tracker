import { Body, Controller, Delete, Get, NotFoundException, Param, ParseIntPipe, Post, Put, UseGuards } from '@nestjs/common';
import { DroneService } from './drone.service';
import { TokenGuard } from '../auth/token.guard';
import { CreateDroneFlightType } from './dto/create-drone-flight';
import { UserID } from 'src/decorators/user.decorator';
import { EditDroneFlightType } from './dto/edit-drone-flight';

@Controller('drone')
export class DroneController {
    constructor(private droneService: DroneService) {}

    @Post()
    @UseGuards(TokenGuard)
    addDroneFlight(
        @Body() data: CreateDroneFlightType,
        @UserID() userId: number
    ){
        return this.droneService.addDroneFlight(data, userId)
    }

    @Get()
    @UseGuards(TokenGuard)
    async getAllDroneFlights(
        @UserID() userId: number
    ) {
        return this.droneService.getAllDroneFlights(userId)
    }

    @Get(':id')
    @UseGuards(TokenGuard)
    async getDroneFlightById(
        @UserID() userId: number,
        @Param('id', ParseIntPipe) id: number
    ) {
        const droneFlight = await this.droneService.getDroneFlightById(userId, id)
        if(!droneFlight) throw new NotFoundException();

        return droneFlight
    }

   
    @Put(':id')
    @UseGuards(TokenGuard)
    async editDroneFlight(
        @Body() data: EditDroneFlightType,
        @UserID() userId: number,
        @Param('id', ParseIntPipe) id: number
    ) {
        const droneFlight = await this.droneService.getDroneFlightById(userId, id)
        if(!droneFlight) throw new NotFoundException();

        await this.droneService.editDroneFlight(data, userId, id)
    }

    @Delete(':id') 
    @UseGuards(TokenGuard)
    async deleteDroneFlight(
        @UserID() userId: number,
        @Param('id', ParseIntPipe) id: number
    ) {
        const droneFlight = await this.droneService.getDroneFlightById(userId, id)
        if(!droneFlight) throw new NotFoundException();

        await this.droneService.deleteDroneFlight(userId, id)
    }
    
}
