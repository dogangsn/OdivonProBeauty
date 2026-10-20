import { Component, input } from '@angular/core';

@Component({
  selector: 'app-kpi-card',
  styleUrl: './kpi-card.css',
  templateUrl: './kpi-card.html',
})
export class KpiCard {
  readonly label = input.required<string>();
  readonly value = input.required<string>();
  readonly detail = input.required<string>();
  readonly tone = input<'indigo' | 'emerald' | 'amber' | 'rose' | 'hero'>('indigo');
  readonly icon = input<string>('');
}
