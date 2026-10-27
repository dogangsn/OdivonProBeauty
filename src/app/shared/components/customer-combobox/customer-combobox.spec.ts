import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiClient } from '../../../core/api-client';
import { CustomerCombobox } from './customer-combobox';
import { DEMO_CUSTOMERS } from '../../../core/customer/customer-demo-data';

describe('CustomerCombobox', () => {
  let fixture: ComponentFixture<CustomerCombobox>;
  let component: CustomerCombobox;
  let apiMock: Record<string, ReturnType<typeof vi.fn>>;

  beforeEach(async () => {
    apiMock = {
      list: vi.fn().mockReturnValue(of({ success: true, data: [] })),
    };

    await TestBed.configureTestingModule({
      imports: [CustomerCombobox],
      providers: [{ provide: ApiClient, useValue: apiMock }],
    }).compileComponents();

    fixture = TestBed.createComponent(CustomerCombobox);
    component = fixture.componentInstance;
  });

  it('initializes in closed state with no selection', () => {
    fixture.componentRef.setInput('preloadedCustomers', DEMO_CUSTOMERS);
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('.combobox-trigger')).toBeTruthy();
    expect(element.querySelector('.combobox-dropdown-panel')).toBeFalsy();
  });

  it('opens dropdown on trigger click and lists preloaded customers', () => {
    fixture.componentRef.setInput('preloadedCustomers', DEMO_CUSTOMERS);
    fixture.detectChanges();

    const trigger = fixture.nativeElement.querySelector('.combobox-trigger') as HTMLElement;
    trigger.click();
    fixture.detectChanges();

    const dropdown = fixture.nativeElement.querySelector('.combobox-dropdown-panel');
    expect(dropdown).toBeTruthy();
    expect(dropdown.textContent).toContain('Zeynep Kaya');
    expect(dropdown.textContent).toContain('Burak Öztürk');
  });

  it('filters customers in real-time by search query (name or phone)', () => {
    fixture.componentRef.setInput('preloadedCustomers', DEMO_CUSTOMERS);
    fixture.detectChanges();

    // Open dropdown
    const trigger = fixture.nativeElement.querySelector('.combobox-trigger') as HTMLElement;
    trigger.click();
    fixture.detectChanges();

    // Type query
    const searchInput = fixture.nativeElement.querySelector(
      '.combobox-search-input',
    ) as HTMLInputElement;
    searchInput.value = 'zeynep';
    searchInput.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    const options = fixture.nativeElement.querySelectorAll('[role="option"]');
    expect(options.length).toBe(1);
    expect(options[0].textContent).toContain('Zeynep Kaya');
  });

  it('enforces performance control by capping DOM items when thousands of records exist', () => {
    // Generate 150 simulated customer records
    const simulatedCustomers = Array.from({ length: 150 }, (_, i) => ({
      id: `sim_cust_${i}`,
      fullName: `Test Müşteri ${i}`,
      phone: `+90 530 000 ${i.toString().padStart(4, '0')}`,
      status: 'active',
    }));

    fixture.componentRef.setInput('preloadedCustomers', simulatedCustomers);
    fixture.detectChanges();

    const trigger = fixture.nativeElement.querySelector('.combobox-trigger') as HTMLElement;
    trigger.click();
    fixture.detectChanges();

    const options = fixture.nativeElement.querySelectorAll('[role="option"]');
    // Max rendered items should be capped at 35 to prevent DOM bloat
    expect(options.length).toBe(35);

    const banner = fixture.nativeElement.querySelector('.bg-amber-50\\/70');
    expect(banner).toBeTruthy();
    expect(banner?.textContent).toContain('İlk 35 / 150 kayıt gösteriliyor');
  });

  it('selects customer on click and displays selected card', () => {
    fixture.componentRef.setInput('preloadedCustomers', DEMO_CUSTOMERS);
    fixture.detectChanges();

    // Open dropdown
    const trigger = fixture.nativeElement.querySelector('.combobox-trigger') as HTMLElement;
    trigger.click();
    fixture.detectChanges();

    // Click first item (Zeynep Kaya)
    const firstOption = fixture.nativeElement.querySelector('[role="option"]') as HTMLElement;
    firstOption.click();
    fixture.detectChanges();

    expect(component.value()).toBe('demo_cust_01');
    const selectedText = fixture.nativeElement.textContent;
    expect(selectedText).toContain('Zeynep Kaya');
    expect(selectedText).toContain('+90 532 411 20 30');
    expect(fixture.nativeElement.querySelector('.combobox-dropdown-panel')).toBeFalsy();
  });

  it('clears selection when clear button is clicked', () => {
    fixture.componentRef.setInput('preloadedCustomers', DEMO_CUSTOMERS);
    fixture.componentRef.setInput('value', 'demo_cust_01');
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Zeynep Kaya');

    const clearBtn = fixture.nativeElement.querySelector(
      'button[aria-label="Müşteri seçimini kaldır"]',
    ) as HTMLElement;
    clearBtn.click();
    fixture.detectChanges();

    expect(component.value()).toBe('');
    expect(fixture.nativeElement.querySelector('.combobox-trigger')).toBeTruthy();
  });
});
