import { IsArray, IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString, ValidateNested } from 'class-validator';
import { DroneFlightType } from 'src/modules/drone/dto/drone-flight';


export class SimulationRequestType {

  @IsNotEmpty()
  droneFlight: DroneFlightType;

  @IsNumber()
  @IsPositive()
  numSteps: number;

  @IsNumber()
  @IsPositive()
  dt: number;

  @IsArray()
  @IsOptional()
  pollutants: string[];

  @IsArray()
  @IsOptional()
  boxSize: [number | null, number | null];

  @IsString()
  gridDensity: string;

  @IsNumber()
  marginBoxes: number;

  @IsNumber()
  initialDistance: number;

  @IsBoolean()
  urbanized: boolean;


  /**
    * Partial<T> is ts type which changes all fields from data into non-obligatory
    * Enables to assign field from data that appeared into defined type 
    */
   
  constructor(data: Partial<SimulationRequestType>) {
    Object.assign(this, data);
  }
}





  