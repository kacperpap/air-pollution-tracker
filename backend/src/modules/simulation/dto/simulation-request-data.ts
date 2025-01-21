import { IsArray, IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString, ValidateNested } from 'class-validator';
import { DroneFlightType } from 'src/modules/drone/dto/drone-flight';


export class SimulationRequestType {

  @IsNotEmpty()
  droneFlight: DroneFlightType;

  @IsNumber()
  @IsPositive()
  numSteps: number;

  @IsArray()
  @IsOptional()
  pollutants: string[];

  @IsString()
  gridDensity: string;

  @IsNumber()
  marginBoxes: number;

  @IsNumber()
  initialDistance: number;

  @IsBoolean()
  urbanized: boolean;

  @IsNumber()
  decayRate: number

  @IsNumber()
  emissionRate: number

  @IsNumber()
  snapInterval: number

  @IsOptional()
  simulationId: number


  /**
    * Partial<T> is ts type which changes all fields from data into non-obligatory
    * Enables to assign field from data that appeared into defined type 
    */
   
  constructor(data: Partial<SimulationRequestType>) {
    Object.assign(this, data);
  }
}





  