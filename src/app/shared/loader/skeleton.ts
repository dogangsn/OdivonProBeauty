import { Component, computed, input } from '@angular/core';

/** Shimmer placeholder shaped like a table or list, shown until the first data arrives. */
@Component({
  selector: 'app-skeleton',
  host: { role: 'status', 'aria-live': 'polite', 'aria-busy': 'true', class: 'block' },
  template: `
    <span class="sr-only">{{ label() }}</span>
    @if (variant() === 'table') {
      <div
        class="px-6 py-3.5 border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex gap-6"
      >
        @for (col of colList(); track col) {
          <span class="odv-skeleton h-3 flex-1" [style.max-width.%]="col === 0 ? 30 : 18"></span>
        }
      </div>
    }
    <div class="divide-y divide-slate-100 dark:divide-slate-800/80">
      @for (row of rowList(); track row) {
        <div
          class="flex items-center gap-4"
          [class]="variant() === 'table' ? 'px-6 py-4' : 'py-3 px-2'"
        >
          @if (avatar()) {
            <span class="odv-skeleton w-9 h-9 rounded-full flex-shrink-0"></span>
          }
          <div class="flex-1 min-w-0 grid gap-2">
            <span class="odv-skeleton h-3" [style.width.%]="62 - (row % 3) * 12"></span>
            <span class="odv-skeleton h-2.5" [style.width.%]="38 - (row % 2) * 10"></span>
          </div>
          @if (variant() === 'table') {
            @for (col of extraCols(); track col) {
              <span
                class="odv-skeleton h-3 hidden md:block"
                [style.width.rem]="4 + ((row + col) % 3)"
              ></span>
            }
          } @else {
            <span class="odv-skeleton h-5 w-14 rounded-md flex-shrink-0"></span>
          }
        </div>
      }
    </div>
  `,
})
export class Skeleton {
  readonly variant = input<'table' | 'list'>('list');
  readonly rows = input(5);
  readonly cols = input(5);
  readonly avatar = input(true);
  readonly label = input('Veriler yükleniyor');

  protected readonly rowList = computed(() => Array.from({ length: this.rows() }, (_, i) => i));
  protected readonly colList = computed(() => Array.from({ length: this.cols() }, (_, i) => i));
  protected readonly extraCols = computed(() =>
    Array.from({ length: Math.max(0, this.cols() - 1) }, (_, i) => i),
  );
}
