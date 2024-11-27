import { DroneMeasurementType } from "../../types/DroneMeasurementType";
import { SimulationResponseType } from "../../types/SimulationResponseType";
import { POLLUTANT_RANGES } from "./POLLUTANT_RANGES";

export interface MapState {
    map: L.Map | null;
    selectedParameter: string;
    availableParameters: string[];
    rectangles: L.Rectangle[];
    windArrows: L.Polyline[];
    simulationData?: SimulationResponseType;
    flightData: DroneMeasurementType[];
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
