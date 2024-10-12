export type PollutionMeasurementType = {
    type: string;
    value: number | null;
};

export type DroneMeasurementType = {
    name: string;
    latitude: number | null;
    longitude: number | null;
    temperature: number | null;
    pressure: number | null;
    windSpeed: number | null;
    windDirection: number | null;
    pollutionMeasurements: PollutionMeasurementType[];
};