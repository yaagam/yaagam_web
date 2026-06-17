import { Test, TestingModule } from '@nestjs/testing';
import { TemplesController } from './temples.controller';

describe('TemplesController', () => {
  let controller: TemplesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TemplesController],
    }).compile();

    controller = module.get<TemplesController>(TemplesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
