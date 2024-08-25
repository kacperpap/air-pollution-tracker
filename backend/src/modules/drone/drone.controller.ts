import { Body, Controller, Delete, Get, Post, Put, UseGuards } from '@nestjs/common';
import { DroneService } from './drone.service';
import { TokenGuard } from '../auth/token.guard';

@Controller('drone')
export class DroneController {
    constructor(private droneService: DroneService) {}

    @Post(':droneFlight/')
    @UseGuards(TokenGuard)
    addDroneFlight(
        @Body() data: 
    ){

    }

    @Get(':droneFlight/')
    getAllDroneFlights() {

    }

    @Get(':droneFlight/:id')
    getDroneFlightById() {

    }

    @Get(':droneFlight/:name')
    getDroneFlightByName() {

    }

    @Put(':droneFlight/:id')
    editDroneFlight() {

    }

    @Delete(':droneFlight/:id') 
    deleteDroneFlight() {
        
    }
    
}
