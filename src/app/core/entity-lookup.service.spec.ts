import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiClient } from './api-client';
import { EntityLookupService } from './entity-lookup.service';

describe('EntityLookupService', () => {
  let service: EntityLookupService;
  let apiMock: { list: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    apiMock = {
      list: vi.fn().mockReturnValue(
        of({
          ok: true,
          data: [
            { id: 'c1', fullName: 'Ayşe Yılmaz', phone: '+905551112233' },
            { id: 'c2', fullName: 'Fatma Demir', phone: '' },
          ],
        }),
      ),
    };

    TestBed.configureTestingModule({
      providers: [EntityLookupService, { provide: ApiClient, useValue: apiMock }],
    });
    service = TestBed.inject(EntityLookupService);
  });

  it('should identify supported entity resources', () => {
    expect(service.isEntityResource('customers')).toBe(true);
    expect(service.isEntityResource('services')).toBe(true);
    expect(service.isEntityResource('payment-methods')).toBe(false);
  });

  it('should ensure and resolve customer labels with phone', async () => {
    const list = await service.ensure('customers');
    expect(list.length).toBe(2);
    expect(service.resolve('customers', 'c1')).toBe('Ayşe Yılmaz (+905551112233)');
    expect(service.resolve('customers', 'c2')).toBe('Fatma Demir');
    expect(service.resolve('customers', 'unknown')).toBeUndefined();
  });

  it('should format dropdown options', async () => {
    await service.ensure('customers');
    const options = service.getOptions('customers');
    expect(options).toEqual([
      { value: 'c1', label: 'Ayşe Yılmaz (+905551112233)' },
      { value: 'c2', label: 'Fatma Demir' },
    ]);
  });
});
