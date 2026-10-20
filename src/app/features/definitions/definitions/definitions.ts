import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  DEFINITION_CATEGORIES,
  DefinitionCategoryKey,
  DefinitionCategoryMeta,
  DefinitionItem,
} from '../../../core/definitions/definitions.model';
import { DefinitionsService } from '../../../core/definitions/definitions.service';
import { PageHeader } from '../../../shared/page-header/page-header';
import { SlideOver } from '../../../shared/slide-over/slide-over';

interface DefinitionDraft {
  name: string;
  code: string;
  description: string;
  color: string;
  active: boolean;
}

const COLOR_PRESETS = [
  '#6366f1', // Indigo
  '#8b5cf6', // Purple
  '#ec4899', // Pink
  '#10b981', // Emerald
  '#06b6d4', // Cyan
  '#f59e0b', // Amber
  '#f43f5e', // Rose
  '#64748b', // Slate
];

@Component({
  imports: [PageHeader, RouterLink, SlideOver],
  selector: 'app-definitions',
  styleUrl: './definitions.css',
  templateUrl: './definitions.html',
})
export class Definitions {
  protected readonly definitions = inject(DefinitionsService);
  protected readonly categories = DEFINITION_CATEGORIES;
  protected readonly colorPresets = COLOR_PRESETS;

  protected readonly selectedCategory = signal<DefinitionCategoryKey>('payment-methods');
  protected readonly search = signal('');
  protected readonly statusFilter = signal<'active' | 'inactive' | ''>('');

  protected readonly drawerOpen = signal(false);
  protected readonly editingId = signal<string | null>(null);
  protected readonly isSaving = signal(false);
  protected readonly feedback = signal('');

  protected readonly draft = signal<DefinitionDraft>({
    name: '',
    code: '',
    description: '',
    color: '#6366f1',
    active: true,
  });

  protected readonly currentCategoryMeta = computed<DefinitionCategoryMeta | undefined>(() =>
    this.categories.find((c) => c.key === this.selectedCategory()),
  );

  protected readonly currentItems = computed<DefinitionItem[]>(() =>
    this.definitions.getItems(this.selectedCategory()),
  );

  protected readonly filteredItems = computed<DefinitionItem[]>(() => {
    const query = this.search().trim().toLocaleLowerCase('tr');
    const status = this.statusFilter();

    return this.currentItems().filter((item) => {
      const matchesQuery =
        !query ||
        item.name.toLocaleLowerCase('tr').includes(query) ||
        item.code.toLocaleLowerCase('tr').includes(query) ||
        (item.description && item.description.toLocaleLowerCase('tr').includes(query));

      const matchesStatus =
        !status || (status === 'active' ? item.active : !item.active);

      return matchesQuery && matchesStatus;
    });
  });

  protected categoryItemCount(category: DefinitionCategoryKey): number {
    return this.definitions.getActiveItems(category).length;
  }

  protected selectCategory(category: DefinitionCategoryKey): void {
    this.selectedCategory.set(category);
    this.search.set('');
    this.statusFilter.set('');
  }

  protected updateSearch(event: Event): void {
    this.search.set((event.target as HTMLInputElement).value);
  }

  protected updateStatusFilter(event: Event): void {
    this.statusFilter.set((event.target as HTMLSelectElement).value as 'active' | 'inactive' | '');
  }

  protected openCreate(): void {
    this.editingId.set(null);
    this.feedback.set('');
    this.draft.set({
      name: '',
      code: '',
      description: '',
      color: '#6366f1',
      active: true,
    });
    this.drawerOpen.set(true);
  }

  protected openEdit(item: DefinitionItem): void {
    this.editingId.set(item.id);
    this.feedback.set('');
    this.draft.set({
      name: item.name,
      code: item.code,
      description: item.description || '',
      color: item.color || '#6366f1',
      active: item.active,
    });
    this.drawerOpen.set(true);
  }

  protected closeDrawer(): void {
    this.drawerOpen.set(false);
    this.editingId.set(null);
    this.feedback.set('');
  }

  protected updateDraftField(field: keyof DefinitionDraft, event: Event): void {
    const value = (event.target as HTMLInputElement | HTMLTextAreaElement).value;
    this.draft.update((prev) => ({ ...prev, [field]: value }));
  }

  protected updateDraftCheckbox(field: 'active', event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    this.draft.update((prev) => ({ ...prev, [field]: checked }));
  }

  protected selectColor(color: string): void {
    this.draft.update((prev) => ({ ...prev, color }));
  }

  protected async toggleActive(item: DefinitionItem): Promise<void> {
    await this.definitions.toggleActive(this.selectedCategory(), item.id);
  }

  protected async deleteItem(item: DefinitionItem): Promise<void> {
    if (confirm(`"${item.name}" tanımını silmek istediğinize emin misiniz?`)) {
      await this.definitions.deleteItem(this.selectedCategory(), item.id);
    }
  }

  protected async resetCategory(): Promise<void> {
    const meta = this.currentCategoryMeta();
    const label = meta ? meta.label : this.selectedCategory();
    if (
      confirm(
        `"${label}" kategorisindeki tanımları varsayılan değerlerine sıfırlamak istediğinize emin misiniz?`,
      )
    ) {
      await this.definitions.resetToDefaults(this.selectedCategory());
    }
  }

  protected async save(): Promise<void> {
    const { name, code, description, color, active } = this.draft();
    if (!name.trim()) {
      this.feedback.set('Lütfen tanım adını girin.');
      return;
    }

    this.isSaving.set(true);
    this.feedback.set('');
    try {
      const editId = this.editingId();
      if (editId) {
        const existing = this.currentItems().find((i) => i.id === editId);
        if (existing) {
          await this.definitions.updateItem(this.selectedCategory(), {
            ...existing,
            name: name.trim(),
            code: code.trim() || existing.code,
            description: description.trim(),
            color,
            active,
          });
        }
      } else {
        await this.definitions.addItem(this.selectedCategory(), {
          name: name.trim(),
          code: code.trim(),
          description: description.trim(),
          color,
        });
      }
      this.closeDrawer();
    } catch (err) {
      this.feedback.set(err instanceof Error ? err.message : 'Kaydedilirken bir hata oluştu.');
    } finally {
      this.isSaving.set(false);
    }
  }
}
