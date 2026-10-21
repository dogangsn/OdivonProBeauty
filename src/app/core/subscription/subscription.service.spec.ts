import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { describe, expect, it } from 'vitest';
import { SubscriptionService } from './subscription.service';

describe('SubscriptionService', () => {
  let service: SubscriptionService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        SubscriptionService,
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([
          { path: 'subscription', component: class {} },
          { path: 'dashboard', component: class {} },
        ]),
      ],
    });
    service = TestBed.inject(SubscriptionService);
  });

  it('initializes with a default 14-day trial in an unlocked state', () => {
    expect(service.state().membershipStatus).toBe('trial');
    expect(service.state().daysLeft).toBe(14);
    expect(service.isLocked()).toBe(false);
    expect(service.isInTrial()).toBe(true);
  });

  it('locks the tenant when simulating trial expiration', async () => {
    await service.expireTrialSimulate();
    expect(service.state().membershipStatus).toBe('expired');
    expect(service.state().daysLeft).toBe(0);
    expect(service.isLocked()).toBe(true);
    expect(service.isInTrial()).toBe(false);
  });

  it('unlocks the tenant and records an invoice upon subscription', async () => {
    // First lock it
    await service.expireTrialSimulate();
    expect(service.isLocked()).toBe(true);

    // Now subscribe to pro yearly
    const result = await service.subscribe('pro', 'yearly', 'Dr. Özge Güzellik');
    expect(result.success).toBe(true);
    expect(result.receiptNo).toContain('ODV-SUB-');

    expect(service.isLocked()).toBe(false);
    expect(service.state().membershipStatus).toBe('active');
    expect(service.state().billingCycle).toBe('yearly');
    expect(service.state().planId).toBe('pro');
    expect(service.invoices().length).toBeGreaterThan(0);
    expect(service.invoices()[0]?.receiptNo).toBe(result.receiptNo);
  });

  it('resets trial back to 14 days and unlocks', async () => {
    await service.expireTrialSimulate();
    expect(service.isLocked()).toBe(true);

    await service.resetTrialSimulate();
    expect(service.isLocked()).toBe(false);
    expect(service.state().membershipStatus).toBe('trial');
    expect(service.state().daysLeft).toBe(14);
  });
});
