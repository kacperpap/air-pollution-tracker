import { POLLUTANT_RANGES } from "./POLLUTANT_RANGES";

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
