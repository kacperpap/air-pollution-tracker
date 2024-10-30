import { Module } from '@nestjs/common';
import { SimulationService } from './simulation.service';
import { SimulationController } from './simulation.controller';
import { RabbitMQService } from '../rabbitmq/rabbitmq.service';
import { RabbitMQModule } from '../rabbitmq/rabbitmq.module';
import { DroneModule } from '../drone/drone.module';

@Module({
  imports: [RabbitMQModule, DroneModule],
  providers: [SimulationService, RabbitMQService],
  controllers: [SimulationController]
})
export class SimulationModule {}
