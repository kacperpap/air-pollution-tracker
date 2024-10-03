import { IsNotEmpty, IsNumber } from "class-validator"

export class CreateStationMeasurementType {
    @IsNotEmpty()
    latitude: string | number

    @IsNotEmpty()
    longitude: string | number

    @IsNotEmpty()
    temperature: string | number

    @IsNumber()
    wind_speed?: string | number  
  
    @IsNumber()
    wind_direction?: string | number  
  
    @IsNumber()
    pressure?: string | number  
  
    @IsNumber()
    CO?: string | number  
  
    @IsNumber()
    O3?: string | number  
  
    @IsNumber()
    SO2?: string | number  
  
    @IsNumber()
    NO2?: string | number  
}