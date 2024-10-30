import { Exclude, Type } from "class-transformer"
import { IsNotEmpty, IsNumber, IsString, ValidateNested } from "class-validator"

export class PollutionMeasurementType {
    @IsString()
    @IsNotEmpty()
    type: string;

    @IsNumber()
    @IsNotEmpty()
    value: number;
}

export class DroneMeasurementType {
    @IsNumber()
    @IsNotEmpty()
    id: number

    @IsString()
    name: string

    @IsNumber()
    @IsNotEmpty()
    latitude: number

    @IsNumber()
    @IsNotEmpty()
    longitude: number

    @IsNumber()
    @IsNotEmpty()
    temperature: number

    @IsNumber()
    windSpeed: number;  
  
    @IsNumber()
    windDirection: number;  
  
    @IsNumber()
    pressure?: number;  
  
    @ValidateNested({ each: true })
    @Type(() => PollutionMeasurementType)
    pollutionMeasurements: PollutionMeasurementType[];

    @Exclude()
    userId?: number

    @Exclude()
    flightId?: number
}