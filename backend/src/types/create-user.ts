import { IsEmail, IsString, MinLength } from 'class-validator';

export class CreateUserType {
    @IsEmail()
    email: string;

    @IsString()
    name: string;

    @IsString()
    @MinLength(8)
    password: string;
}