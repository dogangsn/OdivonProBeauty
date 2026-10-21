import { CurrencyPipe, DatePipe, registerLocaleData } from '@angular/common';
import localeTr from '@angular/common/locales/tr';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  SubscriptionCycle,
  SubscriptionPlan,
  SubscriptionPlanId,
} from '../../core/subscription/subscription.model';
import { SubscriptionService } from '../../core/subscription/subscription.service';

registerLocaleData(localeTr);

@Component({
  imports: [CurrencyPipe, DatePipe, FormsModule],
  selector: 'app-subscription',
  styleUrl: './subscription.css',
  templateUrl: './subscription.html',
})
export class Subscription {
  protected readonly subService = inject(SubscriptionService);
  private readonly router = inject(Router);

  // Billing cycle selection: monthly vs yearly
  protected readonly selectedCycle = signal<SubscriptionCycle>('monthly');

  // Checkout modal state
  protected readonly checkoutModalOpen = signal(false);
  protected readonly selectedPlanForCheckout = signal<SubscriptionPlan | null>(null);
  protected readonly paymentProcessing = signal(false);
  protected readonly paymentSuccess = signal(false);
  protected readonly generatedReceiptNo = signal('');

  // 3D Secure modal state
  protected readonly threeDSecureModalOpen = signal(false);
  protected readonly otpCode = signal('');
  protected readonly otpCountdown = signal(120);

  // Card form state
  protected readonly cardNumber = signal('');
  protected readonly cardHolder = signal('Güzellik Merkezi Sahibi');
  protected readonly cardExpiry = signal('12/28');
  protected readonly cardCvv = signal('888');
  protected readonly companyTitle = signal('Odivon Beauty Güzellik Merkezi Ltd.');
  protected readonly taxNumber = signal('1234567890');
  protected readonly taxOffice = signal('Kadıköy V.D.');

  // Card brand detection
  protected readonly cardBrand = computed<'visa' | 'mastercard' | 'troy' | 'card'>(() => {
    const raw = this.cardNumber().replace(/\s+/g, '');
    if (raw.startsWith('4')) return 'visa';
    if (raw.startsWith('5')) return 'mastercard';
    if (raw.startsWith('9792')) return 'troy';
    return 'card';
  });

  // Calculate pricing breakdown for current checkout
  protected readonly checkoutSummary = computed(() => {
    const plan = this.selectedPlanForCheckout();
    const cycle = this.selectedCycle();
    if (!plan) return { subtotal: 0, tax: 0, total: 0, savings: 0 };

    const total = cycle === 'yearly' ? plan.yearlyPrice : plan.monthlyPrice;
    const subtotal = total / 1.2;
    const tax = total - subtotal;
    const savings = cycle === 'yearly' ? plan.monthlyPrice * 12 - plan.yearlyPrice : 0;

    return { subtotal, tax, total, savings };
  });

  protected setCycle(cycle: SubscriptionCycle): void {
    this.selectedCycle.set(cycle);
  }

  protected openCheckout(plan: SubscriptionPlan): void {
    this.selectedPlanForCheckout.set(plan);
    this.paymentSuccess.set(false);
    this.checkoutModalOpen.set(true);
  }

  protected closeCheckout(): void {
    if (this.paymentProcessing()) return;
    this.checkoutModalOpen.set(false);
    this.threeDSecureModalOpen.set(false);
  }

  protected formatCardNumber(event: Event): void {
    const input = event.target as HTMLInputElement;
    let val = input.value.replace(/\D/g, '').substring(0, 16);
    const parts = val.match(/[\s\S]{1,4}/g) || [];
    input.value = parts.join(' ');
    this.cardNumber.set(input.value);
  }

  protected formatExpiry(event: Event): void {
    const input = event.target as HTMLInputElement;
    let val = input.value.replace(/\D/g, '').substring(0, 4);
    if (val.length >= 3) {
      val = `${val.slice(0, 2)}/${val.slice(2)}`;
    }
    input.value = val;
    this.cardExpiry.set(input.value);
  }

  protected proceedTo3DSecure(): void {
    this.paymentProcessing.set(true);
    // Simulate brief card verification
    setTimeout(() => {
      this.paymentProcessing.set(false);
      this.threeDSecureModalOpen.set(true);
      this.startOtpTimer();
    }, 700);
  }

  protected fillDemoOtp(): void {
    this.otpCode.set('549182');
  }

  private startOtpTimer(): void {
    this.otpCountdown.set(120);
    const interval = setInterval(() => {
      if (this.otpCountdown() <= 1 || !this.threeDSecureModalOpen()) {
        clearInterval(interval);
      } else {
        this.otpCountdown.update((v) => v - 1);
      }
    }, 1000);
  }

  protected async confirmOtpAndSubscribe(): Promise<void> {
    const plan = this.selectedPlanForCheckout();
    if (!plan) return;

    this.paymentProcessing.set(true);

    try {
      const res = await this.subService.subscribe(
        plan.id,
        this.selectedCycle(),
        this.cardHolder()
      );

      this.generatedReceiptNo.set(res.receiptNo);
      this.threeDSecureModalOpen.set(false);
      this.paymentSuccess.set(true);
    } catch {
      // Handled
    } finally {
      this.paymentProcessing.set(false);
    }
  }

  protected async finishAndGoToDashboard(): Promise<void> {
    this.checkoutModalOpen.set(false);
    await this.router.navigateByUrl('/dashboard');
  }

  // Simulator tools
  protected async triggerSimulateExpire(): Promise<void> {
    await this.subService.expireTrialSimulate();
  }

  protected async triggerSimulateReset(): Promise<void> {
    await this.subService.resetTrialSimulate();
  }

  protected async triggerQuickActivatePro(): Promise<void> {
    await this.subService.subscribe('pro', 'yearly', 'Demo Güzellik Merkezi');
  }
}
