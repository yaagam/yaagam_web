import { validate } from 'class-validator';
import { SendChangeWhatsappOtpDto } from './send-change-whatsapp-otp.dto';

describe('SendChangeWhatsappOtpDto', () => {
  async function validateNumber(whatsappNumber: string) {
    const dto = new SendChangeWhatsappOtpDto();
    dto.whatsappNumber = whatsappNumber;

    return validate(dto);
  }

  it.each(['6123456789', '7987654321', '8123456789', '9876543210'])(
    'accepts Indian mobile number %s',
    async (whatsappNumber) => {
      await expect(validateNumber(whatsappNumber)).resolves.toHaveLength(0);
    },
  );

  it.each([
    '0123456789',
    '5123456789',
    '123456789',
    '98765432100',
    'abcdefghij',
  ])('rejects invalid mobile number %s', async (whatsappNumber) => {
    await expect(validateNumber(whatsappNumber)).resolves.not.toHaveLength(0);
  });
});
