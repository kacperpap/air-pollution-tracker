import { forwardRef, Module } from '@nestjs/common';
import { SimulationService } from './simulation.service';
import { SimulationController } from './simulation.controller';
import { DroneModule } from '../drone/drone.module';
import { PrismaModule } from '../prisma/prisma.module';
import { RabbitMQModule } from '../rabbitmq/rabbitmq.module';

@Module({
  imports: [forwardRef(() => RabbitMQModule), DroneModule, PrismaModule],
  providers: [SimulationService],
  controllers: [SimulationController],
  exports: [SimulationService]
})
export class SimulationModule {}
