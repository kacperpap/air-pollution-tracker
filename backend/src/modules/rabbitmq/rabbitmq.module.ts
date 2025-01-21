import { forwardRef, Module } from '@nestjs/common';
import { RabbitMQService } from './rabbitmq.service';
import { SimulationModule } from '../simulation/simulation.module';

@Module({
  providers: [RabbitMQService],
  exports: [RabbitMQService], 
  imports: [forwardRef(() => SimulationModule)]
})
export class RabbitMQModule {}
