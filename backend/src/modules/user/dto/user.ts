import { User } from '@prisma/client';
import { Exclude } from 'class-transformer';
import { DroneFlightType } from 'src/modules/drone/dto/drone-flight';

export class UserType implements User {
    @Exclude()
    password: string;

    @Exclude()
    createdAt: Date;

    @Exclude()
    droneFlights: DroneFlightType


    id: number;
    name: string;
    email: string;
}