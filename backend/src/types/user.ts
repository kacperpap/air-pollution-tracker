import { User } from '@prisma/client';
import { Exclude } from 'class-transformer';

export class UserType implements User {
    @Exclude()
    password: string;

    @Exclude()
    createdat: Date;


    id: number;
    name: string;
    email: string;
}