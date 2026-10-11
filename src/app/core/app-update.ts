import { DOCUMENT } from '@angular/common';
import { DestroyRef, Service, inject } from '@angular/core';
import { SwUpdate, VersionEvent } from '@angular/service-worker';
import { catchError, filter, from, interval, of, startWith, switchMap } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

const UPDATE_CHECK_INTERVAL_MS = 60 * 60 * 1000;

@Service()
export class AppUpdate {
  private readonly destroyRef = inject(DestroyRef);
  private readonly document = inject(DOCUMENT);
  private readonly swUpdate = inject(SwUpdate);
  private started = false;

  start(): void {
    if (this.started || !this.swUpdate.isEnabled) {
      return;
    }

    this.started = true;

    this.swUpdate.versionUpdates
      .pipe(
        filter((event: VersionEvent) => event.type === 'VERSION_READY'),
        switchMap(() => from(this.swUpdate.activateUpdate())),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => this.document.defaultView?.location.reload());

    interval(UPDATE_CHECK_INTERVAL_MS)
      .pipe(
        startWith(0),
        switchMap(() => from(this.swUpdate.checkForUpdate())),
        catchError(() => of(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }
}
