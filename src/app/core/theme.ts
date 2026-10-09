import { DOCUMENT } from '@angular/common';
import { Service, inject, signal } from '@angular/core';

@Service()
export class Theme {
  private readonly document = inject(DOCUMENT);
  readonly dark = signal(false);

  toggle(): void {
    this.dark.update((value) => !value);
    this.document.documentElement.classList.toggle('dark', this.dark());
  }
}
