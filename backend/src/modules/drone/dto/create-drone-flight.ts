import { IsDate, IsNotEmpty, IsOptional, IsString } from "class-validator";
import { CreateDroneMeasurementType } from "./create-drone-flight-measurement";

export class CreateDroneFlightType {
    
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
    measurements: CreateDroneMeasurementType[];
}
