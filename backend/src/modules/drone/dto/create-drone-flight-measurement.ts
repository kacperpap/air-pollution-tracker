import { Type } from "class-transformer";
import { IsNotEmpty, IsNumber, IsString, ValidateNested } from "class-validator"

class PollutantMeasurement {
    @IsString()
    type: string;

    @IsNumber()
    value: number;
}

export class CreateDroneMeasurementType {

    @IsString()
    @IsNotEmpty()
    name: string

    @IsNotEmpty()
    latitude: string | number

    @IsNotEmpty()
    longitude: string | number

    @IsNotEmpty()
    temperature: string | number

    @IsNumber()
    windSpeed: string | number  
  
    @IsNumber()
    windDirection: string | number  
  
    @IsNumber()
    pressure: string | number  

    @ValidateNested({ each: true })
    @Type(() => PollutantMeasurement)
    pollutionMeasurements?: PollutantMeasurement[];
}