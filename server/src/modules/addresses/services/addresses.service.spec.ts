import { AddressesService } from './addresses.service';

describe('AddressesService', () => {
  const savedAddress = {
    id: 'address-id',
    userId: 'user-id',
    houseNo: '10/20',
    roadName: 'Temple Road',
    phoneNumber: '9876543210',
    state: 'Kerala',
    district: 'Ernakulam',
    pincode: '682030',
    isDefault: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  it('returns the default or latest saved address for the signed-in user', async () => {
    const prisma = {
      address: { findFirst: jest.fn().mockResolvedValue(savedAddress) },
    };
    const service = new AddressesService(prisma as never, {} as never);

    await expect(service.getSavedAddress('user-id')).resolves.toEqual({
      houseNo: '10/20',
      streetName: 'Temple Road',
      phoneNumber: '9876543210',
      state: 'Kerala',
      district: 'Ernakulam',
      pincode: '682030',
    });
    expect(prisma.address.findFirst).toHaveBeenCalledWith({
      where: { userId: 'user-id' },
      orderBy: [{ isDefault: 'desc' }, { updatedAt: 'desc' }],
    });
  });
});
