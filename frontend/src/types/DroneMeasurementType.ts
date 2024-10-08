export type DroneMeasurementType = {
    name: string,
    latitude: number | null,
    longitude: number | null,
    temperature: number | null,
    pressure: number | null,
    windSpeed: number | null,
    windDirection: number | null,
    CO: number | null,
    O3: number | null,
    SO2: number | null,
    NO2: number | null
}