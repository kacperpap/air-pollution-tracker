import { DroneFlightType } from "./DroneFlightType";

  
  export type SimulationRequestType = {
    droneFlight: DroneFlightType;
    numSteps: number;
    pollutants: string[];
    gridDensity: string;
    urbanized: boolean;
    marginBoxes: number;
    initialDistance: number;
    decayRate: number;
    snapInterval: number;
  };