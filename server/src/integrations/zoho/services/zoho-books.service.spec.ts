import { ZohoBooksService } from './zoho-books.service';

describe('ZohoBooksService item tax payload', () => {
  function createService() {
    const values: Record<string, string> = {
      ZOHO_NON_GST_TAX_EXEMPTION_ID: 'exemption-id',
      ZOHO_PURCHASE_ACCOUNT_ID: 'purchase-account-id',
    };
    const configService = {
      getOrThrow: jest.fn((key: string) => values[key]),
    };
    const logger = {
      setContext: jest.fn(),
      info: jest.fn(),
      error: jest.fn(),
    };
    return new ZohoBooksService(configService as never, logger as never);
  }

  it.each([
    {
      name: 'Pooja',
      sellingPrice: 500,
      purchasePrice: 400,
      poojaId: 'pooja-id',
      vendorId: 'vendor-id',
    },
    {
      name: 'Wheat',
      sellingPrice: 100,
      purchasePrice: 80,
      offeringId: 'offering-id',
    },
  ])('marks $name as a Non-GST item', (input) => {
    const service = createService() as unknown as {
      _createItemPayload(value: typeof input): Record<string, unknown>;
    };

    expect(service._createItemPayload(input)).toMatchObject({
      name: input.name,
      is_taxable: false,
      tax_exemption_id: 'exemption-id',
    });
  });
});
