import { DroneFlightType } from "../../types/DroneFlightType";
import { SimulationLightType } from "../../types/SimulationLightType";
import { SimulationResponseType } from "../../types/SimulationResponseType";
import { POLLUTANT_RANGES } from "./POLLUTANT_RANGES";

export interface MapState {
    map: L.Map | null;
    simulationId: number | null
    simulationData: SimulationResponseType | null;
    simulationLightData: SimulationLightType | null;
    selectedParameter: string;
    availableParameters: string[];
    rectangles: L.Rectangle[];
    windArrows: L.Polyline[];
    flightId: number | null;
    flightData: DroneFlightType | null;
    markers: L.Marker[];
}

export type Box = {
    lat_min: number;
    lat_max: number;
    lon_min: number;
    lon_max: number;
};

export type Range = {
    min: number;
    max: number;
    label?: string;
}

export type PollutantParameter = keyof typeof POLLUTANT_RANGES;
