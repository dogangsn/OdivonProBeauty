import { Component, computed, inject, signal } from '@angular/core';
import { I18nStore } from '../../core/i18n/i18n.store';
import { SupportedLang } from '../../core/i18n/i18n.types';

@Component({
  host: {
    '(document:click)': 'closeOnOutsideClick()',
    class: 'relative inline-block text-left',
  },
  selector: 'app-language-selector',
  templateUrl: './language-selector.html',
})
export class LanguageSelector {
  protected readonly i18n = inject(I18nStore);
  protected readonly isOpen = signal(false);

  protected readonly options = computed(() => this.i18n.supportedLanguages());
  protected readonly currentLang = computed(() => this.i18n.currentLang());
  protected readonly activeOption = computed(() => this.i18n.activeLanguageOption());

  protected toggleOpen(event?: MouseEvent): void {
    event?.stopPropagation();
    this.isOpen.update((v) => !v);
  }

  protected selectLanguage(code: SupportedLang, event?: MouseEvent): void {
    event?.stopPropagation();
    this.i18n.setLanguage(code);
    this.isOpen.set(false);
  }

  protected closeOnOutsideClick(): void {
    if (this.isOpen()) {
      this.isOpen.set(false);
    }
  }
}
