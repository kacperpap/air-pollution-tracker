import { ConflictException, Injectable } from '@nestjs/common';
import { CreateUserType } from 'src/modules/user/dto/create-user';
import { PrismaService } from '../prisma/prisma.service';
import * as argon2 from 'argon2'


@Injectable()
export class UserService {
    constructor(private readonly prisma: PrismaService) { }

    async create(createUser: CreateUserType) {
        const passHash = await argon2.hash(createUser.password);
        try {
            return await this.prisma.user.create({
                data: {
                    email: createUser.email,
                    name: createUser.name,
                    password: passHash,
                },
            });
        } catch (e) {
            if (e.code == 'P2002')
                throw new ConflictException('Użytkownik o podanym emailu już istnieje');
        }
    }

    async findOne(userId: number) {
        return this.prisma.user.findUnique({
            where: {
                id: userId,
            },
        });
    }
}