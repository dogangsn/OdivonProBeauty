import { inject, Pipe, PipeTransform } from '@angular/core';
import { I18nStore } from './i18n.store';

@Pipe({
  name: 't',
  pure: false,
})
export class TranslatePipe implements PipeTransform {
  private readonly store = inject(I18nStore);

  transform(
    key: string | null | undefined,
    params?: Record<string, string | number>,
  ): string {
    if (!key) return '';
    return this.store.t(key, params);
  }
}
