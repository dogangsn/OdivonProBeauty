import { Component, input } from '@angular/core';

/** Branded spinner with an optional caption, for any area that waits on data. */
@Component({
  selector: 'app-loader',
  host: {
    role: 'status',
    'aria-live': 'polite',
    class: 'app-loader',
    '[class.app-loader--sm]': "size() === 'sm'",
    '[class.app-loader--lg]': "size() === 'lg'",
    '[class.app-loader--inline]': 'inline()',
  },
  template: `
    <span class="app-loader__ring" aria-hidden="true"></span>
    @if (label()) {
      <span class="app-loader__label">{{ label() }}</span>
    } @else {
      <span class="sr-only">Yükleniyor</span>
    }
  `,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 0.85rem;
      padding: 2.5rem 1rem;
      text-align: center;
      --loader-size: 2.75rem;
    }
    :host(.app-loader--sm) {
      --loader-size: 1.5rem;
      padding: 1rem;
      gap: 0.6rem;
    }
    :host(.app-loader--lg) {
      --loader-size: 3.75rem;
      padding: 4rem 1rem;
    }
    :host(.app-loader--inline) {
      flex-direction: row;
      justify-content: flex-start;
      padding: 0.5rem 0;
    }
    .app-loader__ring {
      position: relative;
      display: grid;
      place-items: center;
      width: var(--loader-size);
      height: var(--loader-size);
      border-radius: 999px;
      background: conic-gradient(
        from 0deg,
        transparent 0deg,
        #6366f1 140deg,
        #8b5cf6 240deg,
        #d946ef 360deg
      );
      -webkit-mask: radial-gradient(
        farthest-side,
        transparent calc(100% - 4px),
        #000 calc(100% - 3px)
      );
      mask: radial-gradient(farthest-side, transparent calc(100% - 4px), #000 calc(100% - 3px));
      animation: app-loader-spin 0.9s linear infinite;
    }
    :host(.app-loader--sm) .app-loader__ring {
      -webkit-mask: radial-gradient(
        farthest-side,
        transparent calc(100% - 3px),
        #000 calc(100% - 2px)
      );
      mask: radial-gradient(farthest-side, transparent calc(100% - 3px), #000 calc(100% - 2px));
    }
    .app-loader__label {
      font-size: 0.8rem;
      font-weight: 600;
      color: var(--muted, #64748b);
    }
    @keyframes app-loader-spin {
      to {
        transform: rotate(360deg);
      }
    }
    @media (prefers-reduced-motion: reduce) {
      .app-loader__ring {
        animation-duration: 2.4s;
      }
    }
  `,
})
export class Loader {
  readonly label = input<string>('');
  readonly size = input<'sm' | 'md' | 'lg'>('md');
  readonly inline = input(false);
}
