import { Component, computed, effect, inject, resource, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ApiClient } from '../../../core/api-client';
import { BeautyRecord } from '../../../core/beauty.model';
import { BranchService } from '../../../core/branch.service';
import { BookingLink, OnlineBookingApi, errorMessage } from '../../../core/booking/online-booking.service';
import { PageHeader } from '../../../shared/page-header/page-header';

/** Salon settings page for the shareable online booking link ("Randevu linki"). */
@Component({
  selector: 'app-booking-link',
  imports: [PageHeader],
  templateUrl: './booking-link.html',
})
export class BookingLinkPage {
  private readonly api = inject(OnlineBookingApi);
  private readonly records = inject(ApiClient);
  protected readonly branchService = inject(BranchService);

  protected readonly branchId = signal('');
  protected readonly saving = signal(false);
  protected readonly error = signal('');
  protected readonly copied = signal('');
  protected readonly slugDraft = signal('');
  protected readonly link = signal<BookingLink | null>(null);

  protected readonly branches = resource({
    loader: () => this.branchService.ensureBranches(),
  });
  private readonly loaded = resource({
    params: () => this.branchId() || undefined,
    loader: ({ params }) => this.api.getLink(params),
  });
  protected readonly staff = resource({
    params: () => this.branchId() || undefined,
    loader: async ({ params }) =>
      (await firstValueFrom(this.records.list<BeautyRecord>('staff', { branchId: params, limit: 100 }))).data.filter(
        (item) => (item['status'] ?? 'active') === 'active',
      ),
  });

  protected readonly loading = computed(() => this.loaded.isLoading());
  protected readonly loadError = computed(() => (this.loaded.error() ? errorMessage(this.loaded.error()) : ''));
  protected readonly url = computed(() => {
    const slug = this.link()?.slug;
    return slug ? OnlineBookingApi.publicUrl(slug, window.location.origin) : '';
  });
  protected readonly whatsappUrl = computed(
    () =>
      `https://wa.me/?text=${encodeURIComponent(`Online randevu almak için: ${this.url()}`)}`,
  );

  constructor() {
    effect(() => {
      const list = this.branches.hasValue() ? this.branches.value() : [];
      if (!this.branchId() && list.length) {
        this.branchId.set(this.branchService.activeBranchId() || list[0].id);
      }
    });
    effect(() => {
      if (this.loaded.hasValue()) {
        this.link.set(this.loaded.value());
        this.slugDraft.set(this.loaded.value().slug ?? '');
      }
    });
  }

  protected changeBranch(event: Event): void {
    this.link.set(null);
    this.error.set('');
    this.branchId.set((event.target as HTMLSelectElement).value);
  }

  protected create(): Promise<void> {
    return this.save({});
  }
  protected toggle(): Promise<void> {
    return this.save({ enabled: !this.link()?.enabled });
  }
  protected rename(): Promise<void> {
    const slug = this.slugDraft().trim().toLowerCase();
    if (!slug || slug === this.link()?.slug) return Promise.resolve();
    if (!window.confirm('Link adı değişirse eski link çalışmaz. Devam edilsin mi?')) return Promise.resolve();
    return this.save({ slug });
  }
  protected regenerate(): Promise<void> {
    if (!window.confirm('Yeni bir link oluşturulacak ve eski link çalışmayacak. Devam edilsin mi?')) {
      return Promise.resolve();
    }
    return this.save({ regenerate: true });
  }

  protected staffUrl(staffId: string): string {
    const slug = this.link()?.slug;
    return slug ? OnlineBookingApi.publicUrl(slug, window.location.origin, staffId) : '';
  }
  protected staffName(item: BeautyRecord): string {
    const value = item['fullName'] ?? item['name'];
    return typeof value === 'string' ? value : 'Uzman';
  }

  protected async copy(text: string, key: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(text);
      this.copied.set(key);
      setTimeout(() => this.copied.set(''), 2000);
    } catch {
      window.prompt('Linki kopyalayın:', text);
    }
  }

  protected input(event: Event): string {
    return (event.target as HTMLInputElement).value;
  }

  private async save(body: { enabled?: boolean; slug?: string; regenerate?: boolean }): Promise<void> {
    const branchId = this.branchId();
    if (!branchId) return;
    this.saving.set(true);
    this.error.set('');
    try {
      const result = await this.api.saveLink({ branchId, ...body });
      this.link.set(result);
      this.slugDraft.set(result.slug ?? '');
    } catch (error) {
      this.error.set(errorMessage(error));
    } finally {
      this.saving.set(false);
    }
  }
}
