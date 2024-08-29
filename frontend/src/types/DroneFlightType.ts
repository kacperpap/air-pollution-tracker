import { DroneMeasurementType } from "./DroneMeasurementType"

export type DroneFlightType = {
    id: number,
    title: string,
    description?: string,
    date?: Date,
    measurements: DroneMeasurementType[];
}