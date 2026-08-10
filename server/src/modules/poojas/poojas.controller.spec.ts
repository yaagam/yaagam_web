import { Test, TestingModule } from '@nestjs/testing';
import { PoojasController } from './poojas.controller';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RoleGuard } from '../../common/guards/role.guard';
import { POOJA_SERVICE } from './constants/service-tokens.const';

describe('PoojasController', () => {
  let controller: PoojasController;
  let poojaService: {
    getPoojas: jest.Mock;
    getPoojaDetails: jest.Mock;
    createPooja: jest.Mock;
    updatePooja: jest.Mock;
    deletePooja: jest.Mock;
  };

  beforeEach(async () => {
    poojaService = {
      getPoojas: jest.fn(),
      getPoojaDetails: jest.fn(),
      createPooja: jest.fn(),
      updatePooja: jest.fn(),
      deletePooja: jest.fn(),
    };
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PoojasController],
      providers: [{ provide: POOJA_SERVICE, useValue: poojaService }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: jest.fn().mockReturnValue(true) })
      .overrideGuard(RoleGuard)
      .useValue({ canActivate: jest.fn().mockReturnValue(true) })
      .compile();

    controller = module.get<PoojasController>(PoojasController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('delegates list requests to the service', async () => {
    const response = { items: [], meta: { total: 0 } };
    poojaService.getPoojas.mockResolvedValue(response);

    await expect(controller.getPoojas({ page: 1, limit: 10 })).resolves.toBe(
      response,
    );
    expect(poojaService.getPoojas).toHaveBeenCalledWith({
      page: 1,
      limit: 10,
    });
  });
});
