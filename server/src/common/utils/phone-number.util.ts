const INDIA_CALLING_CODE = '91';
const INDIAN_MOBILE_PATTERN = /^[6-9]\d{9}$/;
const E164_PATTERN = /^\+[1-9]\d{7,14}$/;

export function normalizeWhatsappNumber(value: unknown): unknown {
  if (typeof value !== 'string') return value;

  const normalized = value.trim().replace(/[\s()-]/g, '');
  if (INDIAN_MOBILE_PATTERN.test(normalized)) {
    return `+${INDIA_CALLING_CODE}${normalized}`;
  }

  return normalized;
}

export function isWhatsappNumber(value: string): boolean {
  return E164_PATTERN.test(value) || INDIAN_MOBILE_PATTERN.test(value);
}
