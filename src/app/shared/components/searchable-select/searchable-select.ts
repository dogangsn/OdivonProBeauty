import {
  Component,
  ElementRef,
  computed,
  inject,
  input,
  model,
  output,
  signal,
} from '@angular/core';

export interface SearchableSelectOption {
  value: string;
  label: string;
  subtitle?: string;
  badge?: string;
  badgeClass?: string;
  icon?: string;
  avatarText?: string;
  avatarGradient?: string;
  raw?: unknown;
}

@Component({
  selector: 'app-searchable-select',
  templateUrl: './searchable-select.html',
  styleUrl: './searchable-select.css',
  host: {
    class: 'block w-full relative',
    '(document:click)': 'onDocumentClick($event)',
    '(keydown)': 'onHostKeyDown($event)',
  },
})
export class SearchableSelect {
  private readonly elementRef = inject(ElementRef);

  // Inputs & Model
  readonly value = model<string>('');
  readonly options = input<readonly SearchableSelectOption[]>([]);
  readonly label = input<string>('');
  readonly placeholder = input<string>('Seçin…');
  readonly searchPlaceholder = input<string>('Listede ara…');
  readonly icon = input<string>('');
  readonly required = input<boolean>(false);
  readonly disabled = input<boolean>(false);
  readonly clearable = input<boolean>(true);
  readonly emptyMessage = input<string>('Eşleşen sonuç bulunamadı');

  // Outputs
  readonly selectionChange = output<SearchableSelectOption | null>();

  // Internal Signals
  protected readonly isOpen = signal<boolean>(false);
  protected readonly searchQuery = signal<string>('');
  protected readonly highlightedIndex = signal<number>(0);

  // Maximum items to render into DOM simultaneously for performance protection
  protected readonly MAX_DOM_ITEMS = 40;

  // Normalize search queries (Turkish diacritics insensitive)
  private normalize(text: string): string {
    return (text || '')
      .toLocaleLowerCase('tr-TR')
      .replace(/ğ/g, 'g')
      .replace(/ü/g, 'u')
      .replace(/ş/g, 's')
      .replace(/ı/g, 'i')
      .replace(/ö/g, 'o')
      .replace(/ç/g, 'c')
      .replace(/[^a-z0-9]/g, '');
  }

  // Selected Option resolved
  protected readonly selectedOption = computed<SearchableSelectOption | null>(() => {
    const currentVal = this.value();
    if (!currentVal) return null;
    return this.options().find((opt) => opt.value === currentVal) ?? null;
  });

  // Filtered Options by search query
  protected readonly filteredOptions = computed<SearchableSelectOption[]>(() => {
    const query = this.searchQuery().trim();
    const all = this.options();

    if (!query) {
      return [...all];
    }

    const normQuery = this.normalize(query);
    return all.filter((opt) => {
      if (this.normalize(opt.label).includes(normQuery)) return true;
      if (opt.subtitle && this.normalize(opt.subtitle).includes(normQuery)) return true;
      if (opt.badge && this.normalize(opt.badge).includes(normQuery)) return true;
      return false;
    });
  });

  // Sliced for DOM performance
  protected readonly displayedOptions = computed<SearchableSelectOption[]>(() => {
    return this.filteredOptions().slice(0, this.MAX_DOM_ITEMS);
  });

  protected readonly totalCount = computed<number>(() => {
    return this.filteredOptions().length;
  });

  protected readonly hasMore = computed<boolean>(() => {
    return this.totalCount() > this.MAX_DOM_ITEMS;
  });

  protected toggleOpen(): void {
    if (this.disabled()) return;
    if (this.isOpen()) {
      this.close();
    } else {
      this.open();
    }
  }

  protected open(): void {
    if (this.disabled()) return;
    this.isOpen.set(true);
    this.highlightedIndex.set(0);

    setTimeout(() => {
      const inputEl = this.elementRef.nativeElement.querySelector('.searchable-input');
      if (inputEl) (inputEl as HTMLInputElement).focus();
    }, 50);
  }

  protected close(): void {
    this.isOpen.set(false);
    this.searchQuery.set('');
    this.highlightedIndex.set(0);
  }

  protected onSearchInput(event: Event): void {
    const val = (event.target as HTMLInputElement).value;
    this.searchQuery.set(val);
    this.highlightedIndex.set(0);
  }

  protected clearSearch(): void {
    this.searchQuery.set('');
    this.highlightedIndex.set(0);
    const inputEl = this.elementRef.nativeElement.querySelector('.searchable-input');
    if (inputEl) (inputEl as HTMLInputElement).focus();
  }

  protected selectOption(opt: SearchableSelectOption): void {
    this.value.set(opt.value);
    this.selectionChange.emit(opt);
    this.close();
  }

  protected clearSelection(event?: MouseEvent): void {
    if (event) event.stopPropagation();
    this.value.set('');
    this.selectionChange.emit(null);
  }

  protected onHostKeyDown(event: KeyboardEvent): void {
    if (!this.isOpen()) {
      if (event.key === 'Enter' || event.key === 'ArrowDown' || event.key === ' ') {
        if ((event.target as HTMLElement).classList.contains('searchable-trigger')) {
          event.preventDefault();
          this.open();
        }
      }
      return;
    }

    const items = this.displayedOptions();
    const count = items.length;

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        if (count > 0) {
          this.highlightedIndex.update((prev) => (prev + 1) % count);
          this.scrollHighlightedIntoView();
        }
        break;
      case 'ArrowUp':
        event.preventDefault();
        if (count > 0) {
          this.highlightedIndex.update((prev) => (prev - 1 + count) % count);
          this.scrollHighlightedIntoView();
        }
        break;
      case 'Enter':
        event.preventDefault();
        if (count > 0 && this.highlightedIndex() >= 0 && this.highlightedIndex() < count) {
          this.selectOption(items[this.highlightedIndex()]);
        }
        break;
      case 'Escape':
        event.preventDefault();
        this.close();
        break;
      case 'Tab':
        this.close();
        break;
    }
  }

  private scrollHighlightedIntoView(): void {
    setTimeout(() => {
      const highlightedEl = this.elementRef.nativeElement.querySelector('.is-highlighted');
      if (highlightedEl) {
        highlightedEl.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }, 10);
  }

  protected onDocumentClick(event: MouseEvent): void {
    if (!this.isOpen()) return;
    const clickedInside = this.elementRef.nativeElement.contains(event.target as Node);
    if (!clickedInside) {
      this.close();
    }
  }
}
