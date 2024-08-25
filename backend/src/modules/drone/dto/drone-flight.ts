import { IsNotEmpty, IsOptional, IsString } from "class-validator";
import { DroneMeasurementType } from "./drone-flight-measurement";

export class DroneFlightType {
    id: number
    title: string
    description?: string
    measurements: DroneMeasurementType[];
}