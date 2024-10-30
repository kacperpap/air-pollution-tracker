import { Test, TestingModule } from '@nestjs/testing';
import { DroneController } from './drone.controller';

describe('DroneController', () => {
  let controller: DroneController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DroneController],
    }).compile();

    controller = module.get<DroneController>(DroneController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
