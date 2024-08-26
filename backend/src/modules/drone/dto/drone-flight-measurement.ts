import { IsNotEmpty, IsNumber, IsString } from "class-validator"

export class DroneMeasurementType {
    id: number
    @IsString()
    name: string

    @IsNumber()
    @IsNotEmpty()
    latitude: number

    @IsNumber()
    @IsNotEmpty()
    longitude: number

    @IsNumber()
    @IsNotEmpty()
    temperature: number
}