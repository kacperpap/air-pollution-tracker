import { IsDate, IsNotEmpty, IsNumber } from "class-validator";

export class SimulationLight {
    @IsNumber()
    id: number;

    @IsNotEmpty()
    @IsNumber()
    userId: number;

    droneFlightId?: number;

    status: 'pending' | 'completed' | 'failed' | 'timeExceeded';

    @IsNotEmpty()
    parameters: any;

    @IsNotEmpty()
    @IsDate()
    createdAt: Date;

    @IsDate()
    updatedAt: Date;
}
