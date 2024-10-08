import { IsNotEmpty, IsNumber } from "class-validator";

export class SimulationResponseType {
  @IsNumber()
  @IsNotEmpty()
  id: number;

  @IsNumber()
  CO?: number;

  @IsNumber()
  O3?: number;

  @IsNumber()
  SO2?: number;

  @IsNumber()
  NO2?: number;


  constructor(data: Partial<SimulationResponseType>) {
    Object.assign(this, data);
  }
}
  