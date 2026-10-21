import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule, registerLocaleData } from '@angular/common';
import localeTr from '@angular/common/locales/tr';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import Swal from 'sweetalert2';
import {
  InstallmentOption,
  PaymentLink,
} from '../../../core/payment-link/payment-link.model';
import {
  INITIAL_PAYMENT_LINKS,
  getInstallmentOptions,
} from '../../../core/payment-link/payment-link-demo-data';

registerLocaleData(localeTr);

@Component({
  selector: 'app-public-checkout',
  imports: [CommonModule, FormsModule],
  templateUrl: './public-checkout.html',
  styleUrl: './public-checkout.css',
})
export class PublicCheckout {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  // Link Data
  readonly paymentLink = signal<PaymentLink>(INITIAL_PAYMENT_LINKS[0]);
  readonly notFound = signal<boolean>(false);

  // Form State
  readonly paymentMethod = signal<'card' | 'apple_pay' | 'fast'>('card');
  readonly selectedInstallment = signal<number>(1);
  readonly cardHolderName = signal<string>('MERVE AYDIN');
  readonly cardNumber = signal<string>('5428 1900 4421 9901');
  readonly cardExpiry = signal<string>('12/28');
  readonly cardCvc = signal<string>('442');
  readonly cardSaveAgreement = signal<boolean>(true);

  // 3D Secure OTP Simulation Modal
  readonly isOtpModalOpen = signal<boolean>(false);
  readonly otpInput = signal<string>('582914');
  readonly isProcessing = signal<boolean>(false);
  readonly isPaidSuccess = signal<boolean>(false);
  readonly transactionReceiptId = signal<string>('ODV-TR-99841284');

  // Computed
  readonly installmentOptions = computed<InstallmentOption[]>(() => {
    return getInstallmentOptions(this.paymentLink().amount);
  });

  readonly currentTotalAmount = computed<number>(() => {
    const selected = this.installmentOptions().find(
      (opt) => opt.count === this.selectedInstallment()
    );
    return selected ? selected.totalAmount : this.paymentLink().amount;
  });

  readonly detectedCardBrand = computed<string>(() => {
    const num = this.cardNumber().replace(/\s/g, '');
    if (num.startsWith('4')) return 'Visa';
    if (num.startsWith('5')) return 'Mastercard';
    if (num.startsWith('9')) return 'Troy';
    return 'Banka Kartı';
  });

  constructor() {
    const code = this.route.snapshot.paramMap.get('linkId') || 'LNK-8921';
    const found = INITIAL_PAYMENT_LINKS.find(
      (l) => l.linkCode.toLowerCase() === code.toLowerCase() || l.id === code
    );

    if (found) {
      this.paymentLink.set(found);
      this.cardHolderName.set(found.customerName.toUpperCase());
      if (found.status === 'paid') {
        this.isPaidSuccess.set(true);
      }
    } else {
      // Use fallback default demo link
      this.paymentLink.set({
        ...INITIAL_PAYMENT_LINKS[0],
        linkCode: code,
      });
    }
  }

  selectPaymentMethod(method: 'card' | 'apple_pay' | 'fast'): void {
    this.paymentMethod.set(method);
  }

  selectInstallment(count: number): void {
    this.selectedInstallment.set(count);
  }

  triggerSubmitPayment(): void {
    if (this.paymentMethod() === 'apple_pay') {
      this.simulateApplePay();
      return;
    }

    if (this.paymentMethod() === 'fast') {
      Swal.fire({
        icon: 'info',
        title: 'FAST / Havale Referansı',
        html: `Lütfen ödemeyi yaparken açıklama kısmına <strong>${this.paymentLink().linkCode}</strong> kodunu ekleyiniz. Dekontunuz otomatik onaylanacaktır.`,
      });
      return;
    }

    // Standard Credit Card: open 3D Secure OTP verification simulation
    this.isOtpModalOpen.set(true);
  }

  simulateApplePay(): void {
    this.isProcessing.set(true);
    setTimeout(() => {
      this.isProcessing.set(false);
      this.finishPaymentSuccess('Apple Pay / FaceID');
    }, 1200);
  }

  confirmOtp(): void {
    if (!this.otpInput().trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'SMS Kodu Boş',
        text: 'Lütfen telefonunuza gönderilen 6 haneli 3D Secure onay kodunu giriniz.',
      });
      return;
    }

    this.isProcessing.set(true);
    setTimeout(() => {
      this.isProcessing.set(false);
      this.isOtpModalOpen.set(false);
      this.finishPaymentSuccess('3D Secure Kredi Kartı');
    }, 1000);
  }

  private finishPaymentSuccess(methodName: string): void {
    const txId = `TX-${Math.floor(10000000 + Math.random() * 90000000)}`;
    this.transactionReceiptId.set(txId);
    this.isPaidSuccess.set(true);

    this.paymentLink.update((pl) => ({
      ...pl,
      status: 'paid',
      paidAt: new Date().toISOString(),
      paymentMethod: methodName,
      transactionId: txId,
      installmentCount: this.selectedInstallment(),
    }));

    Swal.fire({
      icon: 'success',
      title: 'Ödeme Başarıyla Alındı!',
      text: `${this.currentTotalAmount().toLocaleString('tr-TR')} ₺ tutarındaki ödemeniz 3D Secure ile güvenle tamamlandı.`,
      timer: 3500,
      showConfirmButton: false,
    });
  }

  printReceipt(): void {
    window.print();
  }
}
