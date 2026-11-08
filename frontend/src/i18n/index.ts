// frontend/src/i18n/index.ts
import i18n from 'i18next';
import { initReactI18next, useTranslation } from 'react-i18next';
import { en } from './locales/en';
import { hi } from './locales/hi';
import { mr } from './locales/mr';
import { te } from './locales/te';
import { ta } from './locales/ta';
import { kn } from './locales/kn';
import { gu } from './locales/gu';
import { pa } from './locales/pa';
import { bn } from './locales/bn';
import { ml } from './locales/ml';

export interface LanguageOption {
  code: string;
  name: string; // Native name
  englishName: string;
  locale: string;
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: 'en', name: 'English', englishName: 'English', locale: 'en-IN' },
  { code: 'hi', name: 'हिंदी', englishName: 'Hindi', locale: 'hi-IN' },
  { code: 'mr', name: 'मराठी', englishName: 'Marathi', locale: 'mr-IN' },
  { code: 'te', name: 'తెలుగు', englishName: 'Telugu', locale: 'te-IN' },
  { code: 'ta', name: 'தமிழ்', englishName: 'Tamil', locale: 'ta-IN' },
  { code: 'kn', name: 'ಕನ್ನಡ', englishName: 'Kannada', locale: 'kn-IN' },
  { code: 'gu', name: 'ગુજરાતી', englishName: 'Gujarati', locale: 'gu-IN' },
  { code: 'pa', name: 'ਪੰਜਾਬੀ', englishName: 'Punjabi', locale: 'pa-IN' },
  { code: 'bn', name: 'বাংলা', englishName: 'Bengali', locale: 'bn-IN' },
  { code: 'ml', name: 'മലയാളം', englishName: 'Malayalam', locale: 'ml-IN' },
];

export const STORAGE_KEY = 'agri2value_language';

// Read saved preference, URL query param, or default to English
const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
const urlLang = urlParams?.get('lang');
const savedLanguage = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
const candidateLang = urlLang || savedLanguage || 'en';
const initialLang = SUPPORTED_LANGUAGES.some(l => l.code === candidateLang) ? candidateLang : 'en';

// If URL specified language, sync localStorage immediately
if (typeof window !== 'undefined' && urlLang && SUPPORTED_LANGUAGES.some(l => l.code === urlLang)) {
  localStorage.setItem(STORAGE_KEY, urlLang);
  document.documentElement.lang = urlLang;
}

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      hi: { translation: hi },
      mr: { translation: mr },
      te: { translation: te },
      ta: { translation: ta },
      kn: { translation: kn },
      gu: { translation: gu },
      pa: { translation: pa },
      bn: { translation: bn },
      ml: { translation: ml },
    },
    lng: initialLang,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false, // React already escapes values
    },
    react: {
      useSuspense: false,
    },
  });

/**
 * Change application language across i18next, localStorage, cookies, and document attributes.
 */
export const changeAppLanguage = async (code: string) => {
  if (!SUPPORTED_LANGUAGES.some(l => l.code === code)) {
    code = 'en';
  }

  // 1. Update i18next
  await i18n.changeLanguage(code);

  // 2. Persist in localStorage
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, code);

    // 3. Update document language attribute for accessibility and screen readers
    document.documentElement.lang = code;

    // 4. Synchronize Google Translate cookie for silent dynamic translation fallback
    if (code === 'en') {
      document.cookie = 'googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; domain=${window.location.hostname}; path=/;`;
    } else {
      document.cookie = `googtrans=/en/${code}; path=/;`;
      document.cookie = `googtrans=/en/${code}; domain=${window.location.hostname}; path=/;`;
    }

    // 5. Dispatch custom event for reactive UI updates
    window.dispatchEvent(new CustomEvent('agri2value:languageChanged', { detail: { language: code } }));

    // 6. Asynchronously sync to backend account profile if user is logged in
    try {
      import('../api').then(({ api }) => {
        if (api.hasToken && api.hasToken()) {
          api.updatePreferredLanguage(code).catch(() => {});
        }
      });
    } catch {
      // Ignored in offline mode
    }
  }

  return code;
};

export default i18n;
export { useTranslation };
