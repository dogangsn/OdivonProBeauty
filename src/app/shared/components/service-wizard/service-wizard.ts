import { Component, computed, inject, input, output, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ApiClient } from '../../../core/api-client';
import { BeautyRecord } from '../../../core/beauty.model';
import { BranchService } from '../../../core/branch.service';
import { EntityLookupService } from '../../../core/entity-lookup.service';
import {
  PRESET_CATEGORIES,
  PresetCategory,
  PresetService,
} from '../../../core/presets/beauty-presets';

export interface WizardCompletionResult {
  createdCategoriesCount: number;
  createdServicesCount: number;
}

@Component({
  selector: 'app-service-wizard',
  styleUrl: './service-wizard.css',
  templateUrl: './service-wizard.html',
})
export class ServiceWizard {
  private readonly api = inject(ApiClient);
  private readonly branchService = inject(BranchService);
  private readonly entityLookup = inject(EntityLookupService);

  readonly open = input<boolean>(false);
  readonly initialCategoryKey = input<string | undefined>(undefined);

  readonly close = output<void>();
  readonly completed = output<WizardCompletionResult>();

  readonly step = signal<1 | 2 | 3>(1);
  readonly categories = signal<PresetCategory[]>(
    PRESET_CATEGORIES.map((c) => ({
      ...c,
      services: c.services.map((s) => ({ ...s })),
    })),
  );

  readonly activeCategoryKey = signal<string>('lazer');
  readonly saving = signal<boolean>(false);
  readonly progress = signal<{ current: number; total: number; message: string }>({
    current: 0,
    total: 0,
    message: '',
  });
  readonly errorMessage = signal<string>('');
  readonly successResult = signal<WizardCompletionResult | null>(null);

  // Computed state
  readonly selectedCategories = computed(() => this.categories().filter((c) => c.selected));
  readonly selectedCategoriesCount = computed(() => this.selectedCategories().length);

  readonly totalSelectedServicesCount = computed(() =>
    this.selectedCategories().reduce(
      (acc, cat) => acc + cat.services.filter((s) => s.selected).length,
      0,
    ),
  );

  readonly activeCategory = computed(() => {
    const key = this.activeCategoryKey();
    return (
      this.categories().find((c) => c.key === key) ??
      this.selectedCategories()[0] ??
      this.categories()[0]
    );
  });

  // Step 1: Category actions
  toggleCategory(key: string): void {
    this.categories.update((list) =>
      list.map((c) => (c.key === key ? { ...c, selected: !c.selected } : c)),
    );
  }

  selectAllCategories(select: boolean): void {
    this.categories.update((list) => list.map((c) => ({ ...c, selected: select })));
  }

  // Step 2: Service actions
  setActiveCategoryKey(key: string): void {
    this.activeCategoryKey.set(key);
  }

  toggleService(catKey: string, serviceIndex: number): void {
    this.categories.update((list) =>
      list.map((c) => {
        if (c.key !== catKey) return c;
        const services = [...c.services];
        services[serviceIndex] = {
          ...services[serviceIndex],
          selected: !services[serviceIndex].selected,
        };
        return { ...c, services };
      }),
    );
  }

  selectAllServicesForCategory(catKey: string, select: boolean): void {
    this.categories.update((list) =>
      list.map((c) => {
        if (c.key !== catKey) return c;
        const services = c.services.map((s) => ({ ...s, selected: select }));
        return { ...c, services };
      }),
    );
  }

  updateServiceField(
    catKey: string,
    serviceIndex: number,
    field: keyof PresetService,
    value: string | number,
  ): void {
    this.categories.update((list) =>
      list.map((c) => {
        if (c.key !== catKey) return c;
        const services = [...c.services];
        services[serviceIndex] = {
          ...services[serviceIndex],
          [field]: field === 'price' || field === 'durationMin' || field === 'vatRate' || field === 'sessionIntervalDays' || field === 'commissionRate'
            ? Number(value)
            : value,
        };
        return { ...c, services };
      }),
    );
  }

  addNewService(catKey: string): void {
    const newService: PresetService = {
      name: 'Yeni Hizmet',
      durationMin: 45,
      price: 500,
      vatRate: 20,
      sessionIntervalDays: 30,
      commissionRate: 10,
      selected: true,
    };
    this.categories.update((list) =>
      list.map((c) => (c.key === catKey ? { ...c, services: [...c.services, newService] } : c)),
    );
  }

  removeService(catKey: string, serviceIndex: number): void {
    this.categories.update((list) =>
      list.map((c) => {
        if (c.key !== catKey) return c;
        const services = c.services.filter((_, idx) => idx !== serviceIndex);
        return { ...c, services };
      }),
    );
  }

  // Navigation
  goToStep(targetStep: 1 | 2 | 3): void {
    if (targetStep > 1 && this.selectedCategoriesCount() === 0) {
      this.errorMessage.set('Lütfen devam etmek için en az bir kategori seçin.');
      return;
    }
    if (targetStep > 2 && this.totalSelectedServicesCount() === 0) {
      this.errorMessage.set('Lütfen devam etmek için en az bir hizmet seçin.');
      return;
    }
    this.errorMessage.set('');
    // Automatically set active tab to first selected category
    if (targetStep === 2) {
      const firstSelected = this.selectedCategories()[0];
      if (firstSelected) {
        this.activeCategoryKey.set(firstSelected.key);
      }
    }
    this.step.set(targetStep);
  }

  // Execution: Bulk Create
  async executeImport(): Promise<void> {
    const selectedCats = this.selectedCategories();
    const totalServices = this.totalSelectedServicesCount();

    if (selectedCats.length === 0 || totalServices === 0) {
      this.errorMessage.set('İçe aktarılacak kategori veya hizmet bulunamadı.');
      return;
    }

    this.saving.set(true);
    this.errorMessage.set('');

    const totalSteps = selectedCats.length + totalServices;
    let completedSteps = 0;

    const availableBranches = this.branchService.branches();
    const branchId = this.branchService.activeBranchId() || availableBranches[0]?.id || undefined;

    let createdCatsCount = 0;
    let createdServicesCount = 0;

    try {
      // 1. Fetch existing categories in branch/tenant to prevent duplicates
      const existingCatsRes = await firstValueFrom(
        this.api.list<BeautyRecord>('service-categories', {
          branchId,
          limit: 200,
        }),
      );
      const existingCategories = existingCatsRes.data ?? [];

      // Category Map: category.key -> created/existing category ID
      const categoryIdMap = new Map<string, string>();

      // 2. Process Categories
      for (const cat of selectedCats) {
        this.progress.set({
          current: completedSteps,
          total: totalSteps,
          message: `"${cat.name}" kategorisi doğrulanıyor…`,
        });

        // Check if an existing category has matching name
        const match = existingCategories.find(
          (ec) =>
            String(ec['name'] || '')
              .trim()
              .toLocaleLowerCase('tr') === cat.name.trim().toLocaleLowerCase('tr'),
        );

        let categoryId: string;
        if (match) {
          categoryId = match.id;
        } else {
          this.progress.set({
            current: completedSteps,
            total: totalSteps,
            message: `"${cat.name}" kategorisi oluşturuluyor…`,
          });
          const catResponse = await firstValueFrom(
            this.api.create<BeautyRecord>('service-categories', {
              data: {
                name: cat.name,
                color: cat.color,
                sortOrder: cat.sortOrder,
                status: 'active',
              },
              branchId,
            }),
          );
          categoryId = catResponse.data.id;
          createdCatsCount++;
        }

        categoryIdMap.set(cat.key, categoryId);
        completedSteps++;
      }

      // 3. Process Services
      for (const cat of selectedCats) {
        const categoryId = categoryIdMap.get(cat.key);
        if (!categoryId) continue;

        const activeServices = cat.services.filter((s) => s.selected);
        for (const s of activeServices) {
          this.progress.set({
            current: completedSteps,
            total: totalSteps,
            message: `"${s.name}" hizmeti kaydediliyor…`,
          });

          await firstValueFrom(
            this.api.create<BeautyRecord>('services', {
              data: {
                name: s.name,
                categoryId,
                durationMin: s.durationMin,
                preparationMin: s.preparationMin ?? 0,
                price: s.price,
                vatRate: s.vatRate,
                sessionIntervalDays: s.sessionIntervalDays,
                commissionRate: s.commissionRate ?? 10,
                status: 'active',
              },
              branchId,
            }),
          );

          createdServicesCount++;
          completedSteps++;
        }
      }

      // 4. Invalidate lookup caches
      void this.entityLookup.refresh('service-categories', branchId);
      void this.entityLookup.refresh('services', branchId);

      const result: WizardCompletionResult = {
        createdCategoriesCount: createdCatsCount,
        createdServicesCount: createdServicesCount,
      };

      this.successResult.set(result);
      this.completed.emit(result);
    } catch (error) {
      this.errorMessage.set(
        error instanceof Error ? error.message : 'Kayıt sırasında bir hata oluştu.',
      );
    } finally {
      this.saving.set(false);
    }
  }

  handleFinish(): void {
    this.close.emit();
    this.reset();
  }

  handleClose(): void {
    if (!this.saving()) {
      this.close.emit();
      this.reset();
    }
  }

  private reset(): void {
    this.step.set(1);
    this.errorMessage.set('');
    this.successResult.set(null);
    this.categories.set(
      PRESET_CATEGORIES.map((c) => ({
        ...c,
        services: c.services.map((s) => ({ ...s })),
      })),
    );
  }
}
