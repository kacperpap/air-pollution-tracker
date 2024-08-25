import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config'
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './modules/prisma/prisma.module';
import { UserModule } from './modules/user/user.module';
import { TokenModule } from './modules/token/token.module';
import { AuthModule } from './modules/auth/auth.module';
import { DroneService } from './modules/drone/drone.service';
import { DroneModule } from './modules/drone/drone.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    UserModule,
    TokenModule,
    AuthModule,
    DroneModule
  ],
  controllers: [AppController],
  providers: [AppService, DroneService],
})
export class AppModule { }
