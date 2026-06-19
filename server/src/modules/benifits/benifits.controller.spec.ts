import { Test, TestingModule } from '@nestjs/testing';
import { BenifitsController } from './benifits.controller';
import { BENIFIT_SERVICE } from './constants/service-tokens.const';
import { JwtAuthGuard } from '../../common/gurads/jwt-auth.guard';
import { RoleGuard } from '../../common/gurads/role.guard';

describe('BenifitsController', () => {
  let controller: BenifitsController;
  let benifitService: {
    getBenifits: jest.Mock;
    getBenifitDetails: jest.Mock;
    createBenifit: jest.Mock;
    updateBenifit: jest.Mock;
    deleteBenifit: jest.Mock;
  };

  beforeEach(async () => {
    benifitService = {
      getBenifits: jest.fn(),
      getBenifitDetails: jest.fn(),
      createBenifit: jest.fn(),
      updateBenifit: jest.fn(),
      deleteBenifit: jest.fn(),
    };
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BenifitsController],
      providers: [{ provide: BENIFIT_SERVICE, useValue: benifitService }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: jest.fn().mockReturnValue(true) })
      .overrideGuard(RoleGuard)
      .useValue({ canActivate: jest.fn().mockReturnValue(true) })
      .compile();

    controller = module.get<BenifitsController>(BenifitsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('delegates list requests to the service', async () => {
    const response = { items: [], meta: { total: 0 } };
    benifitService.getBenifits.mockResolvedValue(response);

    await expect(controller.getBenifits({ page: 1, limit: 10 })).resolves.toBe(
      response,
    );
    expect(benifitService.getBenifits).toHaveBeenCalledWith({
      page: 1,
      limit: 10,
    });
  });
});
