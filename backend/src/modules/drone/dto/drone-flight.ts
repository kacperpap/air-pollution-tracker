import { IsNotEmpty, IsOptional, IsString } from "class-validator";
import { DroneMeasurementType } from "./drone-flight-measurement";

export class DroneFlightType {
    id: number

    @IsString()
    @IsNotEmpty()
    title: string

    @IsOptional()
    @IsString()
    description?: string

    @IsNotEmpty()
    measurements: DroneMeasurementType[];
}
