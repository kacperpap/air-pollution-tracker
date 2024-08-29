import { IsDate, IsNotEmpty, IsOptional, IsString } from "class-validator";
import { CreateDroneMeasurementType } from "./create-drone-flight-measurement";

export class CreateDroneFlightType {
    
    @IsString()
    @IsNotEmpty()
    title: string

    @IsOptional()
    @IsString()
    description?: string

    /**
     * Formally, frontend creates Date instance and converts it to the ISOstring
     * then passes it via fetch post methond in body.stringify, which makes all 
     * in request a json strings, so geting date on backend site requires taking it as
     * an ISOstring, and converting it to the Date instance and then saving into db as timestamp
     */
    @IsOptional()
    @IsString()
    date?: Date | string

    @IsNotEmpty()
    measurements: CreateDroneMeasurementType[];
}
