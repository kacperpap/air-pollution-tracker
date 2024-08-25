import { IsNotEmpty, IsNumber, IsString } from "class-validator"

export class DroneMeasurementType {
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