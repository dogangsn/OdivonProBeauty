import { Component, computed, input } from '@angular/core';

@Component({
  imports: [],
  selector: 'app-status-badge',
  styleUrl: './status-badge.css',
  templateUrl: './status-badge.html',
})
export class StatusBadge {
  readonly status = input.required<string>();
  protected readonly className = computed(() => {
    const status = this.status();
    if (['active', 'paid', 'completed', 'ready', 'healthy', 'configured', 'available', 'vip'].includes(status)) return 'status status--positive';
    if (['critical', 'refunded', 'cancelled', 'maintenance'].includes(status)) return 'status status--danger';
    if (['draft', 'partial', 'due', 'review', 'processing', 'not-configured'].includes(status)) return 'status status--warning';
    return 'status status--info';
  });
}
