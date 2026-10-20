import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiClient } from '../../../core/api-client';
import { BranchService } from '../../../core/branch.service';
import { EntityLookupService } from '../../../core/entity-lookup.service';
import { ServiceWizard } from './service-wizard';

describe('ServiceWizard', () => {
  let apiMock: { list: ReturnType<typeof vi.fn>; create: ReturnType<typeof vi.fn> };
  let branchMock: { branches: ReturnType<typeof vi.fn>; activeBranchId: ReturnType<typeof vi.fn> };
  let entityLookupMock: { refresh: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    apiMock = {
      list: vi.fn().mockReturnValue(of({ ok: true, data: [] })),
      create: vi.fn().mockReturnValue(of({ ok: true, data: { id: 'created_123' } })),
    };
    branchMock = {
      branches: vi.fn().mockReturnValue([{ id: 'b1', name: 'Merkez Şube' }]),
      activeBranchId: vi.fn().mockReturnValue('b1'),
    };
    entityLookupMock = {
      refresh: vi.fn().mockResolvedValue([]),
    };

    await TestBed.configureTestingModule({
      imports: [ServiceWizard],
      providers: [
        { provide: ApiClient, useValue: apiMock },
        { provide: BranchService, useValue: branchMock },
        { provide: EntityLookupService, useValue: entityLookupMock },
      ],
    }).compileComponents();
  });

  it('should create the wizard component with preset categories', () => {
    const fixture = TestBed.createComponent(ServiceWizard);
    const component = fixture.componentInstance;
    expect(component).toBeTruthy();
    expect(component.categories().length).toBeGreaterThan(4);
    expect(component.selectedCategoriesCount()).toBeGreaterThan(0);
  });

  it('should toggle categories and services', () => {
    const fixture = TestBed.createComponent(ServiceWizard);
    const component = fixture.componentInstance;
    const initialSelected = component.selectedCategoriesCount();

    component.toggleCategory('lazer');
    expect(component.selectedCategoriesCount()).toBe(initialSelected - 1);

    component.selectAllCategories(true);
    expect(component.selectedCategoriesCount()).toBe(component.categories().length);
  });

  it('should proceed to step 2 and update pricing', () => {
    const fixture = TestBed.createComponent(ServiceWizard);
    const component = fixture.componentInstance;
    component.goToStep(2);
    expect(component.step()).toBe(2);

    const activeCat = component.activeCategory();
    expect(activeCat).toBeDefined();

    component.updateServiceField(activeCat.key, 0, 'price', 999);
    const updatedService = component.categories().find((c) => c.key === activeCat.key)?.services[0];
    expect(updatedService?.price).toBe(999);
  });
});
