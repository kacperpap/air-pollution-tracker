import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { BasicGuard } from './basic.guard';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthController } from './auth.controller';

@Module({
  providers: [AuthService, BasicGuard],
  imports: [PrismaModule],
  controllers: [AuthController],
})
export class AuthModule {}
