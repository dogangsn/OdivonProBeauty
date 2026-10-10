import { Component, computed, inject, resource, signal } from '@angular/core';
import { FormField, form, required, submit } from '@angular/forms/signals';
import { ActivatedRoute } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { ApiClient } from '../../../core/api-client';
import { BeautyRecord, BranchRecord, WorkspaceDefinition } from '../../../core/beauty.model';
import { SlideOver } from '../../../shared/slide-over/slide-over';
import { StatusBadge } from '../../../shared/status-badge/status-badge';

interface RecordFormModel {
  name: string;
  branchId: string;
  status: string;
  note: string;
  customerId: string;
  amount: number;
  method: string;
}

@Component({
  imports: [FormField, SlideOver, StatusBadge],
  selector: 'app-workspace',
  styleUrl: './workspace.css',
  templateUrl: './workspace.html',
})
export class Workspace {
  private readonly route = inject(ActivatedRoute);
  private readonly api = inject(ApiClient);
  protected readonly definition = this.route.snapshot.data['definition'] as WorkspaceDefinition;
  protected readonly search = signal('');
  protected readonly branchFilter = signal('');
  protected readonly drawerOpen = signal(this.route.snapshot.queryParamMap.get('create') === '1');
  protected readonly editingId = signal<string | null>(null);
  protected readonly saving = signal(false);
  protected readonly deletingId = signal<string | null>(null);
  protected readonly feedback = signal('');
  protected readonly branches = resource({
    loader: async () =>
      (await firstValueFrom(this.api.list<BranchRecord>('branches', { limit: 100 }))).data,
  });
  protected readonly customers = resource({
    loader: async () =>
      this.definition.resource === 'payments'
        ? (await firstValueFrom(this.api.list<BeautyRecord>('customers', { limit: 100 }))).data
        : [],
  });
  protected readonly remote = resource({
    params: () => ({ resource: this.definition.resource, branchId: this.branchFilter() }),
    loader: async ({ params }) => {
      if (this.definition.readonly) {
        const response = await firstValueFrom(
          this.api.request<Record<string, unknown>>('GET', `beauty/${params.resource}`),
        );
        return Object.entries(response.data).map(([key, value]): BeautyRecord => ({
          id: key,
          name: this.metricLabel(key),
          value,
          status: 'ready',
        }));
      }
      return (
        await firstValueFrom(
          this.api.list<BeautyRecord>(params.resource, {
            branchId: params.branchId || undefined,
            limit: 100,
          }),
        )
      ).data;
    },
  });
  protected readonly rows = computed(() => {
    const source = this.remote.hasValue() ? this.remote.value() : [];
    const query = this.search().trim().toLocaleLowerCase('tr');
    return query
      ? source.filter((row) => JSON.stringify(row).toLocaleLowerCase('tr').includes(query))
      : source;
  });
  protected readonly recordModel = signal<RecordFormModel>(this.emptyModel());
  protected readonly recordForm = form(this.recordModel, (path) =>
    required(path.name, { message: 'Ad alanı zorunludur.' }),
  );

  protected onSearch(event: Event): void {
    this.search.set((event.target as HTMLInputElement).value);
  }
  protected onBranchFilter(event: Event): void {
    this.branchFilter.set((event.target as HTMLSelectElement).value);
  }
  protected openCreate(): void {
    this.editingId.set(null);
    this.recordModel.set(this.emptyModel());
    this.feedback.set('');
    this.drawerOpen.set(true);
  }
  protected openEdit(row: BeautyRecord): void {
    this.editingId.set(row.id);
    this.recordModel.set({
      name: this.recordName(row),
      branchId: this.stringValue(row['branchId']),
      status: this.stringValue(row['status']) || 'active',
      note: this.stringValue(row['note'] ?? row['notes']),
      customerId: this.stringValue(row['customerId']),
      amount: typeof row['amount'] === 'number' ? row['amount'] : 0,
      method: this.stringValue(row['method']) || 'card',
    });
    this.feedback.set('');
    this.drawerOpen.set(true);
  }
  protected save(): void {
    submit(this.recordForm, async () => {
      const value = this.recordModel();
      if (this.definition.branchRequired && !value.branchId) {
        this.feedback.set('Devam etmek için bir şube seçin.');
        return;
      }
      if (this.definition.resource === 'payments' && (!value.customerId || value.amount <= 0)) {
        this.feedback.set('Müşteri ve geçerli ödeme tutarı zorunludur.');
        return;
      }
      this.saving.set(true);
      this.feedback.set('');
      try {
        if (this.definition.resource === 'payments') {
          await firstValueFrom(
            this.api.create<BeautyRecord>('payments', {
              branchId: value.branchId,
              customerId: value.customerId,
              amount: value.amount,
              method: value.method,
              idempotencyKey: crypto.randomUUID(),
            }),
          );
        } else {
          const data = { name: value.name.trim(), status: value.status, note: value.note.trim() };
          const id = this.editingId();
          if (id)
            await firstValueFrom(
              this.api.update<BeautyRecord>(this.definition.resource, id, { data }),
            );
          else
            await firstValueFrom(
              this.api.create<BeautyRecord>(this.definition.resource, {
                data,
                branchId: value.branchId || undefined,
              }),
            );
        }
        this.drawerOpen.set(false);
        this.recordModel.set(this.emptyModel());
        this.remote.reload();
      } catch (error) {
        this.feedback.set(error instanceof Error ? error.message : 'Kayıt tamamlanamadı.');
      } finally {
        this.saving.set(false);
      }
    });
  }
  protected async remove(row: BeautyRecord): Promise<void> {
    if (!confirm(`“${this.recordName(row)}” kaydı silinsin mi?`)) return;
    this.deletingId.set(row.id);
    this.feedback.set('');
    try {
      await firstValueFrom(this.api.remove(this.definition.resource, row.id));
      this.remote.reload();
    } catch (error) {
      this.feedback.set(error instanceof Error ? error.message : 'Kayıt silinemedi.');
    } finally {
      this.deletingId.set(null);
    }
  }
  protected recordName(row: BeautyRecord): string {
    for (const key of ['name', 'fullName', 'title', 'businessName', 'customerName']) {
      const value = row[key];
      if (typeof value === 'string' && value) return value;
    }
    return row.id;
  }
  protected branchName(id: unknown): string {
    if (typeof id !== 'string' || !id) return 'Genel';
    return this.branches.value()?.find((branch) => branch.id === id)?.name ?? id;
  }
  protected displayDate(value: unknown): string {
    if (typeof value !== 'string' || !value) return '—';
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat('tr-TR').format(date);
  }
  protected rowDate(row: BeautyRecord): string {
    return this.displayDate(row['createdAt'] ?? row['updatedAt']);
  }
  protected secondaryValue(row: BeautyRecord): string {
    return this.definition.readonly
      ? String(row['value'] ?? '—')
      : this.branchName(row['branchId']);
  }
  private emptyModel(): RecordFormModel {
    return {
      name: '',
      branchId: this.branches.value()?.[0]?.id ?? '',
      status: 'active',
      note: '',
      customerId: '',
      amount: 0,
      method: 'card',
    };
  }
  private stringValue(value: unknown): string {
    return typeof value === 'string' ? value : '';
  }
  private metricLabel(key: string): string {
    const labels: Record<string, string> = {
      appointments: 'Randevu',
      customers: 'Müşteri',
      revenue: 'Ciro',
      criticalStock: 'Kritik stok',
    };
    return labels[key] ?? key;
  }
}
