import { IsDate, IsNotEmpty, IsOptional, IsString } from "class-validator";
import { DroneMeasurementType } from "./drone-flight-measurement";
import { Exclude } from "class-transformer";

export class DroneFlightType {
    id: number

    @IsString()
    @IsNotEmpty()
    title: string

    @IsOptional()
    @IsString()
    description?: string

    @IsOptional()
    @IsDate()
    date?: Date

    @IsNotEmpty()
    measurements: DroneMeasurementType[];

    @Exclude()
    userId: number
}
