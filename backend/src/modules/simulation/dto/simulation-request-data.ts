import { IsNotEmpty, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { DroneMeasurementType } from 'src/modules/drone/dto/drone-flight-measurement';


export class SimulationRequestType {

  @IsNotEmpty()
  @ValidateNested({ each: true })  
  @Type(() => DroneMeasurementType)
  measurements: DroneMeasurementType[];


  /**
    * Partial<T> is ts type which changes all fields from data into non-obligatory
    * Enables to assign field from data that appeared into defined type 
    */
   
  constructor(data: Partial<SimulationRequestType>) {
    Object.assign(this, data);
  }
}

  