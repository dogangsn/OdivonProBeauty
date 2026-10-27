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
import { firstValueFrom } from 'rxjs';
import { ApiClient } from '../../../core/api-client';
import { BeautyRecord } from '../../../core/beauty.model';
import { CustomerProfile } from '../../../core/customer/customer.model';

export interface CustomerComboboxItem {
  id: string;
  fullName: string;
  phone: string;
  email?: string;
  segment?: string;
  status?: string;
  walletBalance?: number;
  healthWarning?: string;
  initials: string;
  raw: BeautyRecord;
}

@Component({
  selector: 'app-customer-combobox',
  templateUrl: './customer-combobox.html',
  styleUrl: './customer-combobox.css',
  host: {
    class: 'block w-full relative',
    '(document:click)': 'onDocumentClick($event)',
    '(keydown)': 'onHostKeyDown($event)',
  },
})
export class CustomerCombobox {
  private readonly api = inject(ApiClient);
  private readonly elementRef = inject(ElementRef);

  // Inputs & Model
  readonly value = model<string>('');
  readonly branchId = input<string>('');
  readonly preloadedCustomers = input<readonly BeautyRecord[]>([]);
  readonly label = input<string>('Müşteri');
  readonly required = input<boolean>(true);
  readonly disabled = input<boolean>(false);
  readonly placeholder = input<string>('Müşteri ara (Ad, soyad, telefon veya TCKN)…');

  // Outputs
  readonly customerSelected = output<BeautyRecord | null>();
  readonly createRequested = output<string>();

  // Internal Signals
  protected readonly isOpen = signal<boolean>(false);
  protected readonly searchQuery = signal<string>('');
  protected readonly isSearchingRemote = signal<boolean>(false);
  protected readonly remoteCustomers = signal<BeautyRecord[]>([]);
  protected readonly highlightedIndex = signal<number>(0);

  // Performance cap: Max items rendered in DOM simultaneously to prevent sluggishness
  protected readonly MAX_DOM_ITEMS = 35;

  private searchDebounceTimer?: ReturnType<typeof setTimeout>;

  // Normalize Turkish characters and punctuation for instant, accurate matching
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

  // Format customer record into combobox view item
  private toItem(rec: BeautyRecord): CustomerComboboxItem {
    const raw = rec as Partial<CustomerProfile>;
    const fullName = String(raw.fullName || rec['name'] || rec.id || 'İsimsiz Müşteri').trim();
    const phone = String(raw.phone || rec['phone'] || '').trim();
    const email = raw.email ? String(raw.email).trim() : undefined;
    const segment = raw.segment || (rec['segment'] as string) || undefined;
    const status = raw.status || (rec['status'] as string) || 'active';
    const walletBalance = typeof raw.walletBalance === 'number' ? raw.walletBalance : undefined;

    // Detect health or allergy warnings
    let healthWarning: string | undefined;
    if (raw.health) {
      if (raw.health.isPregnant) healthWarning = 'Hamilelik';
      else if (raw.health.medications?.toLowerCase().includes('roaccutane'))
        healthWarning = 'Roaccutane Tedavisi';
      else if (raw.health.allergies) healthWarning = 'Alerji';
    }

    // Initials calculation
    const parts = fullName.split(/\s+/).filter(Boolean);
    const initials =
      parts.length >= 2
        ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
        : (fullName.slice(0, 2) || 'MU').toUpperCase();

    return {
      id: rec.id,
      fullName,
      phone,
      email,
      segment,
      status,
      walletBalance,
      healthWarning,
      initials,
      raw: rec,
    };
  }

  // Merged customer list (preloaded + remotely searched, deduplicated)
  protected readonly mergedCustomers = computed<CustomerComboboxItem[]>(() => {
    const map = new Map<string, CustomerComboboxItem>();

    // Preloaded customers
    for (const rec of this.preloadedCustomers() ?? []) {
      if (rec?.id) map.set(rec.id, this.toItem(rec));
    }

    // Remote search results
    for (const rec of this.remoteCustomers()) {
      if (rec?.id) map.set(rec.id, this.toItem(rec));
    }

    return Array.from(map.values());
  });

  // Resolved currently selected customer
  protected readonly selectedItem = computed<CustomerComboboxItem | null>(() => {
    const currentId = this.value();
    if (!currentId) return null;
    return this.mergedCustomers().find((item) => item.id === currentId) ?? null;
  });

  // Filtered matching customers
  protected readonly filteredCustomers = computed<CustomerComboboxItem[]>(() => {
    const query = this.searchQuery().trim();
    const list = this.mergedCustomers();

    if (!query) {
      return list;
    }

    const normQuery = this.normalize(query);
    const digitsOnly = query.replace(/\D/g, '');

    return list.filter((item) => {
      // Name match
      if (this.normalize(item.fullName).includes(normQuery)) return true;
      // Phone match (supports digits-only match e.g. "532411")
      if (digitsOnly && item.phone.replace(/\D/g, '').includes(digitsOnly)) return true;
      // Email match
      if (item.email && item.email.toLowerCase().includes(query.toLowerCase())) return true;
      // ID match
      if (item.id.toLowerCase().includes(query.toLowerCase())) return true;
      return false;
    });
  });

  // Sliced for high-performance DOM rendering (capped to prevent DOM slowdown on thousands of records)
  protected readonly displayedCustomers = computed<CustomerComboboxItem[]>(() => {
    return this.filteredCustomers().slice(0, this.MAX_DOM_ITEMS);
  });

  protected readonly totalMatchesCount = computed<number>(() => {
    return this.filteredCustomers().length;
  });

  protected readonly hasMoreMatches = computed<boolean>(() => {
    return this.totalMatchesCount() > this.MAX_DOM_ITEMS;
  });

  // Open combobox dropdown
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
    // Focus search input after animation
    setTimeout(() => {
      const inputEl = this.elementRef.nativeElement.querySelector('.combobox-search-input');
      if (inputEl) (inputEl as HTMLInputElement).focus();
    }, 50);
  }

  protected close(): void {
    this.isOpen.set(false);
    this.searchQuery.set('');
    this.highlightedIndex.set(0);
  }

  // Handle Search Input with 250ms Debounce and Remote Search
  protected onSearchInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    const val = target.value;
    this.searchQuery.set(val);
    this.highlightedIndex.set(0);

    if (this.searchDebounceTimer) {
      clearTimeout(this.searchDebounceTimer);
    }

    const trimmed = val.trim();
    if (trimmed.length >= 2) {
      this.searchDebounceTimer = setTimeout(() => {
        this.triggerRemoteSearch(trimmed);
      }, 250);
    }
  }

  protected clearSearch(): void {
    this.searchQuery.set('');
    this.highlightedIndex.set(0);
    const inputEl = this.elementRef.nativeElement.querySelector('.combobox-search-input');
    if (inputEl) (inputEl as HTMLInputElement).focus();
  }

  // Debounced server search for scalable querying across thousands of records
  private async triggerRemoteSearch(query: string): Promise<void> {
    this.isSearchingRemote.set(true);
    try {
      const response = await firstValueFrom(
        this.api.list<BeautyRecord>('customers', {
          search: query,
          branchId: this.branchId() || undefined,
          limit: 35,
        }),
      );
      if (response?.data) {
        this.remoteCustomers.set(response.data);
      }
    } catch {
      // Remote search error gracefully handled; local results remain available
    } finally {
      this.isSearchingRemote.set(false);
    }
  }

  // Select customer
  protected selectCustomer(item: CustomerComboboxItem): void {
    this.value.set(item.id);
    this.customerSelected.emit(item.raw);
    this.close();
  }

  // Clear selected customer
  protected clearSelection(event?: MouseEvent): void {
    if (event) event.stopPropagation();
    this.value.set('');
    this.customerSelected.emit(null);
  }

  // Request quick customer creation
  protected onRequestCreate(): void {
    const term = this.searchQuery().trim();
    this.createRequested.emit(term);
    this.close();
  }

  // Keyboard navigation
  protected onHostKeyDown(event: KeyboardEvent): void {
    if (!this.isOpen()) {
      if (event.key === 'Enter' || event.key === 'ArrowDown' || event.key === ' ') {
        if ((event.target as HTMLElement).classList.contains('combobox-trigger')) {
          event.preventDefault();
          this.open();
        }
      }
      return;
    }

    const items = this.displayedCustomers();
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
          this.selectCustomer(items[this.highlightedIndex()]);
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

  // Close when clicking outside
  protected onDocumentClick(event: MouseEvent): void {
    if (!this.isOpen()) return;
    const clickedInside = this.elementRef.nativeElement.contains(event.target as Node);
    if (!clickedInside) {
      this.close();
    }
  }

  // Deterministic avatar gradient
  protected getAvatarGradient(id: string): string {
    const gradients = [
      'from-indigo-500 to-purple-600',
      'from-pink-500 to-rose-600',
      'from-emerald-500 to-teal-600',
      'from-sky-500 to-blue-600',
      'from-violet-500 to-fuchsia-600',
      'from-amber-500 to-orange-600',
    ];
    let hash = 0;
    for (let i = 0; i < (id || '').length; i++) {
      hash = (hash << 5) - hash + id.charCodeAt(i);
      hash |= 0;
    }
    const index = Math.abs(hash) % gradients.length;
    return gradients[index];
  }
}
