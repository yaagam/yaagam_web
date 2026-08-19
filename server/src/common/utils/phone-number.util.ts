const INDIA_CALLING_CODE = '91';
const INDIAN_MOBILE_PATTERN = /^[6-9]\d{9}$/;
const E164_PATTERN = /^\+[1-9]\d{7,14}$/;

function normalizeIndianNumber(value: string): string {
  const normalized = value.trim().replace(/[\s()-]/g, '');
  let digits = normalized.replace(/^\+/, '');

  while (digits.length > 10) {
    if (digits.startsWith('0')) {
      digits = digits.slice(1);
      continue;
    }
    if (digits.startsWith(INDIA_CALLING_CODE)) {
      digits = digits.slice(INDIA_CALLING_CODE.length);
      continue;
    }
    break;
  }

  return INDIAN_MOBILE_PATTERN.test(digits)
    ? `+${INDIA_CALLING_CODE}${digits}`
    : normalized;
}

export function normalizeWhatsappNumber(value: unknown): unknown {
  return typeof value === 'string' ? normalizeIndianNumber(value) : value;
}

export function normalizeIndianMobileNumber(value: unknown): unknown {
  return typeof value === 'string' ? normalizeIndianNumber(value) : value;
}

export function isWhatsappNumber(value: string): boolean {
  return E164_PATTERN.test(value) || INDIAN_MOBILE_PATTERN.test(value);
}
