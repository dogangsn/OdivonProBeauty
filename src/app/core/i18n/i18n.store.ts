import { DOCUMENT } from '@angular/common';
import { computed, inject, Service, signal } from '@angular/core';
import { CORE_DICTIONARIES, TranslationMap } from './core-dictionaries';
import {
  DEFAULT_LANGUAGE,
  LanguageOption,
  STORAGE_LANG_KEY,
  SUPPORTED_LANGUAGES,
  SupportedLang,
} from './i18n.types';

@Service()
export class I18nStore {
  private readonly document = inject(DOCUMENT);
  readonly currentLang = signal<SupportedLang>(this.detectInitialLanguage());
  readonly supportedLanguages = signal<LanguageOption[]>(SUPPORTED_LANGUAGES);

  readonly activeLanguageOption = computed(() => {
    const code = this.currentLang();
    return (
      this.supportedLanguages().find((lang) => lang.code === code) ??
      this.supportedLanguages()[0]
    );
  });

  readonly dir = computed(() => this.activeLanguageOption().dir);

  private readonly cache = new Map<SupportedLang, TranslationMap>();

  constructor() {
    for (const [lang, dict] of Object.entries(CORE_DICTIONARIES)) {
      this.cache.set(lang as SupportedLang, { ...dict });
    }
    const initial = this.currentLang();
    this.applyDocumentAttributes(initial, this.dir());
  }

  setLanguage(lang: SupportedLang): void {
    if (this.currentLang() === lang) return;
    this.currentLang.set(lang);

    try {
      this.document.defaultView?.localStorage.setItem(STORAGE_LANG_KEY, lang);
    } catch {
      /* Safe storage in private mode */
    }

    const dir = this.activeLanguageOption().dir;
    this.applyDocumentAttributes(lang, dir);
  }

  t(key: string, params?: Record<string, string | number>): string {
    const lang = this.currentLang();
    let text = this.cache.get(lang)?.[key];

    if (!text && lang !== DEFAULT_LANGUAGE) {
      text = this.cache.get(DEFAULT_LANGUAGE)?.[key];
    }
    if (!text) {
      text = key;
    }

    if (!params) return text;
    return text.replace(/\{{1,2}\s*([\w]+)\s*\}{1,2}/g, (_, p) =>
      params[p] !== undefined ? String(params[p]) : '',
    );
  }

  private applyDocumentAttributes(lang: SupportedLang, dir: 'ltr' | 'rtl'): void {
    const root = this.document.documentElement;
    if (!root) return;
    root.setAttribute('lang', lang);
    root.setAttribute('dir', dir);
    if (dir === 'rtl') {
      root.classList.add('rtl');
    } else {
      root.classList.remove('rtl');
    }
  }

  private detectInitialLanguage(): SupportedLang {
    try {
      const saved = this.document.defaultView?.localStorage.getItem(
        STORAGE_LANG_KEY,
      ) as SupportedLang | null;
      if (saved && SUPPORTED_LANGUAGES.some((lang) => lang.code === saved)) {
        return saved;
      }
    } catch {
      /* Ignore */
    }
    return DEFAULT_LANGUAGE;
  }
}
