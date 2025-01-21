import { IsDate, IsNotEmpty, IsNumber } from "class-validator";

export class Simulation {
    @IsNumber()
    id: number;

    @IsNotEmpty()
    @IsNumber()
    userId: number;

    droneFlightId?: number;

    status: 'pending' | 'completed' | 'failed' | 'timeExceeded';

    @IsNotEmpty()
    parameters: any;

    result?: Buffer;

    @IsNotEmpty()
    @IsDate()
    createdAt: Date;

    @IsDate()
    updatedAt: Date;
  }
  