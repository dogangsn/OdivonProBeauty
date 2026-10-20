import { DOCUMENT } from '@angular/common';
import { DestroyRef, Service, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ApiClient } from '../api-client';
import { BeautyRecord } from '../beauty.model';
import {
  DEFAULT_DEFINITIONS,
  DEFINITION_CATEGORIES,
  DefinitionCategoryKey,
  DefinitionCategoryMeta,
  DefinitionItem,
} from './definitions.model';

const STORAGE_KEY_PREFIX = 'odivon:def:';

@Service()
export class DefinitionsService {
  private readonly api = inject(ApiClient);
  private readonly document = inject(DOCUMENT);
  private readonly destroyRef = inject(DestroyRef);

  // Reactive state map: category key -> array of DefinitionItem
  private readonly store = signal<Record<DefinitionCategoryKey, DefinitionItem[]>>(
    this.createInitialStore(),
  );

  readonly isLoaded = signal(false);
  readonly isSaving = signal(false);
  readonly categories = DEFINITION_CATEGORIES;

  constructor() {
    this.restoreFromLocal();
    void this.syncRemote();
  }

  /** Gets all items for a category (active & inactive) */
  getItems(category: DefinitionCategoryKey): DefinitionItem[] {
    return this.store()[category] ?? [];
  }

  /** Gets active items for a category */
  getActiveItems(category: DefinitionCategoryKey): DefinitionItem[] {
    return this.getItems(category).filter((i) => i.active);
  }

  /** Form dropdown options: { label, value } */
  getOptions(category: DefinitionCategoryKey): { label: string; value: string }[] {
    return this.getActiveItems(category).map((i) => ({
      label: i.name,
      value: i.code,
    }));
  }

  /** Resolves a code to its display name */
  resolveLabel(category: DefinitionCategoryKey, codeOrValue?: string | null): string {
    if (!codeOrValue) return '';
    const item = this.getItems(category).find(
      (i) => i.code === codeOrValue || i.id === codeOrValue || i.name === codeOrValue,
    );
    return item ? item.name : codeOrValue;
  }

  /** Resolves color tag for a code */
  resolveColor(category: DefinitionCategoryKey, codeOrValue?: string | null): string | undefined {
    if (!codeOrValue) return undefined;
    const item = this.getItems(category).find((i) => i.code === codeOrValue || i.id === codeOrValue);
    return item?.color;
  }

  /** Adds a new definition item */
  async addItem(
    category: DefinitionCategoryKey,
    draft: { name: string; code?: string; description?: string; color?: string },
  ): Promise<DefinitionItem> {
    const list = [...this.getItems(category)];
    const code =
      draft.code?.trim() ||
      draft.name
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '-');
    const newItem: DefinitionItem = {
      id: `def_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      category,
      name: draft.name.trim(),
      code,
      description: draft.description?.trim(),
      color: draft.color || '#6366f1',
      active: true,
      order: list.length + 1,
      isSystem: false,
    };

    const updated = [...list, newItem];
    this.updateCategoryInStore(category, updated);
    await this.persistCategory(category, updated);
    return newItem;
  }

  /** Updates an existing definition item */
  async updateItem(category: DefinitionCategoryKey, updatedItem: DefinitionItem): Promise<void> {
    const list = this.getItems(category).map((i) => (i.id === updatedItem.id ? updatedItem : i));
    this.updateCategoryInStore(category, list);
    await this.persistCategory(category, list);
  }

  /** Toggles active status of an item */
  async toggleActive(category: DefinitionCategoryKey, id: string): Promise<void> {
    const list = this.getItems(category).map((i) => (i.id === id ? { ...i, active: !i.active } : i));
    this.updateCategoryInStore(category, list);
    await this.persistCategory(category, list);
  }

  /** Deletes an item */
  async deleteItem(category: DefinitionCategoryKey, id: string): Promise<void> {
    const list = this.getItems(category).filter((i) => i.id !== id);
    this.updateCategoryInStore(category, list);
    await this.persistCategory(category, list);
  }

  /** Resets a category back to initial defaults */
  async resetToDefaults(category: DefinitionCategoryKey): Promise<void> {
    const defaults = this.createDefaultItems(category);
    this.updateCategoryInStore(category, defaults);
    await this.persistCategory(category, defaults);
  }

  // --- Internal Persistence ---

  private createInitialStore(): Record<DefinitionCategoryKey, DefinitionItem[]> {
    const result = {} as Record<DefinitionCategoryKey, DefinitionItem[]>;
    for (const cat of DEFINITION_CATEGORIES) {
      result[cat.key] = this.createDefaultItems(cat.key);
    }
    return result;
  }

  private createDefaultItems(category: DefinitionCategoryKey): DefinitionItem[] {
    const list = DEFAULT_DEFINITIONS[category] ?? [];
    return list.map((item, index) => ({
      ...item,
      id: `def_sys_${category}_${index + 1}`,
      isSystem: true,
    }));
  }

  private updateCategoryInStore(category: DefinitionCategoryKey, items: DefinitionItem[]): void {
    this.store.update((prev) => ({
      ...prev,
      [category]: items,
    }));
    this.saveToLocal(category, items);
  }

  private saveToLocal(category: DefinitionCategoryKey, items: DefinitionItem[]): void {
    try {
      const storage = this.document.defaultView?.localStorage;
      if (storage) {
        storage.setItem(`${STORAGE_KEY_PREFIX}${category}`, JSON.stringify(items));
      }
    } catch {
      // Ignore storage errors
    }
  }

  private restoreFromLocal(): void {
    try {
      const storage = this.document.defaultView?.localStorage;
      if (!storage) return;

      const restored = { ...this.store() };
      for (const cat of DEFINITION_CATEGORIES) {
        const raw = storage.getItem(`${STORAGE_KEY_PREFIX}${cat.key}`);
        if (raw) {
          try {
            const parsed = JSON.parse(raw) as DefinitionItem[];
            if (Array.isArray(parsed) && parsed.length > 0) {
              restored[cat.key] = parsed;
            }
          } catch {
            // Bad JSON
          }
        }
      }
      this.store.set(restored);
    } catch {
      // Ignore
    }
  }

  async syncRemote(): Promise<void> {
    try {
      const response = await firstValueFrom(
        this.api.list<BeautyRecord>('settings', { limit: 100 }),
      );
      const settings = response.data ?? [];
      const updatedStore = { ...this.store() };
      let changed = false;

      for (const cat of DEFINITION_CATEGORIES) {
        const settingName = `def:${cat.key}`;
        const record = settings.find((s) => s['name'] === settingName && s['scope'] === 'definition');
        if (record && typeof record['value'] === 'string') {
          try {
            const parsed = JSON.parse(record['value']) as DefinitionItem[];
            if (Array.isArray(parsed) && parsed.length > 0) {
              updatedStore[cat.key] = parsed;
              this.saveToLocal(cat.key, parsed);
              changed = true;
            }
          } catch {
            // Bad JSON
          }
        }
      }

      if (changed) {
        this.store.set(updatedStore);
      }
    } catch {
      // Offline or settings endpoint not available yet - local storage / default fallback active
    } finally {
      this.isLoaded.set(true);
    }
  }

  private async persistCategory(
    category: DefinitionCategoryKey,
    items: DefinitionItem[],
  ): Promise<void> {
    this.isSaving.set(true);
    try {
      const settingName = `def:${category}`;
      await firstValueFrom(
        this.api.create('settings', {
          name: settingName,
          scope: 'definition',
          value: JSON.stringify(items),
          status: 'active',
        }),
      ).catch(() => undefined);
    } finally {
      this.isSaving.set(false);
    }
  }
}
