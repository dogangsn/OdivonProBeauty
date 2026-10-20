import { Service, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ApiClient } from './api-client';
import { BranchRecord } from './beauty.model';

@Service()
export class BranchService {
  private readonly api = inject(ApiClient);
  readonly branches = signal<BranchRecord[]>([]);
  readonly activeBranchId = signal<string>('');
  readonly loading = signal<boolean>(false);

  readonly hasBranches = computed(() => this.branches().length > 0);
  readonly currentBranch = computed(() =>
    this.branches().find((b) => b.id === this.activeBranchId()) ?? this.branches()[0] ?? null,
  );

  private inFlight?: Promise<BranchRecord[]>;

  async ensureBranches(): Promise<BranchRecord[]> {
    if (this.branches().length > 0) return this.branches();
    if (this.inFlight) return this.inFlight;
    this.inFlight = this.loadBranches();
    try {
      return await this.inFlight;
    } finally {
      this.inFlight = undefined;
    }
  }

  selectBranch(id: string): void {
    this.activeBranchId.set(id);
  }

  private async loadBranches(): Promise<BranchRecord[]> {
    this.loading.set(true);
    try {
      const fetchResult = await this.fetchList();
      if (!fetchResult.ok) {
        return [];
      }

      const list = fetchResult.data ?? [];
      // Deduplicate branches by id and normalized name to eliminate any duplicates
      const uniqueList: BranchRecord[] = [];
      const seenIds = new Set<string>();
      const seenNames = new Set<string>();

      for (const item of list) {
        if (!item.id || seenIds.has(item.id)) continue;
        const normName = (item.name || '').trim().toLowerCase();
        if (normName && seenNames.has(normName)) continue;
        seenIds.add(item.id);
        if (normName) seenNames.add(normName);
        uniqueList.push(item);
      }

      this.branches.set(uniqueList);
      if (uniqueList.length > 0 && !this.activeBranchId()) {
        this.activeBranchId.set(uniqueList[0].id);
      }
      return uniqueList;
    } catch {
      return [];
    } finally {
      this.loading.set(false);
    }
  }

  private async fetchList(): Promise<{ ok: boolean; data: BranchRecord[] }> {
    try {
      const response = await firstValueFrom(
        this.api.list<BranchRecord>('branches', { limit: 100 }),
      );
      return { ok: true, data: response.data ?? [] };
    } catch {
      return { ok: false, data: [] };
    }
  }
}
