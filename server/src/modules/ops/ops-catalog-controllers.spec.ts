import type { Request } from 'express';
import { OpsBenifitsController } from './benifits/ops-benifits.controller';
import { OpsPoojasController } from './poojas/ops-poojas.controller';
import { OpsTemplesController } from './temples/ops-temples.controller';
import { OpsOfferingsController } from './offerings/ops-offerings.controller';

const operator = { operatorId: 'operator-id' };
const request = {
  ip: '127.0.0.1',
  get: jest.fn().mockReturnValue('jest'),
} as unknown as Request;

describe('ops catalog CRUD controllers', () => {
  it('delegates every temple CRUD route and audits mutations', async () => {
    const response = { id: 'temple-id', email: 'temple@example.com' };
    const service = {
      getOpsTemples: jest.fn().mockResolvedValue({ items: [] }),
      getTempleDetails: jest.fn().mockResolvedValue(response),
      createTemple: jest.fn().mockResolvedValue(response),
      updateTemple: jest.fn().mockResolvedValue(response),
      deleteTemple: jest.fn().mockResolvedValue(response),
    };
    const audit = { log: jest.fn().mockResolvedValue(undefined) };
    const controller = new OpsTemplesController(service as never, audit);

    await controller.getTemples({ page: 1, limit: 10 });
    await expect(
      controller.getTempleDetails({ id: 'temple-id' }),
    ).resolves.toBe(response);
    await controller.createTemple({} as never, undefined, operator, request);
    await controller.updateTemple(
      { id: 'temple-id' },
      {},
      undefined,
      operator,
      request,
    );
    await controller.deleteTemple({ id: 'temple-id' }, operator, request);

    expect(service.getOpsTemples).toHaveBeenCalledWith({ page: 1, limit: 10 });
    expect(service.getTempleDetails).toHaveBeenCalledWith('temple-id');
    expect(service.createTemple).toHaveBeenCalledWith({}, undefined);
    expect(service.updateTemple).toHaveBeenCalledWith(
      'temple-id',
      {},
      undefined,
    );
    expect(service.deleteTemple).toHaveBeenCalledWith('temple-id');
    expect(audit.log).toHaveBeenCalledTimes(3);
  });

  it('delegates every pooja CRUD route and audits mutations', async () => {
    const response = { id: 'pooja-id' };
    const service = {
      getOpsPoojas: jest.fn().mockResolvedValue({ items: [] }),
      getPoojaDetails: jest.fn().mockResolvedValue(response),
      createPooja: jest.fn().mockResolvedValue(response),
      updatePooja: jest.fn().mockResolvedValue(response),
      deletePooja: jest.fn().mockResolvedValue(response),
    };
    const audit = { log: jest.fn().mockResolvedValue(undefined) };
    const controller = new OpsPoojasController(service as never, audit);

    await controller.getPoojas({ page: 1, limit: 10 });
    await expect(controller.getPoojaDetails({ id: 'pooja-id' })).resolves.toBe(
      response,
    );
    await controller.createPooja({} as never, undefined, operator, request);
    await controller.updatePooja(
      { id: 'pooja-id' },
      {},
      undefined,
      operator,
      request,
    );
    await controller.deletePooja({ id: 'pooja-id' }, operator, request);

    expect(service.getOpsPoojas).toHaveBeenCalledWith({ page: 1, limit: 10 });
    expect(service.getPoojaDetails).toHaveBeenCalledWith('pooja-id');
    expect(service.createPooja).toHaveBeenCalledWith({}, undefined);
    expect(service.updatePooja).toHaveBeenCalledWith('pooja-id', {}, undefined);
    expect(service.deletePooja).toHaveBeenCalledWith('pooja-id');
    expect(audit.log).toHaveBeenCalledTimes(3);
  });

  it('delegates every benifit CRUD route', async () => {
    const response = { id: 'benefit-id' };
    const service = {
      getBenifits: jest.fn().mockResolvedValue({ items: [] }),
      getBenifitDetails: jest.fn().mockResolvedValue(response),
      createBenifit: jest.fn().mockResolvedValue(response),
      updateBenifit: jest.fn().mockResolvedValue(response),
      deleteBenifit: jest.fn().mockResolvedValue(response),
    };
    const controller = new OpsBenifitsController(service);

    await controller.getBenifits({ page: 1, limit: 10 });
    await expect(controller.getBenifit({ id: 'benefit-id' })).resolves.toBe(
      response,
    );
    await controller.createBenifit({} as never, undefined);
    await controller.updateBenifit({ id: 'benefit-id' }, {}, undefined);
    await controller.deleteBenifit({ id: 'benefit-id' });

    expect(service.getBenifits).toHaveBeenCalledWith({ page: 1, limit: 10 });
    expect(service.getBenifitDetails).toHaveBeenCalledWith('benefit-id');
    expect(service.createBenifit).toHaveBeenCalledWith({}, undefined);
    expect(service.updateBenifit).toHaveBeenCalledWith(
      'benefit-id',
      {},
      undefined,
    );
    expect(service.deleteBenifit).toHaveBeenCalledWith('benefit-id');
  });

  it('delegates Offering CRUD and Zoho retry routes', async () => {
    const response = { id: 'offering-id' };
    const service = {
      getOpsOfferings: jest.fn().mockResolvedValue({ items: [] }),
      getOfferingDetails: jest.fn().mockResolvedValue(response),
      createOffering: jest.fn().mockResolvedValue(response),
      updateOffering: jest.fn().mockResolvedValue(response),
      deleteOffering: jest.fn().mockResolvedValue(response),
      syncOfferingWithZoho: jest.fn().mockResolvedValue(response),
    };
    const controller = new OpsOfferingsController(service as never);

    await controller.getOfferings({ page: 1, limit: 10 });
    await controller.getOffering({ id: 'offering-id' });
    await controller.createOffering({} as never, undefined);
    await controller.updateOffering({ id: 'offering-id' }, {}, undefined);
    await controller.syncOfferingWithZoho({ id: 'offering-id' });
    await controller.deleteOffering({ id: 'offering-id' });

    expect(service.getOpsOfferings).toHaveBeenCalledWith({
      page: 1,
      limit: 10,
    });
    expect(service.getOfferingDetails).toHaveBeenCalledWith('offering-id');
    expect(service.createOffering).toHaveBeenCalledWith({}, undefined);
    expect(service.updateOffering).toHaveBeenCalledWith(
      'offering-id',
      {},
      undefined,
    );
    expect(service.syncOfferingWithZoho).toHaveBeenCalledWith('offering-id');
    expect(service.deleteOffering).toHaveBeenCalledWith('offering-id');
  });
});
