import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiClient } from '../../../core/api-client';
import { BranchService } from '../../../core/branch.service';
import { EntityLookupService } from '../../../core/entity-lookup.service';
import { CustomerFormModal } from './customer-form-modal';

describe('CustomerFormModal', () => {
  let fixture: ComponentFixture<CustomerFormModal>;
  let component: CustomerFormModal;
  let apiMock: { list: ReturnType<typeof vi.fn>; create: ReturnType<typeof vi.fn> };
  let entityLookup: EntityLookupService;

  beforeEach(async () => {
    apiMock = {
      list: vi.fn().mockReturnValue(of({ ok: true, data: [] })),
      create: vi.fn().mockReturnValue(of({ ok: true, data: { id: 'cust_new', fullName: 'Test' } })),
    };

    await TestBed.configureTestingModule({
      imports: [CustomerFormModal],
      providers: [
        { provide: ApiClient, useValue: apiMock },
        {
          provide: BranchService,
          useValue: {
            activeBranchId: vi.fn().mockReturnValue('branch_1'),
          },
        },
        EntityLookupService,
      ],
    }).compileComponents();

    entityLookup = TestBed.inject(EntityLookupService);
    fixture = TestBed.createComponent(CustomerFormModal);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the modal component', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize birthDate to today by default', () => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const expected = `${y}-${m}-${day}`;
    expect((component as any).birthDate()).toBe(expected);
  });

  it('should toggle maximized / restored state', () => {
    expect((component as any).isMaximized()).toBe(false);
    (component as any).toggleMaximize();
    expect((component as any).isMaximized()).toBe(true);
    (component as any).toggleMaximize();
    expect((component as any).isMaximized()).toBe(false);
  });

  it('should navigate between steps using nextTab and prevTab', () => {
    expect((component as any).activeTab()).toBe('identity');
    expect((component as any).currentStepIndex()).toBe(0);

    (component as any).nextTab();
    expect((component as any).activeTab()).toBe('contact');
    expect((component as any).currentStepIndex()).toBe(1);

    (component as any).prevTab();
    expect((component as any).activeTab()).toBe('identity');
  });

  it('should detect duplicate TCKN when customer with same TCKN exists in system', async () => {
    // Seed existing customer with TCKN in entityLookup
    (entityLookup as any).store.set({
      customers: [
        { id: 'c_existing_1', fullName: 'Ayşe Demir', phone: '05551112233', identityNumber: '10000000146' },
      ],
    });

    (component as any).identityNumber.set('10000000146');
    fixture.detectChanges();

    const dup = (component as any).existingCustomerWithTckn();
    expect(dup).toBeTruthy();
    expect(dup.fullName).toBe('Ayşe Demir');

    // Attempting submit should block duplicate
    (component as any).fullName.set('Fatma Çelik');
    (component as any).phone.set('05329998877');
    await (component as any).submit();

    expect((component as any).error()).toContain('zaten sistemde kayıtlı');
    expect(apiMock.create).not.toHaveBeenCalled();
  });
});
