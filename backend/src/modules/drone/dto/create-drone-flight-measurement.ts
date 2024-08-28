import { IsNotEmpty, IsNumber, IsString } from "class-validator"

export class CreateDroneMeasurementType {

    @IsString()
    @IsNotEmpty()
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