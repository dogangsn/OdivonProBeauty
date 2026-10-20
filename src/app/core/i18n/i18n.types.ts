export type SupportedLang = 'tr' | 'en' | 'de' | 'fr' | 'es' | 'ar';
export type Direction = 'ltr' | 'rtl';

export interface LanguageOption {
  code: SupportedLang;
  label: string;
  nativeName: string;
  flag: string;
  dir: Direction;
}

export const DEFAULT_LANGUAGE: SupportedLang = 'tr';
export const STORAGE_LANG_KEY = 'odivon:preferred_lang';

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: 'tr', label: 'Türkçe', nativeName: 'Türkçe', flag: '🇹🇷', dir: 'ltr' },
  { code: 'en', label: 'English', nativeName: 'English', flag: '🇬🇧', dir: 'ltr' },
  { code: 'de', label: 'Deutsch', nativeName: 'Deutsch', flag: '🇩🇪', dir: 'ltr' },
  { code: 'fr', label: 'Français', nativeName: 'Français', flag: '🇫🇷', dir: 'ltr' },
  { code: 'es', label: 'Español', nativeName: 'Español', flag: '🇪🇸', dir: 'ltr' },
  { code: 'ar', label: 'العربية', nativeName: 'العربية', flag: '🇦🇪', dir: 'rtl' },
];
