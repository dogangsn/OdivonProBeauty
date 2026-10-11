import { Component, computed, inject, resource, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { ApiClient } from '../../../core/api-client';
import {
  BeautyRecord,
  BranchRecord,
  WorkspaceColumn,
  WorkspaceDefinition,
  WorkspaceField,
} from '../../../core/beauty.model';
import { SlideOver } from '../../../shared/slide-over/slide-over';
import { StatusBadge } from '../../../shared/status-badge/status-badge';

type DraftValue = string | number | boolean;
type Draft = Record<string, DraftValue>;

@Component({
  imports: [SlideOver, StatusBadge],
  selector: 'app-workspace',
  styleUrl: './workspace.css',
  templateUrl: './workspace.html',
})
export class Workspace {
  private readonly route = inject(ActivatedRoute);
  private readonly api = inject(ApiClient);
  protected readonly definition = this.route.snapshot.data['definition'] as WorkspaceDefinition;
  protected readonly search = signal('');
  protected readonly statusFilter = signal('');
  protected readonly branchFilter = signal('');
  protected readonly drawerOpen = signal(this.route.snapshot.queryParamMap.get('create') === '1');
  protected readonly editingId = signal<string | null>(null);
  protected readonly saving = signal(false);
  protected readonly deletingId = signal<string | null>(null);
  protected readonly feedback = signal('');
  protected readonly draft = signal<Draft>({});
  protected readonly branches = resource({
    loader: async () =>
      (await firstValueFrom(this.api.list<BranchRecord>('branches', { limit: 100 }))).data,
  });
  protected readonly remote = resource({
    params: () => ({ resource: this.definition.resource, branchId: this.branchFilter() }),
    loader: async ({ params }) => {
      if (params.resource === 'reports/dashboard') {
        const response = await firstValueFrom(
          this.api.request<Record<string, unknown>>('GET', 'beauty/reports/dashboard'),
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
    const query = this.search().trim().toLocaleLowerCase('tr');
    const status = this.statusFilter();
    return (this.remote.value() ?? []).filter((row) => {
      const matchesQuery = !query || JSON.stringify(row).toLocaleLowerCase('tr').includes(query);
      const matchesStatus = !status || row.status === status;
      return matchesQuery && matchesStatus;
    });
  });
  protected readonly complete = computed(() =>
    (this.definition.fields ?? [])
      .filter((field) => field.required)
      .every((field) => {
        const value = this.draft()[field.key];
        if (typeof value === 'number') {
          return Number.isFinite(value) && (field.min === undefined || value >= field.min);
        }
        return String(value ?? '').trim() !== '';
      }),
  );

  protected updateSearch(event: Event): void {
    this.search.set((event.target as HTMLInputElement).value);
  }

  protected updateFilter(target: 'branch' | 'status', event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    target === 'branch' ? this.branchFilter.set(value) : this.statusFilter.set(value);
  }

  protected openCreate(): void {
    this.editingId.set(null);
    this.draft.set(this.emptyDraft());
    this.feedback.set('');
    this.drawerOpen.set(true);
  }

  protected openEdit(row: BeautyRecord): void {
    const next = this.emptyDraft();
    for (const field of this.definition.fields ?? []) {
      const value = row[field.key];
      if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
        next[field.key] = this.inputValue(field, value);
      }
    }
    if (typeof row.branchId === 'string') next['branchId'] = row.branchId;
    this.editingId.set(row.id);
    this.draft.set(next);
    this.feedback.set('');
    this.drawerOpen.set(true);
  }

  protected fieldValue(key: string): DraftValue {
    return this.draft()[key] ?? '';
  }

  protected updateField(field: WorkspaceField, event: Event): void {
    const target = event.target as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
    const value: DraftValue = field.type === 'number' ? Number(target.value) : target.value;
    this.draft.update((current) => ({ ...current, [field.key]: value }));
  }

  protected async save(): Promise<void> {
    if (!this.complete()) {
      this.feedback.set('Zorunlu alanlari tamamlayin.');
      return;
    }
    const values = this.draft();
    const branchId = String(values['branchId'] ?? '');
    if (this.definition.branchRequired && !branchId) {
      this.feedback.set('Devam etmek icin bir sube secin.');
      return;
    }
    this.saving.set(true);
    this.feedback.set('');
    try {
      const data = this.normalizedData(values);
      const id = this.editingId();
      if (id) {
        await firstValueFrom(this.api.update<BeautyRecord>(this.definition.resource, id, { data }));
      } else if (this.definition.resource === 'payments') {
        await firstValueFrom(
          this.api.create<BeautyRecord>('payments', {
            ...data,
            branchId,
            idempotencyKey: crypto.randomUUID(),
          }),
        );
      } else {
        await firstValueFrom(
          this.api.create<BeautyRecord>(this.definition.resource, {
            data,
            branchId: branchId || undefined,
          }),
        );
      }
      this.drawerOpen.set(false);
      this.remote.reload();
    } catch (error) {
      this.feedback.set(error instanceof Error ? error.message : 'Kayit tamamlanamadi.');
    } finally {
      this.saving.set(false);
    }
  }

  protected async remove(row: BeautyRecord): Promise<void> {
    if (!confirm(`“${this.recordName(row)}” kaydi silinsin mi?`)) return;
    this.deletingId.set(row.id);
    try {
      await firstValueFrom(this.api.remove(this.definition.resource, row.id));
      this.remote.reload();
    } catch (error) {
      this.feedback.set(error instanceof Error ? error.message : 'Kayit silinemedi.');
    } finally {
      this.deletingId.set(null);
    }
  }

  protected recordName(row: BeautyRecord): string {
    for (const key of ['fullName', 'name', 'title', 'invoiceNumber', 'customerId', 'staffId']) {
      const value = row[key];
      if (typeof value === 'string' && value) return value;
    }
    return row.id;
  }

  protected cellValue(row: BeautyRecord, column: WorkspaceColumn): string {
    const value = this.resolve(row, column.key);
    if (column.format === 'date') return this.date(value);
    if (column.format === 'currency') {
      return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(
        typeof value === 'number' ? value : Number(value) || 0,
      );
    }
    if (column.format === 'number') return String(value ?? '0');
    if (Array.isArray(value)) return value.join(', ');
    if (typeof value === 'boolean') return value ? 'Evet' : 'Hayir';
    return typeof value === 'string' || typeof value === 'number' ? String(value) : '—';
  }

  protected statusValue(row: BeautyRecord, column: WorkspaceColumn): string {
    const value = this.resolve(row, column.key);
    return typeof value === 'string' ? value : 'active';
  }

  protected fieldId(field: WorkspaceField): string {
    return `workspace-${field.key}`;
  }

  private emptyDraft(): Draft {
    const value: Draft = { branchId: this.branchFilter() || this.branches.value()?.[0]?.id || '' };
    for (const field of this.definition.fields ?? []) {
      value[field.key] = field.type === 'number' ? 0 : (field.options?.[0]?.value ?? '');
    }
    return value;
  }

  private normalizedData(values: Draft): Record<string, DraftValue> {
    const data: Record<string, DraftValue> = {};
    for (const field of this.definition.fields ?? []) {
      const value = values[field.key];
      if (value === '' || value === undefined) continue;
      if (field.type === 'datetime-local') {
        data[field.key] = new Date(String(value)).toISOString();
      } else {
        data[field.key] = value;
      }
    }
    return data;
  }

  private inputValue(field: WorkspaceField, value: DraftValue): DraftValue {
    if ((field.type !== 'datetime-local' && field.type !== 'date') || typeof value !== 'string')
      return value;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    if (field.type === 'date') return date.toISOString().slice(0, 10);
    return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
  }

  private resolve(row: BeautyRecord, path: string): unknown {
    return path.split('.').reduce<unknown>((value, key) => {
      if (!value || typeof value !== 'object' || Array.isArray(value)) return undefined;
      return (value as Record<string, unknown>)[key];
    }, row);
  }

  private date(value: unknown): string {
    if (typeof value !== 'string' || !value) return '—';
    const date = new Date(value);
    return Number.isNaN(date.getTime())
      ? value
      : new Intl.DateTimeFormat('tr-TR', { dateStyle: 'medium', timeStyle: 'short' }).format(date);
  }

  private metricLabel(key: string): string {
    const labels: Record<string, string> = {
      appointments: 'Randevu',
      customers: 'Musteri',
      revenue: 'Ciro',
      criticalStock: 'Kritik stok',
    };
    return labels[key] ?? key;
  }
}
