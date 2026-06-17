import { Test, TestingModule } from '@nestjs/testing';
import { PoojasController } from './poojas.controller';

describe('PoojasController', () => {
  let controller: PoojasController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PoojasController],
    }).compile();

    controller = module.get<PoojasController>(PoojasController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
