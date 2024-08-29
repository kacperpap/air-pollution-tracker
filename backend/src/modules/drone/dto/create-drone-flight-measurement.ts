import { IsNotEmpty, IsNumber, IsString } from "class-validator"

export class CreateDroneMeasurementType {

    @IsString()
    @IsNotEmpty()
    name: string

    @IsNotEmpty()
    latitude: string | number

    @IsNotEmpty()
    longitude: string | number

    @IsNotEmpty()
    temperature: string | number
}