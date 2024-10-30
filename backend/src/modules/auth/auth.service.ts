import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { User } from '@prisma/client';
import * as argon2 from 'argon2'

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}

  async verifyUser(username: string, password: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: {
        email: username,
      },
    });

    if (!user) return null;

    const isValid = await argon2.verify(user.password, password);

    if (!isValid) return null;

    return user;
  }
}
