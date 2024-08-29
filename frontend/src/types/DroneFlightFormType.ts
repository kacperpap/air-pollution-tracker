import { DroneMeasurementType } from "./DroneMeasurementType"

export type DroneFlightFormType = {
    title: string,
    description?: string,
    date?: Date,
    measurements: DroneMeasurementType[];
}