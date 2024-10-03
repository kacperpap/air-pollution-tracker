import { IsDate, IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator"
import { StationMeasurementType } from "./station-measurement"
import { Exclude } from "class-transformer"

export class StationType {
    @IsNumber()
    @IsNotEmpty()
    id: number

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
    date?: Date

    @IsNotEmpty()
    measurements: StationMeasurementType[];

    @Exclude()
    userId: number

}