import { Component, computed, input } from '@angular/core';

@Component({
  selector: 'app-live-radar',
  templateUrl: './live-radar.html',
})
export class LiveRadar {
  readonly currentCount = input(0);
  readonly maxCapacity = input(12);
  readonly todayTotal = input(0);
  readonly systemOnline = input(true);

  protected readonly occupancyPercentage = computed(() => {
    const max = this.maxCapacity() || 1;
    const current = this.currentCount();
    return Math.min(100, Math.round((current / max) * 100));
  });
}
