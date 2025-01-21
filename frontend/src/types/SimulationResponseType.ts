
export type EnvironmentType = {
  pressure: number[];
  temperature: number[];
  windSpeed: number[];
  windDirection: number[];
};

export type GridBoxType = {
  lat_max: number;
  lat_min: number;
  lon_max: number;
  lon_min: number;
};

export type GridType = {
  boxes: GridBoxType[];
};

export type PollutantDataType = {
  CO: number[];
  NO2: number[];
  O3: number[];
  SO2: number[];
};

export type PollutantsType = {
  final_step: PollutantDataType;
  steps: PollutantDataType[];
};

export type SimulationResponseType = {
  environment: EnvironmentType;
  grid: GridType;
  pollutants: PollutantsType;
};
