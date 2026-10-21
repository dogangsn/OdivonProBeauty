export type PaymentLinkType =
  | 'deposit'
  | 'package_installment'
  | 'service_checkout'
  | 'wallet_topup'
  | 'custom';

export type PaymentLinkStatus = 'pending' | 'viewed' | 'paid' | 'expired' | 'cancelled';

export interface PaymentLink {
  id: string;
  linkCode: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  amount: number;
  paymentType: PaymentLinkType;
  title: string;
  description?: string;
  appointmentId?: string;
  appointmentServiceName?: string;
  appointmentDate?: string;
  packageId?: string;
  packageName?: string;
  installmentNumber?: number;
  expiresAt: string;
  status: PaymentLinkStatus;
  viewedAt?: string;
  paidAt?: string;
  paymentMethod?: string;
  transactionId?: string;
  installmentCount?: number;
  cardLast4?: string;
  cardBrand?: string;
  branchId: string;
  branchName: string;
  shortUrl: string;
}

export interface PaymentLinkStats {
  totalGeneratedCount: number;
  totalPaidAmount: number;
  pendingAmount: number;
  conversionRatePercent: number;
  noShowPreventionPercent: number;
  averageCheckoutSeconds: number;
}

export interface InstallmentOption {
  count: number;
  monthlyAmount: number;
  totalAmount: number;
  bankName: string;
}

export function generatePaymentLinkShortUrl(code: string): string {
  return `/pay/${code}`;
}

export function buildWhatsAppShareUrl(customerPhone: string, customerName: string, title: string, amount: number, shortUrl: string): string {
  const cleanPhone = customerPhone.replace(/\D/g, '');
  const message = encodeURIComponent(
    `Sayın ${customerName},\nOdivonPro Güzellik Merkezi bünyesindeki "${title}" işleminiz için ${amount.toLocaleString('tr-TR')} ₺ tutarındaki güvenli ödeme bağlantınız:\n\n${window.location.origin}${shortUrl}\n\nİyi günler dileriz.`
  );
  return `https://wa.me/${cleanPhone}?text=${message}`;
}
