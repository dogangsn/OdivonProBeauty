import { Component, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';
import {
  PaymentLink,
  PaymentLinkStats,
  PaymentLinkStatus,
  PaymentLinkType,
  buildWhatsAppShareUrl,
  generatePaymentLinkShortUrl,
} from '../../core/payment-link/payment-link.model';
import {
  INITIAL_PAYMENT_LINKS,
  INITIAL_PAYMENT_STATS,
} from '../../core/payment-link/payment-link-demo-data';

@Component({
  selector: 'app-payment-links',
  imports: [CommonModule, FormsModule],
  templateUrl: './payment-links.html',
  styleUrl: './payment-links.css',
})
export class PaymentLinks {
  // Core Data
  readonly paymentLinks = signal<PaymentLink[]>(INITIAL_PAYMENT_LINKS);
  readonly stats = signal<PaymentLinkStats>(INITIAL_PAYMENT_STATS);

  // Filters
  readonly statusFilter = signal<string>('all');
  readonly typeFilter = signal<string>('all');
  readonly searchQuery = signal<string>('');

  // Modals
  readonly isCreateModalOpen = signal<boolean>(false);
  readonly isQrModalOpen = signal<boolean>(false);
  readonly selectedLinkForQr = signal<PaymentLink | null>(null);

  // Create Form State
  readonly newCustomerName = signal<string>('');
  readonly newCustomerPhone = signal<string>('');
  readonly newCustomerEmail = signal<string>('');
  readonly newPaymentType = signal<PaymentLinkType>('deposit');
  readonly newAmount = signal<number>(500);
  readonly newTitle = signal<string>('Randevu Ön Ödemesi / Kaporası');
  readonly newDescription = signal<string>('Randevu saatinizin rezerve edilmesi için teyit kaporası.');
  readonly newExpiresInHours = signal<number>(24);
  readonly newBranchName = signal<string>('Nişantaşı Ana Şube');

  // Computed
  readonly filteredLinks = computed(() => {
    const list = this.paymentLinks();
    const status = this.statusFilter();
    const type = this.typeFilter();
    const query = this.searchQuery().toLowerCase().trim();

    return list.filter((link) => {
      const matchStatus = status === 'all' || link.status === status;
      const matchType = type === 'all' || link.paymentType === type;
      const matchQuery =
        !query ||
        link.customerName.toLowerCase().includes(query) ||
        link.linkCode.toLowerCase().includes(query) ||
        link.customerPhone.includes(query) ||
        link.title.toLowerCase().includes(query);

      return matchStatus && matchType && matchQuery;
    });
  });

  readonly pendingLinksCount = computed(() => {
    return this.paymentLinks().filter(
      (l) => l.status === 'pending' || l.status === 'viewed'
    ).length;
  });

  constructor(private readonly router: Router) {}

  // Open & Close Modal
  openCreateModal(prefill?: Partial<PaymentLink>): void {
    if (prefill) {
      this.newCustomerName.set(prefill.customerName || '');
      this.newCustomerPhone.set(prefill.customerPhone || '');
      this.newCustomerEmail.set(prefill.customerEmail || '');
      this.newAmount.set(prefill.amount || 500);
      this.newPaymentType.set(prefill.paymentType || 'deposit');
      this.newTitle.set(prefill.title || 'Randevu Ön Ödemesi / Kaporası');
    } else {
      this.newCustomerName.set('');
      this.newCustomerPhone.set('+90 5');
      this.newCustomerEmail.set('');
      this.newAmount.set(500);
      this.newPaymentType.set('deposit');
      this.newTitle.set('Randevu Ön Ödemesi / Kaporası');
    }
    this.isCreateModalOpen.set(true);
  }

  closeCreateModal(): void {
    this.isCreateModalOpen.set(false);
  }

  onPaymentTypeChange(type: PaymentLinkType): void {
    this.newPaymentType.set(type);
    switch (type) {
      case 'deposit':
        this.newTitle.set('Randevu Ön Ödemesi / Kaporası');
        this.newAmount.set(500);
        this.newDescription.set('Randevunuzu garanti altına almak için kapora ödemesi.');
        break;
      case 'package_installment':
        this.newTitle.set('Paket Seans Taksit Ödemesi');
        this.newAmount.set(2500);
        this.newDescription.set('Aylık paket anlaşması taksit ödemesi.');
        break;
      case 'service_checkout':
        this.newTitle.set('Uygulama Sonrası Hızlı Tahsilat');
        this.newAmount.set(1250);
        this.newDescription.set('Klinikte tamamlanan seansın temassız ödemesi.');
        break;
      case 'wallet_topup':
        this.newTitle.set('VIP Cüzdan Yükleme (+Bonus Bakiye)');
        this.newAmount.set(5000);
        this.newDescription.set('Güzellik merkezinde geçerli avantajlı cüzdan bakiyesi.');
        break;
      default:
        this.newTitle.set('Online Güvenli Ödeme');
        this.newAmount.set(1000);
        break;
    }
  }

  savePaymentLink(): void {
    if (!this.newCustomerName().trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Müşteri Adı Gerekli',
        text: 'Lütfen ödeme linkinin ait olduğu müşterinin adını giriniz.',
      });
      return;
    }

    if (!this.newAmount() || this.newAmount() <= 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Geçersiz Tutar',
        text: 'Ödeme tutarı 0 TL den büyük olmalıdır.',
      });
      return;
    }

    const nextCode = `LNK-${Math.floor(8930 + Math.random() * 900)}`;
    const expiresDate = new Date();
    expiresDate.setHours(expiresDate.getHours() + (this.newExpiresInHours() || 24));

    const newLink: PaymentLink = {
      id: `pl-${Date.now()}`,
      linkCode: nextCode,
      customerId: `cus-${Date.now()}`,
      customerName: this.newCustomerName().trim(),
      customerPhone: this.newCustomerPhone().trim(),
      customerEmail: this.newCustomerEmail().trim(),
      amount: Number(this.newAmount()),
      paymentType: this.newPaymentType(),
      title: this.newTitle().trim(),
      description: this.newDescription().trim(),
      expiresAt: expiresDate.toISOString(),
      status: 'pending',
      branchId: 'br-nişantaşı',
      branchName: this.newBranchName(),
      shortUrl: generatePaymentLinkShortUrl(nextCode),
    };

    this.paymentLinks.update((prev) => [newLink, ...prev]);
    this.stats.update((st) => ({
      ...st,
      totalGeneratedCount: st.totalGeneratedCount + 1,
      pendingAmount: st.pendingAmount + newLink.amount,
    }));

    this.closeCreateModal();

    Swal.fire({
      icon: 'success',
      title: 'Ödeme Linki Oluşturuldu!',
      html: `<strong>${nextCode}</strong> kodlu ödeme bağlantısı hazırlandı.<br>WhatsApp, SMS veya QR kod ile müşteriye anında iletebilirsiniz.`,
      timer: 3000,
      showConfirmButton: false,
    });
  }

  // Sharing Actions
  sendViaWhatsApp(link: PaymentLink): void {
    const url = buildWhatsAppShareUrl(
      link.customerPhone,
      link.customerName,
      link.title,
      link.amount,
      link.shortUrl
    );
    window.open(url, '_blank');
  }

  sendViaSms(link: PaymentLink): void {
    Swal.fire({
      icon: 'success',
      title: 'SMS İletildi!',
      text: `${link.customerPhone} numaralı telefona "${link.title}" için ödeme bağlantısı SMS olarak gönderildi.`,
      timer: 2500,
      showConfirmButton: false,
    });
  }

  copyLink(link: PaymentLink): void {
    const fullUrl = `${window.location.origin}${link.shortUrl}`;
    navigator.clipboard.writeText(fullUrl).then(() => {
      Swal.fire({
        icon: 'success',
        title: 'Bağlantı Kopyalandı!',
        text: fullUrl,
        timer: 2000,
        showConfirmButton: false,
      });
    });
  }

  openCustomerCheckoutView(link: PaymentLink): void {
    this.router.navigate(['/pay', link.linkCode]);
  }

  openQrModal(link: PaymentLink): void {
    this.selectedLinkForQr.set(link);
    this.isQrModalOpen.set(true);
  }

  closeQrModal(): void {
    this.isQrModalOpen.set(false);
    this.selectedLinkForQr.set(null);
  }

  sendReminder(link: PaymentLink): void {
    Swal.fire({
      icon: 'success',
      title: 'Hatırlatıcı Gönderildi',
      text: `${link.customerName} müşterisine WhatsApp ve SMS üzerinden nazik ödeme hatırlatıcısı iletildi.`,
      timer: 2500,
      showConfirmButton: false,
    });
  }

  cancelLink(link: PaymentLink): void {
    this.paymentLinks.update((list) =>
      list.map((l) => (l.id === link.id ? { ...l, status: 'cancelled' } : l))
    );
    Swal.fire({
      icon: 'info',
      title: 'Bağlantı İptal Edildi',
      text: `${link.linkCode} ödeme bağlantısı pasife alındı.`,
      timer: 2000,
      showConfirmButton: false,
    });
  }
}
