import { IsNotEmpty, IsNumber, IsString } from "class-validator";

export class SimulationResponseType {

    @IsNumber()
    @IsNotEmpty()
    id: number;

    @IsString()
    name: string;

    @IsNumber()
    @IsNotEmpty()
    latitude: number;

    @IsNumber()
    @IsNotEmpty()
    longitude: number;

    @IsNumber()
    @IsNotEmpty()
    temperature: number;

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

    @IsNumber()
    @IsNotEmpty()
    flightId: number;
  

    /**
     * 
     * Partial<T> is ts type which changes all fields from data into non-obligatory
     * Enables to assign field from data that appeared into defined type 
     */
    
    constructor(data: Partial<SimulationResponseType>) {
      Object.assign(this, data);
    }
  }
  