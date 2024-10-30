import { Exclude } from "class-transformer"
import { IsDate, IsNotEmpty, IsNumber, IsString } from "class-validator"

export class StationMeasurementType {
    @IsNumber()
    @IsNotEmpty()
    id: number

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
    wind_speed?: number;  
  
    @IsNumber()
    wind_direction?: number;  
  
    @IsNumber()
    pressure?: number;  
  
    @IsNumber()
    CO?: number;  
  
    @IsNumber()
    O3?: number;  
  
    @IsNumber()
    SO2?: number;  
  
    @IsNumber()
    NO2?: number;  

    @Exclude()
    userId?: number

    @Exclude()
    stationId?: number
}