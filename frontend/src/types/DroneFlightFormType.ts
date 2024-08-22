import { DroneMeasurementType } from "./DroneMeasurementType"

export type DroneFlightFormType = {
    title: string,
    description?: string,
    measurements: DroneMeasurementType[];
}