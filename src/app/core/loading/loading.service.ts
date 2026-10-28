import { Service, computed, signal } from '@angular/core';

/** Counts in-flight work (HTTP requests, route loads) so the global top bar can show progress. */
@Service()
export class LoadingService {
  private readonly pending = signal(0);
  readonly active = computed(() => this.pending() > 0);

  start(): void {
    this.pending.update((count) => count + 1);
  }

  stop(): void {
    this.pending.update((count) => Math.max(0, count - 1));
  }
}
