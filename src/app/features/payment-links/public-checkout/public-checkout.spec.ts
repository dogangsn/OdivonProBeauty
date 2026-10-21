import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { vi } from 'vitest';
import Swal from 'sweetalert2';
import { PublicCheckout } from './public-checkout';

describe('PublicCheckout Customer Payment Page', () => {
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
      imports: [PublicCheckout],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('initializes checkout page with payment link data', () => {
    const fixture = TestBed.createComponent(PublicCheckout);
    const component = fixture.componentInstance;
    expect(component).toBeTruthy();
    expect(component.paymentLink()).toBeDefined();
    expect(component.paymentLink().amount).toBeGreaterThan(0);
    expect(component.installmentOptions().length).toBeGreaterThan(0);
  });

  it('detects card brand dynamically from card number', () => {
    const fixture = TestBed.createComponent(PublicCheckout);
    const component = fixture.componentInstance;

    component.cardNumber.set('4543 1200 4491 8821');
    expect(component.detectedCardBrand()).toBe('Visa');

    component.cardNumber.set('5428 1900 4421 9901');
    expect(component.detectedCardBrand()).toBe('Mastercard');

    component.cardNumber.set('9792 1100 2233 4455');
    expect(component.detectedCardBrand()).toBe('Troy');
  });

  it('calculates installment amounts and allows selection', () => {
    const fixture = TestBed.createComponent(PublicCheckout);
    const component = fixture.componentInstance;

    component.selectInstallment(3);
    expect(component.selectedInstallment()).toBe(3);
  });

  it('handles 3D Secure OTP confirmation and completes payment', async () => {
    vi.useFakeTimers();
    const fixture = TestBed.createComponent(PublicCheckout);
    const component = fixture.componentInstance;

    component.triggerSubmitPayment();
    expect(component.isOtpModalOpen()).toBe(true);

    component.otpInput.set('582914');
    component.confirmOtp();

    vi.advanceTimersByTime(1200);

    expect(component.isPaidSuccess()).toBe(true);
    expect(component.paymentLink().status).toBe('paid');
    vi.useRealTimers();
  });
});
