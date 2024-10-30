import { DroneFlightType } from "./DroneFlightType";

  
  export type SimulationRequestType = {
    droneFlight: DroneFlightType;
    numSteps: number;
    dt: number;
    pollutants: string[];
    boxSize: [number | null, number | null];
    gridDensity: string;
    urbanized: boolean;
    marginBoxes: number;
    initialDistance: number;
  };