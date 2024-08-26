import { Injectable } from '@nestjs/common';
import { CreateDroneFlightType } from './dto/create-drone-flight';
import { EditDroneFlightType } from './dto/edit-drone-flight';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DroneService {
    constructor(private readonly prisma: PrismaService) {}

    async getAllDroneFlights(userId: number) {
        return this.prisma.droneFlight.findMany({
            where: {
                userId: userId
            }
        })
    }

    async getDroneFlightById(userId: number, id: number) {
        return this.prisma.droneFlight.findUnique({
            where: {
                id: id,
                userId: userId
            }
        })
    }

    async addDroneFlight(data: CreateDroneFlightType, userId: number) {
        return this.prisma.droneFlight.create({
            data: {
                ...data,
                userId: userId
            }
        })
    }


    async deleteDroneFlight(userId: number, id: number) {
        return this.prisma.droneFlight.delete({
            where: {
                userId: userId,
                id: id
            }
        })
    }


    async editDroneFlight(data: EditDroneFlightType, userId: number, id: number) {
        return this.prisma.droneFlight.update({
            where: {
                userId: userId,
                id: id
            }, 
            data: {
                ...data
            }
        })
    }
    
    
    
}
