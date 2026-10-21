import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { describe, expect, it } from 'vitest';
import { SubscriptionService } from '../../core/subscription/subscription.service';
import { Subscription } from './subscription';

describe('Subscription Component', () => {
  let fixture: ComponentFixture<Subscription>;
  let component: Subscription;
  let subService: SubscriptionService;

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [Subscription],
      providers: [
        SubscriptionService,
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([
          { path: 'subscription', component: class {} },
          { path: 'dashboard', component: class {} },
        ]),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Subscription);
    component = fixture.componentInstance;
    subService = TestBed.inject(SubscriptionService);
    fixture.detectChanges();
  });

  it('renders all 3 SaaS plans (Starter, Pro, Elite)', () => {
    expect(subService.plans.length).toBe(3);
    const planNames = subService.plans.map((p) => p.name);
    expect(planNames).toContain('Butik Salon');
    expect(planNames).toContain('Güzellik Merkezi');
    expect(planNames).toContain('Zincir & Poliklinik');
  });

  it('toggles billing cycle between monthly and yearly', () => {
    expect(component['selectedCycle']()).toBe('monthly');
    component['setCycle']('yearly');
    expect(component['selectedCycle']()).toBe('yearly');
  });

  it('opens checkout modal for a selected plan', () => {
    const proPlan = subService.plans.find((p) => p.id === 'pro')!;
    component['openCheckout'](proPlan);

    expect(component['checkoutModalOpen']()).toBe(true);
    expect(component['selectedPlanForCheckout']()?.id).toBe('pro');
    expect(component['checkoutSummary']().total).toBe(proPlan.monthlyPrice);
  });

  it('detects card brands accurately', () => {
    component['cardNumber'].set('4000 1234 5678 9010');
    expect(component['cardBrand']()).toBe('visa');

    component['cardNumber'].set('5400 1234 5678 9010');
    expect(component['cardBrand']()).toBe('mastercard');

    component['cardNumber'].set('9792 1234 5678 9010');
    expect(component['cardBrand']()).toBe('troy');
  });

  it('completes 3D secure subscription and unlocks service', async () => {
    // Start with locked state
    await subService.expireTrialSimulate();
    expect(subService.isLocked()).toBe(true);

    const proPlan = subService.plans.find((p) => p.id === 'pro')!;
    component['openCheckout'](proPlan);
    component['setCycle']('monthly');
    component['otpCode'].set('549182');

    await component['confirmOtpAndSubscribe']();

    expect(component['paymentSuccess']()).toBe(true);
    expect(component['generatedReceiptNo']()).toContain('ODV-SUB-');
    expect(subService.isLocked()).toBe(false);
  });
});
