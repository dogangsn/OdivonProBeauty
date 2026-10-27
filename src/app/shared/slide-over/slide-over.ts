import { CdkTrapFocus } from '@angular/cdk/a11y';
import { Component, input, output, signal } from '@angular/core';

@Component({
  host: {
    '(document:keydown.escape)': 'requestClose()',
  },
  imports: [CdkTrapFocus],
  selector: 'app-slide-over',
  styleUrl: './slide-over.css',
  templateUrl: './slide-over.html',
})
export class SlideOver {
  readonly title = input.required<string>();
  readonly description = input('Bilgileri eksiksiz doldurarak kaydedin.');
  readonly eyebrow = input('Yeni kayıt');
  readonly allowExpand = input<boolean>(true);
  readonly closed = output<void>();

  protected readonly isExpanded = signal<boolean>(false);

  protected toggleExpand(): void {
    this.isExpanded.update((v) => !v);
  }

  protected requestClose(): void {
    this.closed.emit();
  }
}
