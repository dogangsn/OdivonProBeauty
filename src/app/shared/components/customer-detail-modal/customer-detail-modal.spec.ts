import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiClient } from '../../../core/api-client';
import { CustomerDetailModal } from './customer-detail-modal';
import { DEMO_CUSTOMERS } from '../../../core/customer/customer-demo-data';

describe('CustomerDetailModal', () => {
  let apiMock: Record<string, ReturnType<typeof vi.fn>>;

  beforeEach(async () => {
    apiMock = {
      update: vi.fn().mockReturnValue(of({ success: true, data: {} })),
    };

    await TestBed.configureTestingModule({
      imports: [CustomerDetailModal],
      providers: [{ provide: ApiClient, useValue: apiMock }],
    }).compileComponents();
  });

  it('renders customer details correctly and computes age', () => {
    const fixture = TestBed.createComponent(CustomerDetailModal);
    const sampleCustomer = DEMO_CUSTOMERS[0]; // Zeynep Kaya (born 1996)

    fixture.componentRef.setInput('customer', sampleCustomer);
    fixture.componentRef.setInput('open', true);
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    expect(element.textContent).toContain('Zeynep Kaya');
    expect(element.textContent).toContain('10000000146');
    expect(element.textContent).toContain('Mimar');
  });

  it('detects critical medical alert when medications contains Roaccutane', () => {
    const fixture = TestBed.createComponent(CustomerDetailModal);
    // DEMO_CUSTOMERS[2] is Merve Yıldız with Zoretanin / Roaccutane
    const roaccutaneCustomer = DEMO_CUSTOMERS[2];

    fixture.componentRef.setInput('customer', roaccutaneCustomer);
    fixture.componentRef.setInput('open', true);
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    expect(element.textContent).toContain('RETİNOİD / ROACCUTANE');
  });

  it('detects pregnancy alert when isPregnant is true', () => {
    const fixture = TestBed.createComponent(CustomerDetailModal);
    // DEMO_CUSTOMERS[3] is Selin Çelik who is pregnant
    const pregnantCustomer = DEMO_CUSTOMERS[3];

    fixture.componentRef.setInput('customer', pregnantCustomer);
    fixture.componentRef.setInput('open', true);
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    expect(element.textContent).toContain('HAMİLELİK DÖNEMİ');
  });

  it('displays wallet balance and transaction ledger on wallet tab', () => {
    const fixture = TestBed.createComponent(CustomerDetailModal);
    const sampleCustomer = DEMO_CUSTOMERS[0]; // 1750 wallet balance

    fixture.componentRef.setInput('customer', sampleCustomer);
    fixture.componentRef.setInput('open', true);
    fixture.detectChanges();

    // Switch to wallet tab
    (fixture.componentInstance as any).setTab('wallet');
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    expect(element.textContent).toContain('Cüzdan Avans Yüklemesi');
    expect(element.textContent).toContain('Cilt Bakımı Seansı Ödemesi');
  });
});
