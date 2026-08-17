const INDIA_CALLING_CODE = '91';
const INDIAN_MOBILE_PATTERN = /^[6-9]\d{9}$/;
const E164_PATTERN = /^\+[1-9]\d{7,14}$/;

export function normalizeWhatsappNumber(value: unknown): unknown {
  if (typeof value !== 'string') return value;

  const normalized = value.trim().replace(/[\s()-]/g, '');
  const indianNationalNumber = normalized
    .replace(/^\+?91(?=[6-9]\d{9}$)/, '')
    .replace(/^0(?=[6-9]\d{9}$)/, '');

  if (INDIAN_MOBILE_PATTERN.test(indianNationalNumber)) {
    return `+${INDIA_CALLING_CODE}${indianNationalNumber}`;
  }

  return normalized;
}

export function normalizeIndianMobileNumber(value: unknown): unknown {
  if (typeof value !== 'string') return value;

  const normalized = value.trim().replace(/[\s()-]/g, '');
  const nationalNumber = normalized.replace(/^\+?91/, '').replace(/^0/, '');

  return INDIAN_MOBILE_PATTERN.test(nationalNumber)
    ? `+${INDIA_CALLING_CODE}${nationalNumber}`
    : normalized;
}

export function isWhatsappNumber(value: string): boolean {
  return E164_PATTERN.test(value) || INDIAN_MOBILE_PATTERN.test(value);
}
