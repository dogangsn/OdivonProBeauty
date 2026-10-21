import { HttpClient } from '@angular/common/http';
import { Service, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  SAAS_BEAUTY_PLANS,
  SaasInvoiceRecord,
  SubscriptionCycle,
  SubscriptionPlan,
  SubscriptionPlanId,
  TenantSubscriptionState,
} from './subscription.model';

const STORAGE_KEY = 'odivon_beauty_subscription';
const INVOICES_KEY = 'odivon_beauty_invoices';

function createDefaultTrialState(): TenantSubscriptionState {
  const now = new Date();
  const trialDays = 14;
  const trialEnds = new Date(now.getTime() + trialDays * 24 * 60 * 60 * 1000);

  return {
    membershipStatus: 'trial',
    trialEndsAt: trialEnds.toISOString(),
    subscriptionEndsAt: null,
    daysLeft: trialDays,
    isLocked: false,
    planId: 'pro',
    billingCycle: 'monthly',
    inGrace: false,
    lastPayment: null,
  };
}

function loadStoredState(): TenantSubscriptionState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as TenantSubscriptionState;
      // Re-calculate daysLeft dynamically against current date
      const nowMs = Date.now();
      if (parsed.membershipStatus === 'trial' && parsed.trialEndsAt) {
        const endMs = Date.parse(parsed.trialEndsAt);
        if (Number.isFinite(endMs)) {
          const diffDays = Math.ceil((endMs - nowMs) / (24 * 60 * 60 * 1000));
          parsed.daysLeft = Math.max(0, diffDays);
          parsed.isLocked = parsed.daysLeft <= 0;
          if (parsed.isLocked) {
            parsed.membershipStatus = 'expired';
          }
        }
      } else if (parsed.membershipStatus === 'active' && parsed.subscriptionEndsAt) {
        const endMs = Date.parse(parsed.subscriptionEndsAt);
        if (Number.isFinite(endMs)) {
          const diffDays = Math.ceil((endMs - nowMs) / (24 * 60 * 60 * 1000));
          parsed.daysLeft = Math.max(0, diffDays);
          // Grace period: 3 days
          parsed.isLocked = diffDays < -3;
          if (parsed.isLocked) {
            parsed.membershipStatus = 'expired';
          }
        }
      } else if (parsed.membershipStatus === 'expired') {
        parsed.isLocked = true;
        parsed.daysLeft = 0;
      }
      return parsed;
    }
  } catch {
    // Ignore JSON parse errors and fallback
  }

  const def = createDefaultTrialState();
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(def));
  } catch {
    // Storage unavailable
  }
  return def;
}

function loadStoredInvoices(): SaasInvoiceRecord[] {
  try {
    const raw = localStorage.getItem(INVOICES_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // fallback
  }
  return [];
}

@Service()
export class SubscriptionService {
  private readonly router = inject(Router);
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = environment.apiBaseUrl.replace(/\/$/, '');

  private readonly stateSignal = signal<TenantSubscriptionState>(loadStoredState());
  private readonly invoicesSignal = signal<SaasInvoiceRecord[]>(loadStoredInvoices());

  readonly state = this.stateSignal.asReadonly();
  readonly invoices = this.invoicesSignal.asReadonly();
  readonly plans = SAAS_BEAUTY_PLANS;

  readonly isLocked = computed(() => {
    const st = this.stateSignal();
    return st.isLocked || st.membershipStatus === 'expired' || st.daysLeft <= 0 && st.membershipStatus === 'trial';
  });

  readonly isInTrial = computed(() => {
    const st = this.stateSignal();
    return st.membershipStatus === 'trial' && !this.isLocked();
  });

  readonly daysLeft = computed(() => this.stateSignal().daysLeft);

  readonly activePlan = computed<SubscriptionPlan>(() => {
    const st = this.stateSignal();
    return this.plans.find((p) => p.id === st.planId) ?? this.plans[1];
  });

  readonly statusBadge = computed(() => {
    const st = this.stateSignal();
    if (this.isLocked()) {
      return { text: 'Süresi Doldu (Kilitli)', color: 'rose', icon: 'lock' };
    }
    if (st.membershipStatus === 'trial') {
      return { text: `14 Günlük Deneme (${st.daysLeft} gün kaldı)`, color: 'amber', icon: 'hourglass_top' };
    }
    if (st.membershipStatus === 'active') {
      return { text: `Aktif Abonelik (${st.daysLeft} gün kaldı)`, color: 'emerald', icon: 'verified' };
    }
    return { text: 'Bekliyor', color: 'slate', icon: 'schedule' };
  });

  constructor() {
    this.syncWithBackendStatus();
  }

  private saveState(updated: TenantSubscriptionState): void {
    this.stateSignal.set(updated);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // Ignore storage errors
    }
  }

  private saveInvoices(list: SaasInvoiceRecord[]): void {
    this.invoicesSignal.set(list);
    try {
      localStorage.setItem(INVOICES_KEY, JSON.stringify(list));
    } catch {
      // Ignore
    }
  }

  /**
   * Syncs status with backend if authenticated and available.
   */
  syncWithBackendStatus(): void {
    firstValueFrom(
      this.http.get<{
        membershipStatus?: string;
        subscriptionEndsAt?: string | null;
        trialEndsAt?: string | null;
        daysLeft?: number | null;
      }>(`${this.apiBaseUrl}/beauty/saas-billing/status`)
    )
      .then((res) => {
        if (res && res.membershipStatus) {
          const current = this.stateSignal();
          const isExp = res.membershipStatus === 'expired';
          const updated: TenantSubscriptionState = {
            ...current,
            membershipStatus: (res.membershipStatus as any) || current.membershipStatus,
            subscriptionEndsAt: res.subscriptionEndsAt ?? current.subscriptionEndsAt,
            trialEndsAt: res.trialEndsAt ?? current.trialEndsAt,
            daysLeft: typeof res.daysLeft === 'number' ? res.daysLeft : current.daysLeft,
            isLocked: isExp,
          };
          this.saveState(updated);
        }
      })
      .catch(() => {
        // Offline or local mock mode: local state works seamlessly
      });
  }

  /**
   * Subscribe and activate plan.
   * Unlocks all menus immediately and registers payment record.
   */
  async subscribe(
    planId: SubscriptionPlanId,
    cycle: SubscriptionCycle,
    cardHolderName = 'Güzellik Merkezi Sahibi'
  ): Promise<{ success: boolean; receiptNo: string }> {
    const plan = this.plans.find((p) => p.id === planId) ?? this.plans[1];
    const now = new Date();
    const periodMonths = cycle === 'yearly' ? 12 : 1;
    const endsAt = new Date(now.getFullYear(), now.getMonth() + periodMonths, now.getDate());
    const amount = cycle === 'yearly' ? plan.yearlyPrice : plan.monthlyPrice;
    const randomHex = Math.random().toString(36).substring(2, 8).toUpperCase();
    const receiptNo = `ODV-SUB-${now.toISOString().slice(0, 10).replace(/-/g, '')}-${randomHex}`;

    // Update state
    const newState: TenantSubscriptionState = {
      membershipStatus: 'active',
      trialEndsAt: null,
      subscriptionEndsAt: endsAt.toISOString(),
      daysLeft: cycle === 'yearly' ? 365 : 30,
      isLocked: false,
      planId,
      billingCycle: cycle,
      inGrace: false,
      lastPayment: {
        receiptNo,
        paidAt: now.toISOString(),
        amount,
        planName: plan.name,
        cycle,
      },
    };

    this.saveState(newState);

    // Record invoice
    const newInvoice: SaasInvoiceRecord = {
      id: `INV-${Date.now()}`,
      receiptNo,
      planId,
      planName: plan.name,
      billingCycle: cycle,
      amount,
      currency: 'TRY',
      paidAt: now.toISOString(),
      periodStartsAt: now.toISOString(),
      periodEndsAt: endsAt.toISOString(),
      status: 'paid',
    };

    const currentInvoices = [newInvoice, ...this.invoicesSignal()];
    this.saveInvoices(currentInvoices);

    // Call backend API in background
    firstValueFrom(
      this.http.post(`${this.apiBaseUrl}/beauty/saas-billing/subscribe`, {
        planId,
        billingCycle: cycle,
        cardHolderName,
      })
    ).catch(() => {});

    return { success: true, receiptNo };
  }

  /**
   * Test tool: Expire the trial immediately to test the locked menus / paywall flow.
   */
  async expireTrialSimulate(): Promise<void> {
    const expiredAt = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const current = this.stateSignal();
    const updated: TenantSubscriptionState = {
      ...current,
      membershipStatus: 'expired',
      trialEndsAt: expiredAt,
      subscriptionEndsAt: null,
      daysLeft: 0,
      isLocked: true,
    };
    this.saveState(updated);

    firstValueFrom(
      this.http.post(`${this.apiBaseUrl}/beauty/saas-billing/test/expire-trial`, {})
    ).catch(() => {});

    await this.router.navigateByUrl('/subscription').catch(() => {});
  }

  /**
   * Test tool: Reset trial back to 14 days.
   */
  async resetTrialSimulate(): Promise<void> {
    const def = createDefaultTrialState();
    this.saveState(def);

    firstValueFrom(
      this.http.post(`${this.apiBaseUrl}/beauty/saas-billing/test/reset-trial`, {})
    ).catch(() => {});
  }

  /**
   * Check if a route is accessible. If locked, only /subscription is accessible.
   */
  canAccessRoute(url: string): boolean {
    if (!this.isLocked()) return true;
    return url.startsWith('/subscription') || url.startsWith('/login') || url.startsWith('/pay');
  }
}
