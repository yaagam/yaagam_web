import {
  normalizeIndianMobileNumber,
  normalizeWhatsappNumber,
} from './phone-number.util';

describe('phone number normalization', () => {
  it.each([
    ['8157988287', '+918157988287'],
    ['08157988287', '+918157988287'],
    ['+918157988287', '+918157988287'],
    ['+9108157988287', '+918157988287'],
    ['+91918157988287', '+918157988287'],
  ])('canonicalizes %s to %s', (input, expected) => {
    expect(normalizeWhatsappNumber(input)).toBe(expected);
    expect(normalizeIndianMobileNumber(input)).toBe(expected);
  });
});
