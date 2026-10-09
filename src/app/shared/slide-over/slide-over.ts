import { Component, input, output } from '@angular/core';

@Component({
  imports: [],
  selector: 'app-slide-over',
  styleUrl: './slide-over.css',
  templateUrl: './slide-over.html',
})
export class SlideOver {
  readonly title = input.required<string>();
  readonly description = input('Bilgileri eksiksiz doldurarak kaydedin.');
  readonly closed = output<void>();
}
