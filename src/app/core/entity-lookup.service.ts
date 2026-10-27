import { Service, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ApiClient } from './api-client';
import { BeautyRecord } from './beauty.model';

export interface LookupOption {
  label: string;
  value: string;
}

const ENTITY_RESOURCES = [
  'customers',
  'services',
  'staff',
  'devices',
  'rooms',
  'suppliers',
  'service-categories',
  'packages',
  'products',
] as const;

export type EntityLookupKey = (typeof ENTITY_RESOURCES)[number];

@Service()
export class EntityLookupService {
  private readonly api = inject(ApiClient);

  // Store: resource -> list of beauty records
  private readonly store = signal<Record<string, BeautyRecord[]>>({});
  private readonly inFlight = new Map<string, Promise<BeautyRecord[]>>();

  // Read raw records for a resource
  getRecords(resource: string): BeautyRecord[] {
    return this.store()[resource] ?? [];
  }

  // Read options for a resource
  getOptions(resource: string): LookupOption[] {
    const list = this.store()[resource] ?? [];
    return list.map((item) => ({
      value: item.id,
      label: this.formatEntityLabel(resource, item),
    }));
  }

  // Resolve single ID to human label
  resolve(resource: string, id: unknown): string | undefined {
    if (typeof id !== 'string' || !id) return undefined;
    const list = this.store()[resource];
    if (!list) return undefined;
    const item = list.find((r) => r.id === id);
    return item ? this.formatEntityLabel(resource, item) : undefined;
  }

  // Preload/ensure data is loaded for a resource
  async ensure(resource: string, branchId?: string): Promise<BeautyRecord[]> {
    const current = this.store()[resource];
    if (current && current.length > 0) return current;

    const existingPromise = this.inFlight.get(resource);
    if (existingPromise) return existingPromise;

    const promise = this.fetchResource(resource, branchId);
    this.inFlight.set(resource, promise);

    try {
      const records = await promise;
      this.store.update((curr) => ({ ...curr, [resource]: records }));
      return records;
    } finally {
      this.inFlight.delete(resource);
    }
  }

  // Refresh an entity resource (e.g. after adding a customer or service)
  async refresh(resource: string, branchId?: string): Promise<BeautyRecord[]> {
    this.inFlight.delete(resource);
    const records = await this.fetchResource(resource, branchId);
    this.store.update((curr) => ({ ...curr, [resource]: records }));
    return records;
  }

  isEntityResource(key: string): boolean {
    return ENTITY_RESOURCES.includes(key as EntityLookupKey);
  }

  private async fetchResource(resource: string, branchId?: string): Promise<BeautyRecord[]> {
    try {
      const res = await firstValueFrom(
        this.api.list<BeautyRecord>(resource, {
          limit: 200,
          branchId: branchId || undefined,
        }),
      );
      return res.data ?? [];
    } catch {
      return [];
    }
  }

  private formatEntityLabel(resource: string, item: BeautyRecord): string {
    switch (resource) {
      case 'customers': {
        const name = String(item['fullName'] || item['name'] || '').trim();
        const phone = String(item['phone'] || '').trim();
        if (name && phone) return `${name} (${phone})`;
        return name || phone || item.id;
      }
      case 'services': {
        const name = String(item['name'] || '').trim();
        const price = item['price'];
        if (name && price !== undefined) {
          const formatted = new Intl.NumberFormat('tr-TR', {
            style: 'currency',
            currency: 'TRY',
            maximumFractionDigits: 0,
          }).format(Number(price) || 0);
          return `${name} - ${formatted}`;
        }
        return name || item.id;
      }
      case 'staff': {
        const name = String(item['fullName'] || item['name'] || '').trim();
        const role = String(item['role'] || '').trim();
        if (name && role) return `${name} [${role}]`;
        return name || item.id;
      }
      case 'devices': {
        const name = String(item['name'] || '').trim();
        const brand = String(item['brand'] || '').trim();
        if (name && brand) return `${name} (${brand})`;
        return name || item.id;
      }
      case 'products': {
        const name = String(item['name'] || '').trim();
        const brand = String(item['brand'] || '').trim();
        if (name && brand) return `${name} (${brand})`;
        return name || item.id;
      }
      case 'rooms':
      case 'suppliers':
      case 'service-categories':
      case 'packages':
      default: {
        return String(item['name'] || item['title'] || item['fullName'] || item.id);
      }
    }
  }
}
