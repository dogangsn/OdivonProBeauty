import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { vi } from 'vitest';
import Swal from 'sweetalert2';
import { PaymentLinks } from './payment-links';
import { buildWhatsAppShareUrl } from '../../core/payment-link/payment-link.model';

describe('PaymentLinks Hub Component', () => {
  beforeEach(async () => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });

    vi.spyOn(Swal, 'fire').mockResolvedValue({
      isConfirmed: true,
      isDenied: false,
      isDismissed: false,
      value: true,
    } as never);

    await TestBed.configureTestingModule({
      imports: [PaymentLinks],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('initializes with default payment links and stats', () => {
    const fixture = TestBed.createComponent(PaymentLinks);
    const component = fixture.componentInstance;
    expect(component).toBeTruthy();
    expect(component.paymentLinks().length).toBeGreaterThan(0);
    expect(component.stats().totalPaidAmount).toBeGreaterThan(0);
    expect(component.pendingLinksCount()).toBeGreaterThan(0);
  });

  it('filters payment links by status and query', () => {
    const fixture = TestBed.createComponent(PaymentLinks);
    const component = fixture.componentInstance;

    component.statusFilter.set('paid');
    expect(component.filteredLinks().every((l) => l.status === 'paid')).toBe(true);

    component.statusFilter.set('all');
    component.searchQuery.set('Merve');
    expect(component.filteredLinks().some((l) => l.customerName.includes('Merve'))).toBe(true);
  });

  it('opens create modal with prefilled data and saves new payment link', () => {
    const fixture = TestBed.createComponent(PaymentLinks);
    const component = fixture.componentInstance;

    const initialCount = component.paymentLinks().length;
    component.openCreateModal({
      customerName: 'Test Müşteri',
      customerPhone: '+90 532 999 88 77',
      amount: 750,
      paymentType: 'deposit',
      title: 'Ön Ödeme',
    });

    expect(component.isCreateModalOpen()).toBe(true);
    expect(component.newCustomerName()).toBe('Test Müşteri');
    expect(component.newAmount()).toBe(750);

    component.savePaymentLink();
    expect(component.paymentLinks().length).toBe(initialCount + 1);
    expect(component.isCreateModalOpen()).toBe(false);
  });

  it('builds valid WhatsApp share URL with clean phone and message', () => {
    const url = buildWhatsAppShareUrl(
      '+90 (532) 111-22-33',
      'Merve Aydın',
      'Lazer Kaporası',
      500,
      '/pay/LNK-8921'
    );
    expect(url).toContain('https://wa.me/905321112233');
    expect(url).toContain('Merve');
    expect(url).toContain('500');
  });

  it('cancels a payment link successfully', () => {
    const fixture = TestBed.createComponent(PaymentLinks);
    const component = fixture.componentInstance;

    const target = component.paymentLinks()[0];
    component.cancelLink(target);

    const updated = component.paymentLinks().find((l) => l.id === target.id);
    expect(updated?.status).toBe('cancelled');
  });
});
