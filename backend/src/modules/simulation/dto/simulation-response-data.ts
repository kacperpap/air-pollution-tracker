import { IsNotEmpty, IsNumber, IsArray, IsOptional } from "class-validator";

class Box {
  @IsNumber()
  lat_min: number;

  @IsNumber()
  lat_max: number;

  @IsNumber()
  lon_min: number;

  @IsNumber()
  lon_max: number;
}

class Grid {
  @IsArray()
  @IsNotEmpty()
  boxes: Box[];
}

class StepPollutants {
  @IsOptional()
  @IsArray()
  CO?: number[];

  @IsOptional()
  @IsArray()
  O3?: number[];

  @IsOptional()
  @IsArray()
  NO2?: number[];

  @IsOptional()
  @IsArray()
  SO2?: number[];
}

class PollutantsData {
  @IsNotEmpty()
  final_step: StepPollutants;
}

class Environment {
  @IsArray()
  @IsNotEmpty()
  temperature: number[];

  @IsArray()
  @IsNotEmpty()
  pressure: number[];

  @IsArray()
  @IsNotEmpty()
  windSpeed: number[];

  @IsArray()
  @IsNotEmpty()
  windDirection: number[];
}

export class SimulationResponseType {
  @IsNotEmpty()
  grid: Grid;

  @IsNotEmpty()
  pollutants: PollutantsData;

  @IsNotEmpty()
  environment: Environment;

  constructor(data: Partial<SimulationResponseType>) {
    Object.assign(this, data);
  }
}
