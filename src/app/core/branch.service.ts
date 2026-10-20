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

      let list = fetchResult.data;
      if (list.length === 0) {
        // Attempt to onboard / create default branch if tenant is freshly initialized
        try {
          await firstValueFrom(
            this.api.request('POST', 'beauty/onboarding', {
              businessName: 'Odivon Beauty',
              branchName: 'Merkez Şube',
              timezone: 'Europe/Istanbul',
            }),
          );
          const refetch = await this.fetchList();
          if (refetch.ok) list = refetch.data;
        } catch {
          // If onboarding fails, try direct branch create
          try {
            const created = await firstValueFrom(
              this.api.create<BranchRecord>('branches', {
                data: { name: 'Merkez Şube', code: 'MRK' },
              }),
            );
            if (created.data) list = [created.data];
          } catch {
            // Backend might not support creating branches directly
          }
        }
      }

      this.branches.set(list);
      if (list.length > 0 && !this.activeBranchId()) {
        this.activeBranchId.set(list[0].id);
      }
      return list;
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
