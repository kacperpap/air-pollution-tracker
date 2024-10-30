import { Injectable } from '@nestjs/common';
import { CreateDroneFlightType } from './dto/create-drone-flight';
import { EditDroneFlightType } from './dto/edit-drone-flight';
import { PrismaService } from '../prisma/prisma.service';
import { pollutantTypes } from '../pollutants';

@Injectable()
export class DroneService {
    constructor(private readonly prisma: PrismaService) {}

    /*
    // There is a way to return defined type not json as below, but this may cause problems on frontend

    async getAllDroneFlights(userId: number): Promise<DroneFlightType[]> {
        const droneFlights = await this.prisma.droneFlight.findMany({
            where: { userId },
            include: {
                measurements: true, 
            },
        });

        return plainToInstance(DroneFlightType, droneFlights, {
            excludeExtraneousValues: true, // Automatyczne wykluczanie `@Exclude`
        });
    }
    */

    async getAllDroneFlights(userId: number){
        return this.prisma.droneFlight.findMany({
            where: {
                userId: userId
            }, 
            include: {
                measurements: {
                    include: {
                        pollutionMeasurements: true
                    }
                }
            }
        })
    }

    async getDroneFlightById(userId: number, id: number) {
        return this.prisma.droneFlight.findUnique({
            where: {
                id: id,
                userId: userId
            }, 
            include: {
                measurements: {
                    include: {
                        pollutionMeasurements: true
                    }
                }
            }
        })
    }

    async addDroneFlight(data: CreateDroneFlightType, userId: number) {
        if (typeof data.date === 'string') {
            data.date = new Date(data.date);
        }
    
        const measurements = data.measurements.map(measurement => {
            const latitude = typeof measurement.latitude === 'string' ? parseFloat(measurement.latitude) : measurement.latitude;
            const longitude = typeof measurement.longitude === 'string' ? parseFloat(measurement.longitude) : measurement.longitude;
            const temperature = typeof measurement.temperature === 'string' ? parseFloat(measurement.temperature) : measurement.temperature;
            const windSpeed = typeof measurement.windSpeed === 'string' ? parseFloat(measurement.windSpeed) : measurement.windSpeed;
            const windDirection = typeof measurement.windDirection === 'string' ? parseFloat(measurement.windDirection) : measurement.windDirection;
            const pressure = typeof measurement.pressure === 'string' ? parseFloat(measurement.pressure) : measurement.pressure;

            const measurements = pollutantTypes
            .map(type => {
                const value = measurement.pollutionMeasurements?.find(p => p.type === type)?.value;
                return value !== undefined && value !== null ? { type, value } : null;
            })
            .filter(p => p !== null);
            
    
            return {
                name: measurement.name,
                latitude,
                longitude,
                temperature,
                windSpeed,
                windDirection,
                pressure,
                pollutionMeasurements: {
                    create: measurements,
                }
            };
        });
    
        return this.prisma.droneFlight.create({
            data: {
                title: data.title,
                description: data.description,
                date: data.date,
                userId: userId,
                measurements: {
                    create: measurements,
                }
            }
        });
    }
    

    async deleteDroneFlight(userId: number, id: number) {
        
        /**
         * Need to delete ON CASCADE drone measurements when deleting drone flight
         */
        await this.prisma.pollutionMeasurement.deleteMany({
            where: {
                measurement: {
                    flightId: id
                }
            }
        });

        await this.prisma.droneMeasurement.deleteMany({
            where: {
                flightId: id
            }
        });

        return this.prisma.droneFlight.delete({
            where: {
                userId: userId,
                id: id
            }
        })
    }


    async editDroneFlight(data: EditDroneFlightType, userId: number, id: number) {
        /*
        Edit drone flight takes new data: EditDroneFlightType and updates all variables,
        also updates measurements: EditDroneFlightMeasurementType, which means, it removes all
        and add new defined in formula
        */
    
        if (typeof data.date === 'string') {
            data.date = new Date(data.date);
        }
    
        const measurements = data.measurements.map(measurement => {
            const latitude = typeof measurement.latitude === 'string' ? parseFloat(measurement.latitude) : measurement.latitude;
            const longitude = typeof measurement.longitude === 'string' ? parseFloat(measurement.longitude) : measurement.longitude;
            const temperature = typeof measurement.temperature === 'string' ? parseFloat(measurement.temperature) : measurement.temperature;
            const windSpeed = typeof measurement.windSpeed === 'string' ? parseFloat(measurement.windSpeed) : measurement.windSpeed;
            const windDirection = typeof measurement.windDirection === 'string' ? parseFloat(measurement.windDirection) : measurement.windDirection;
            const pressure = typeof measurement.pressure === 'string' ? parseFloat(measurement.pressure) : measurement.pressure;

            const measurements = pollutantTypes
            .map(type => {
                const value = measurement.pollutionMeasurements?.find(p => p.type === type)?.value;
                return value !== undefined && value !== null ? { type, value } : null;
            })
            .filter(p => p !== null);
    
            return {
                name: measurement.name,
                latitude,
                longitude,
                temperature,
                windSpeed,
                windDirection,
                pressure,
                pollutionMeasurements: {
                    create: measurements,
                }
            };
        });

        await this.prisma.pollutionMeasurement.deleteMany({
            where: {
                measurement: {
                    flightId: id
                }
            }
        });
    
        await this.prisma.droneMeasurement.deleteMany({
            where: {
                flightId: id
            }
        });
    
        return this.prisma.droneFlight.update({
            where: {
                userId: userId,
                id: id
            },
            data: {
                title: data.title,
                description: data.description,
                date: data.date,
                measurements: {
                    create: measurements,
                }
            }
        });
    }
    
}
