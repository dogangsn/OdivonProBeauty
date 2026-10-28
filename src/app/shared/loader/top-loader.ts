import { Component, DestroyRef, effect, inject, signal } from '@angular/core';
import {
  NavigationCancel,
  NavigationEnd,
  NavigationError,
  NavigationStart,
  Router,
} from '@angular/router';
import { LoadingService } from '../../core/loading/loading.service';

/** Delay before the bar appears, so very fast requests do not flash it. */
const SHOW_DELAY_MS = 180;

@Component({
  selector: 'app-top-loader',
  template: `
    <div class="top-loader" [class.top-loader--visible]="visible()" aria-hidden="true">
      <div class="top-loader__bar"></div>
    </div>
  `,
  styles: `
    .top-loader {
      position: fixed;
      inset: 0 0 auto 0;
      z-index: 9999;
      height: 3px;
      overflow: hidden;
      pointer-events: none;
      opacity: 0;
      transition: opacity 240ms ease;
    }
    .top-loader--visible {
      opacity: 1;
    }
    .top-loader__bar {
      position: absolute;
      inset: 0 auto 0 0;
      width: 40%;
      border-radius: 999px;
      background: linear-gradient(90deg, #6366f1, #8b5cf6, #d946ef);
      box-shadow: 0 0 12px rgb(139 92 246 / 0.65);
      animation: top-loader-slide 1.15s cubic-bezier(0.65, 0, 0.35, 1) infinite;
    }
    @keyframes top-loader-slide {
      0% {
        transform: translateX(-110%);
      }
      100% {
        transform: translateX(260%);
      }
    }
    @media (prefers-reduced-motion: reduce) {
      .top-loader__bar {
        width: 100%;
        animation: none;
      }
    }
  `,
})
export class TopLoader {
  private readonly loading = inject(LoadingService);
  protected readonly visible = signal(false);

  constructor() {
    const router = inject(Router);
    const subscription = router.events.subscribe((event) => {
      if (event instanceof NavigationStart) this.loading.start();
      if (
        event instanceof NavigationEnd ||
        event instanceof NavigationCancel ||
        event instanceof NavigationError
      ) {
        this.loading.stop();
      }
    });
    inject(DestroyRef).onDestroy(() => subscription.unsubscribe());

    effect((onCleanup) => {
      if (!this.loading.active()) {
        this.visible.set(false);
        return;
      }
      const timer = setTimeout(() => this.visible.set(true), SHOW_DELAY_MS);
      onCleanup(() => clearTimeout(timer));
    });
  }
}
