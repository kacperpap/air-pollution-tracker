import { DroneMeasurementType } from "./DroneMeasurementType"

export type DroneFlightType = {
    id: number | null,
    title: string,
    description?: string,
    date?: Date,
    measurements: DroneMeasurementType[];
}