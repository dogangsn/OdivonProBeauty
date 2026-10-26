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

interface PublicSaasPricingPlan {
  id: string;
  name: string;
  module: string;
  monthly: number | null;
  yearly: number | null;
}

interface PublicSaasPricingResponse {
  success: boolean;
  data?: {
    currency: 'TRY';
    product: string;
    updatedAt: string;
    plans: PublicSaasPricingPlan[];
  };
}

interface SaasStatusResponse {
  success: boolean;
  data?: {
    membershipStatus?: string;
    subscriptionEndsAt?: string | null;
    trialEndsAt?: string | null;
    daysLeft?: number | null;
    inGrace?: boolean;
    graceDays?: number;
    graceEndsAt?: string | null;
  };
}

interface SaasPaymentApiItem {
  id: string;
  receiptNo: string;
  planId: string;
  billingCycle: SubscriptionCycle;
  amountKurus?: number;
  amount?: number;
  currency?: 'TRY';
  paidAt: string;
  periodStartsAt: string;
  periodEndsAt: string;
}

interface SaasPaymentsResponse {
  success: boolean;
  data?: SaasPaymentApiItem[];
}

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
    // Ignore JSON errors
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

  private readonly plansSignal = signal<readonly SubscriptionPlan[]>(SAAS_BEAUTY_PLANS);
  private readonly stateSignal = signal<TenantSubscriptionState>(loadStoredState());
  private readonly invoicesSignal = signal<SaasInvoiceRecord[]>(loadStoredInvoices());

  get plans(): readonly SubscriptionPlan[] {
    return this.plansSignal();
  }

  readonly state = this.stateSignal.asReadonly();
  readonly invoices = this.invoicesSignal.asReadonly();

  readonly isLocked = computed(() => {
    const st = this.stateSignal();
    return st.isLocked || st.membershipStatus === 'expired' || (st.daysLeft <= 0 && st.membershipStatus === 'trial');
  });

  readonly isInTrial = computed(() => {
    const st = this.stateSignal();
    return st.membershipStatus === 'trial' && !this.isLocked();
  });

  readonly daysLeft = computed(() => this.stateSignal().daysLeft);

  readonly activePlan = computed<SubscriptionPlan>(() => {
    const st = this.stateSignal();
    return this.plans.find((p) => p.id === st.planId) ?? this.plans[1] ?? SAAS_BEAUTY_PLANS[1];
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
    this.refreshAll();
  }

  /**
   * Refreshes plans, status, and invoices from the backend API.
   */
  refreshAll(): void {
    this.syncWithBackendPlans();
    this.syncWithBackendStatus();
    this.syncWithBackendPayments();
  }

  /**
   * Fetches real live plan pricing from MainApi.
   * Eliminates static price hardcoding.
   */
  syncWithBackendPlans(): void {
    firstValueFrom(
      this.http.get<PublicSaasPricingResponse>(
        `${this.apiBaseUrl}/public/saas-pricing?product=beauty`,
      ),
    )
      .then((res) => {
        const apiPlans = res?.data?.plans;
        if (Array.isArray(apiPlans) && apiPlans.length > 0) {
          const updated = this.plansSignal().map((basePlan) => {
            const matched = apiPlans.find((p) => p.id === basePlan.id);
            if (!matched) return basePlan;
            const monthlyPrice =
              typeof matched.monthly === 'number' ? matched.monthly : basePlan.monthlyPrice;
            const yearlyPrice =
              typeof matched.yearly === 'number' ? matched.yearly : basePlan.yearlyPrice;
            const yearlyMonthlyEquivalent = Math.round(yearlyPrice / 12);
            return {
              ...basePlan,
              name: matched.name?.trim() ? matched.name : basePlan.name,
              monthlyPrice,
              yearlyPrice,
              yearlyMonthlyEquivalent,
            };
          });
          this.plansSignal.set(updated);
        }
      })
      .catch(() => {
        // Keep baseline in case of network disconnect
      });
  }

  /**
   * Syncs subscription status and remaining days from MainApi.
   */
  syncWithBackendStatus(): void {
    firstValueFrom(
      this.http.get<SaasStatusResponse>(`${this.apiBaseUrl}/beauty/saas-billing/status`),
    )
      .then((res) => {
        const statusData = res?.data ?? (res as unknown as SaasStatusResponse['data']);
        if (statusData && statusData.membershipStatus) {
          const current = this.stateSignal();
          const rawDays = typeof statusData.daysLeft === 'number' ? statusData.daysLeft : 0;
          const isExp =
            statusData.membershipStatus === 'expired' ||
            (rawDays <= 0 && statusData.membershipStatus === 'trial');
          const daysLeft = Math.max(0, rawDays);

          const updated: TenantSubscriptionState = {
            ...current,
            membershipStatus: isExp
              ? 'expired'
              : (statusData.membershipStatus as TenantSubscriptionState['membershipStatus']),
            subscriptionEndsAt: statusData.subscriptionEndsAt ?? current.subscriptionEndsAt,
            trialEndsAt: statusData.trialEndsAt ?? current.trialEndsAt,
            daysLeft,
            isLocked: isExp,
            inGrace: Boolean(statusData.inGrace),
          };
          this.saveState(updated);
        }
      })
      .catch(() => {
        // Offline fallback
      });
  }

  /**
   * Fetches real payment history and receipts from MainApi.
   */
  syncWithBackendPayments(): void {
    firstValueFrom(
      this.http.get<SaasPaymentsResponse>(`${this.apiBaseUrl}/beauty/saas-billing/payments`),
    )
      .then((res) => {
        const records = res?.data;
        if (Array.isArray(records)) {
          const mapped: SaasInvoiceRecord[] = records.map((p) => ({
            id: p.id || `inv-${Date.now()}`,
            receiptNo: p.receiptNo || 'ODV-REC',
            planId: (p.planId as SubscriptionPlanId) || 'pro',
            planName: this.plans.find((pl) => pl.id === p.planId)?.name ?? p.planId ?? 'Pro',
            billingCycle: p.billingCycle || 'monthly',
            amount: typeof p.amountKurus === 'number' ? p.amountKurus / 100 : (p.amount ?? 0),
            currency: p.currency || 'TRY',
            paidAt: p.paidAt || new Date().toISOString(),
            periodStartsAt: p.periodStartsAt || new Date().toISOString(),
            periodEndsAt: p.periodEndsAt || new Date().toISOString(),
            status: 'paid',
          }));

          if (mapped.length > 0 || this.invoicesSignal().length === 0) {
            this.saveInvoices(mapped);
          }
        }
      })
      .catch(() => {
        // Retain local invoices
      });
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
   * Subscribe and activate plan via backend API.
   */
  async subscribe(
    planId: SubscriptionPlanId,
    cycle: SubscriptionCycle,
    cardHolderName = 'Güzellik Merkezi Sahibi',
  ): Promise<{ success: boolean; receiptNo: string }> {
    const plan = this.plans.find((p) => p.id === planId) ?? this.plans[1] ?? SAAS_BEAUTY_PLANS[1];
    const now = new Date();
    const periodMonths = cycle === 'yearly' ? 12 : 1;
    const endsAt = new Date(now.getFullYear(), now.getMonth() + periodMonths, now.getDate());
    const amount = cycle === 'yearly' ? plan.yearlyPrice : plan.monthlyPrice;
    const randomHex = Math.random().toString(36).substring(2, 8).toUpperCase();
    const receiptNo = `ODV-SUB-${now.toISOString().slice(0, 10).replace(/-/g, '')}-${randomHex}`;

    firstValueFrom(
      this.http.post<{ success: boolean; data?: { receiptNo?: string } }>(
        `${this.apiBaseUrl}/beauty/saas-billing/subscribe`,
        {
          planId,
          billingCycle: cycle,
          cardHolderName,
        },
      ),
    )
      .then(() => {
        this.syncWithBackendStatus();
        this.syncWithBackendPayments();
      })
      .catch(() => {});

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

    this.saveInvoices([newInvoice, ...this.invoicesSignal()]);
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
      this.http.post(`${this.apiBaseUrl}/beauty/saas-billing/test/expire-trial`, {}),
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
      this.http.post(`${this.apiBaseUrl}/beauty/saas-billing/test/reset-trial`, {}),
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
