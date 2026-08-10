import { Test, TestingModule } from '@nestjs/testing';
import { TemplesController } from './temples.controller';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RoleGuard } from '../../common/guards/role.guard';
import { TEMPLE_SERVICE } from './constants/service-tokens.const';

describe('TemplesController', () => {
  let controller: TemplesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TemplesController],
      providers: [
        {
          provide: TEMPLE_SERVICE,
          useValue: {
            getTemples: jest.fn(),
            getTempleDetails: jest.fn(),
            createTemple: jest.fn(),
            updateTemple: jest.fn(),
            deleteTemple: jest.fn(),
          },
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .overrideGuard(RoleGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<TemplesController>(TemplesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
