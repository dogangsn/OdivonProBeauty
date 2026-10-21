export type SubscriptionPlanId = 'starter' | 'pro' | 'enterprise';

export type SubscriptionCycle = 'monthly' | 'yearly';

export type TenantMembershipStatus = 'trial' | 'active' | 'past_due' | 'expired' | 'cancelled';

export interface SubscriptionFeature {
  text: string;
  included: boolean;
  highlight?: boolean;
}

export interface SubscriptionPlan {
  id: SubscriptionPlanId;
  name: string;
  subtitle: string;
  tagline: string;
  badge?: string;
  monthlyPrice: number;
  yearlyPrice: number; // yearly price per year
  yearlyMonthlyEquivalent: number; // yearly / 12
  popular?: boolean;
  colorScheme: 'slate' | 'indigo' | 'amber';
  limits: {
    maxBranches: number | 'unlimited';
    maxStaff: number | 'unlimited';
    smsCredits: number;
  };
  features: SubscriptionFeature[];
}

export interface TenantSubscriptionState {
  membershipStatus: TenantMembershipStatus;
  trialEndsAt: string | null;
  subscriptionEndsAt: string | null;
  daysLeft: number;
  isLocked: boolean;
  planId: SubscriptionPlanId;
  billingCycle: SubscriptionCycle;
  inGrace?: boolean;
  lastPayment?: {
    receiptNo: string;
    paidAt: string;
    amount: number;
    planName: string;
    cycle: SubscriptionCycle;
  } | null;
}

export interface SaasInvoiceRecord {
  id: string;
  receiptNo: string;
  planId: SubscriptionPlanId;
  planName: string;
  billingCycle: SubscriptionCycle;
  amount: number;
  currency: 'TRY';
  paidAt: string;
  periodStartsAt: string;
  periodEndsAt: string;
  status: 'paid' | 'refunded';
}

export const SAAS_BEAUTY_PLANS: readonly SubscriptionPlan[] = [
  {
    id: 'starter',
    name: 'Butik Salon',
    subtitle: 'Tek Şubeli Butik İşletmeler',
    tagline: 'Yeni açılan veya butik hizmet veren güzellik ve bakım salonları için ideal.',
    monthlyPrice: 1490,
    yearlyPrice: 14900,
    yearlyMonthlyEquivalent: 1241,
    colorScheme: 'slate',
    limits: {
      maxBranches: 1,
      maxStaff: 3,
      smsCredits: 500,
    },
    features: [
      { text: '1 Şube Yönetimi', included: true },
      { text: '3 Uzman & Estetisyen Tanımı', included: true },
      { text: 'Sınırsız Randevu & Müşteri CRM Kartları', included: true },
      { text: 'Kasa, Temel Gelir/Gider & Ön Görüşme', included: true },
      { text: '500 Otomatik SMS Bildirimi / Ay', included: true },
      { text: 'Temel Günlük & Aylık Raporlar', included: true },
      { text: 'PayByLink & Online Kapora Tahsilatı', included: false },
      { text: 'AI Seans Öneri & Randevu Motoru', included: false },
      { text: 'Satın Alma & Sipariş Onay Mekanizması', included: false },
      { text: 'Çoklu Şube & Konsolide Finans', included: false },
    ],
  },
  {
    id: 'pro',
    name: 'Güzellik Merkezi',
    subtitle: 'Büyüyen Klinik & Merkezler',
    tagline: 'Gelişmiş finans, online kapora, satın alma ve AI tavsiyeleriyle tam kapsamlı yönetim.',
    badge: 'En Popüler',
    popular: true,
    monthlyPrice: 2990,
    yearlyPrice: 29900,
    yearlyMonthlyEquivalent: 2491,
    colorScheme: 'indigo',
    limits: {
      maxBranches: 3,
      maxStaff: 10,
      smsCredits: 2500,
    },
    features: [
      { text: '3 Şube Yönetimi & Kolay Şube Geçişi', included: true, highlight: true },
      { text: '10 Uzman & Estetisyen Tanımı', included: true },
      { text: 'Sınırsız Randevu, Müşteri & Seans Takibi', included: true },
      { text: 'Ön Görüşme, Sağlık & Dijital Onam Formları', included: true },
      { text: 'PayByLink & Online Tahsilat (No-Show Koruması)', included: true, highlight: true },
      { text: 'Satın Alma, Talep & Sipariş Onay İş Akışları', included: true, highlight: true },
      { text: 'Nail Studio & Özel Sanat Kataloğu', included: true },
      { text: 'AI Akıllı Seans & Randevu Öneri Motoru', included: true, highlight: true },
      { text: '2.500 Otomatik SMS Bildirimi / Ay', included: true },
      { text: '6 Dilde Çoklu Dil ve Para Birimi Desteği', included: true },
      { text: 'Öncelikli E-Posta & Mesai Saatleri Desteği', included: true },
      { text: 'Özel Muhasebe / ERP API Entegrasyonu', included: false },
    ],
  },
  {
    id: 'enterprise',
    name: 'Zincir & Poliklinik',
    subtitle: 'Büyük Zincirler & Tıp Merkezleri',
    tagline: 'Sınırsız şube ve personel kapasitesi, özel entegrasyonlar ve 7/24 VIP destek.',
    badge: 'Kurumsal',
    monthlyPrice: 5990,
    yearlyPrice: 59900,
    yearlyMonthlyEquivalent: 4991,
    colorScheme: 'amber',
    limits: {
      maxBranches: 'unlimited',
      maxStaff: 'unlimited',
      smsCredits: 10000,
    },
    features: [
      { text: 'Sınırsız Şube & Çoklu Lokasyon Konsolidasyonu', included: true, highlight: true },
      { text: 'Sınırsız Uzman, Personel & Vardiya Planlama', included: true },
      { text: 'Tüm Pro Özellikleri & Limitsiz Kullanım', included: true },
      { text: 'Şubeler Arası Stok Transferi & Konsolide Satın Alma', included: true },
      { text: 'Gelişmiş Hakediş & Prim Hesaplama Motoru', included: true },
      { text: 'Özel Muhasebe / ERP Entegrasyon API & Webhook', included: true, highlight: true },
      { text: '10.000 Otomatik SMS Bildirimi / Ay', included: true },
      { text: 'Özel Müşteri Temsilcisi & 7/24 VIP WhatsApp Hattı', included: true, highlight: true },
      { text: 'Özel Veri Yedekleme & %99.9 SLA Güvencesi', included: true },
    ],
  },
];
