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

  async ensureBranches(): Promise<BranchRecord[]> {
    if (this.branches().length > 0) return this.branches();
    this.loading.set(true);
    try {
      let list = await this.fetchList();
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
          list = await this.fetchList();
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

  selectBranch(id: string): void {
    this.activeBranchId.set(id);
  }

  private async fetchList(): Promise<BranchRecord[]> {
    try {
      const response = await firstValueFrom(
        this.api.list<BranchRecord>('branches', { limit: 100 }),
      );
      return response.data ?? [];
    } catch {
      return [];
    }
  }
}
