import { Module } from '@nestjs/common';
import { DroneController } from './drone.controller';
import { DroneService } from './drone.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  providers: [DroneService],
  controllers: [DroneController],
  imports: [PrismaModule],
  exports: [DroneService]
})
export class DroneModule {}
