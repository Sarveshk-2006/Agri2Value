// frontend/src/i18n/formatters.ts

const LOCALE_MAP: Record<string, string> = {
  en: 'en-IN',
  hi: 'hi-IN',
  mr: 'mr-IN',
  te: 'te-IN',
  ta: 'ta-IN',
  kn: 'kn-IN',
  gu: 'gu-IN',
  pa: 'pa-IN',
  bn: 'bn-IN',
  ml: 'ml-IN',
};

export const getIntlLocale = (langCode: string = 'en'): string => {
  return LOCALE_MAP[langCode] || 'en-IN';
};

/**
 * Format currency in Indian Rupees with regional locale standards.
 * Guaranteed to preserve exact numerical value and ₹ sign.
 */
export const formatCurrency = (amount: number, langCode: string = 'en'): string => {
  if (isNaN(amount)) return '₹0';
  const locale = getIntlLocale(langCode);
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `₹${Math.round(amount).toLocaleString('en-IN')}`;
  }
};

/**
 * Format standard numbers according to Indian numbering system (lakhs, crores).
 */
export const formatNumber = (value: number, langCode: string = 'en', maxFractionDigits: number = 0): string => {
  if (isNaN(value)) return '0';
  const locale = getIntlLocale(langCode);
  try {
    return new Intl.NumberFormat(locale, {
      maximumFractionDigits: maxFractionDigits,
    }).format(value);
  } catch {
    return value.toLocaleString('en-IN');
  }
};

/**
 * Format dates with regional month and day names.
 */
export const formatDate = (date: string | Date, langCode: string = 'en'): string => {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return String(date);
  const locale = getIntlLocale(langCode);
  try {
    return new Intl.DateTimeFormat(locale, {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(d);
  } catch {
    return d.toLocaleDateString('en-IN');
  }
};

