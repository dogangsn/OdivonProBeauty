import { Component, computed, inject, resource, signal } from '@angular/core';
import { FormField, form, required, submit } from '@angular/forms/signals';
import { ActivatedRoute } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { ApiClient } from '../../../core/api-client';
import { BeautyRecord, WorkspaceDefinition } from '../../../core/beauty.model';
import { SlideOver } from '../../../shared/slide-over/slide-over';
import { StatusBadge } from '../../../shared/status-badge/status-badge';

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
  protected readonly drawerOpen = signal(false);
  protected readonly localRows = signal<BeautyRecord[]>([]);
  protected readonly remote = resource({
    params: () => this.definition.resource,
    loader: async ({ params }) => firstValueFrom(this.api.list<BeautyRecord>(params, { limit: 30 })),
  });
  protected readonly rows = computed(() => {
    const source = this.localRows().length
      ? this.localRows()
      : this.remote.hasValue()
        ? this.remote.value().data
        : [...this.definition.demoRows];
    const query = this.search().trim().toLocaleLowerCase('tr');
    return query ? source.filter((row) => JSON.stringify(row).toLocaleLowerCase('tr').includes(query)) : source;
  });
  protected readonly recordModel = signal({ name: '', branchId: 'br-nisantasi', status: 'active', note: '' });
  protected readonly recordForm = form(this.recordModel, (path) => {
    required(path.name, { message: 'Ad alani zorunludur.' });
    required(path.branchId, { message: 'Sube secilmelidir.' });
  });

  protected onSearch(event: Event): void {
    this.search.set((event.target as HTMLInputElement).value);
  }

  protected save(): void {
    submit(this.recordForm, async () => {
      const value = this.recordModel();
      const record: BeautyRecord = { id: `local-${crypto.randomUUID()}`, ...value, createdAt: new Date().toISOString() };
      this.localRows.update((rows) => [record, ...(rows.length ? rows : this.definition.demoRows)]);
      this.recordModel.set({ name: '', branchId: 'br-nisantasi', status: 'active', note: '' });
      this.drawerOpen.set(false);
    });
  }
}
