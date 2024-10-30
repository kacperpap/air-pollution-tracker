import { IsDate, IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator"
import { StationMeasurementType } from "./station-measurement"

export class CreateStationType {
    
    @IsString()
    @IsNotEmpty()
    stationName: string

    @IsString()
    @IsNotEmpty()
    managingAgency?: string

    @IsOptional()
    @IsString()
    description?: string

    @IsDate()
    @IsOptional()
    date?: Date | string

    @IsNotEmpty()
    measurements: StationMeasurementType[];

}