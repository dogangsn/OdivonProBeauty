export type DefinitionCategoryKey =
  | 'payment-methods'
  | 'expense-categories'
  | 'customer-segments'
  | 'body-zones'
  | 'room-types'
  | 'staff-roles'
  | 'time-off-types'
  | 'product-units'
  | 'consent-types'
  | 'invoice-types';

export interface DefinitionItem {
  id: string;
  category: DefinitionCategoryKey;
  name: string;
  code: string;
  description?: string;
  color?: string;
  active: boolean;
  order: number;
  isSystem?: boolean;
}

export interface DefinitionCategoryMeta {
  key: DefinitionCategoryKey;
  label: string;
  icon: string;
  description: string;
  badgeTone: 'indigo' | 'emerald' | 'purple' | 'amber' | 'rose' | 'teal' | 'blue';
}

export const DEFINITION_CATEGORIES: readonly DefinitionCategoryMeta[] = [
  {
    key: 'payment-methods',
    label: 'Ödeme Yöntemleri',
    icon: 'payments',
    description: 'Nakit, kredi kartı, havale, pos ve alternatif tahsilat yöntemlerini yönetin.',
    badgeTone: 'emerald',
  },
  {
    key: 'expense-categories',
    label: 'Gider Kalemleri',
    icon: 'account_balance_wallet',
    description: 'Kira, personel, sarf malzeme, faturalar ve işletme gider türlerini tanımlayın.',
    badgeTone: 'rose',
  },
  {
    key: 'customer-segments',
    label: 'Müşteri Segmentleri',
    icon: 'loyalty',
    description: 'Standart, VIP, Gold, Takip ve kampanya hedefleme müşteri grupları.',
    badgeTone: 'purple',
  },
  {
    key: 'body-zones',
    label: 'Uygulama Bölgeleri',
    icon: 'accessibility_new',
    description: 'Lazer, cilt bakımı ve seanslarda seçilecek vücut ve uygulama bölgeleri.',
    badgeTone: 'indigo',
  },
  {
    key: 'room-types',
    label: 'Oda / Kabin Türleri',
    icon: 'meeting_room',
    description: 'Lazer kabini, cilt bakım odası, spa ve genel bakım kapasite türleri.',
    badgeTone: 'teal',
  },
  {
    key: 'staff-roles',
    label: 'Personel Rolleri',
    icon: 'badge',
    description: 'Yönetici, estetisyen, lazer uzmanı, resepsiyon ve ekip unvanları.',
    badgeTone: 'blue',
  },
  {
    key: 'product-units',
    label: 'Ürün & Sarf Birimleri',
    icon: 'inventory_2',
    description: 'Adet, mililitre (ml), gram (gr), kutu ve paket stok ölçü birimleri.',
    badgeTone: 'amber',
  },
  {
    key: 'time-off-types',
    label: 'İzin ve Tatil Türleri',
    icon: 'event_busy',
    description: 'Yıllık izin, raporlu, mazeret ve resmi tatil uygunluk türleri.',
    badgeTone: 'rose',
  },
  {
    key: 'consent-types',
    label: 'Onam & KVKK Şablonları',
    icon: 'verified_user',
    description: 'Açık rıza, lazer uygulama onamı, fotoğraf çekim ve pazarlama izinleri.',
    badgeTone: 'indigo',
  },
  {
    key: 'invoice-types',
    label: 'Belge & Fatura Türleri',
    icon: 'receipt_long',
    description: 'Perakende fişi, e-arşiv, e-fatura ve mali tahsilat belge türleri.',
    badgeTone: 'purple',
  },
] as const;

export const DEFAULT_DEFINITIONS: Record<DefinitionCategoryKey, Omit<DefinitionItem, 'id'>[]> = {
  'payment-methods': [
    { category: 'payment-methods', name: 'Nakit', code: 'cash', active: true, order: 1, color: '#10b981' },
    { category: 'payment-methods', name: 'Kredi / Banka Kartı', code: 'card', active: true, order: 2, color: '#6366f1' },
    { category: 'payment-methods', name: 'Banka Havalesi / EFT', code: 'transfer', active: true, order: 3, color: '#8b5cf6' },
    { category: 'payment-methods', name: 'Online / Mobil Ödeme', code: 'online', active: true, order: 4, color: '#06b6d4' },
    { category: 'payment-methods', name: 'Cüzdan Bakiyesi', code: 'wallet', active: true, order: 5, color: '#f59e0b' },
    { category: 'payment-methods', name: 'Sadakat / Hediye Puanı', code: 'loyalty', active: true, order: 6, color: '#ec4899' },
  ],
  'expense-categories': [
    { category: 'expense-categories', name: 'Kira ve Aidat', code: 'rent', active: true, order: 1, color: '#f43f5e' },
    { category: 'expense-categories', name: 'Personel Maaş & Avans', code: 'payroll', active: true, order: 2, color: '#8b5cf6' },
    { category: 'expense-categories', name: 'Ürün & Kozmetik Sarf Alımı', code: 'consumable', active: true, order: 3, color: '#06b6d4' },
    { category: 'expense-categories', name: 'Cihaz Bakım & Onarım', code: 'maintenance', active: true, order: 4, color: '#f59e0b' },
    { category: 'expense-categories', name: 'Elektrik, Su, Doğalgaz', code: 'utilities', active: true, order: 5, color: '#64748b' },
    { category: 'expense-categories', name: 'Pazarlama ve Reklam', code: 'marketing', active: true, order: 6, color: '#10b981' },
    { category: 'expense-categories', name: 'Vergi ve Muhasebe', code: 'tax', active: true, order: 7, color: '#6366f1' },
    { category: 'expense-categories', name: 'Genel İşletme Giderleri', code: 'other', active: true, order: 8, color: '#94a3b8' },
  ],
  'customer-segments': [
    { category: 'customer-segments', name: 'Standart Müşteri', code: 'standard', active: true, order: 1, color: '#64748b' },
    { category: 'customer-segments', name: 'VIP Müşteri', code: 'vip', active: true, order: 2, color: '#ec4899' },
    { category: 'customer-segments', name: 'Gold Üye', code: 'gold', active: true, order: 3, color: '#f59e0b' },
    { category: 'customer-segments', name: 'Yeni Kayıt', code: 'new', active: true, order: 4, color: '#10b981' },
    { category: 'customer-segments', name: 'Takip / Riskli', code: 'at-risk', active: true, order: 5, color: '#f43f5e' },
    { category: 'customer-segments', name: 'Pasif Müşteri', code: 'inactive', active: true, order: 6, color: '#94a3b8' },
  ],
  'body-zones': [
    { category: 'body-zones', name: 'Tüm Vücut', code: 'full-body', active: true, order: 1, color: '#6366f1' },
    { category: 'body-zones', name: 'Tüm Bacak', code: 'full-leg', active: true, order: 2, color: '#8b5cf6' },
    { category: 'body-zones', name: 'Yarım Bacak', code: 'half-leg', active: true, order: 3, color: '#a855f7' },
    { category: 'body-zones', name: 'Tüm Kol', code: 'full-arm', active: true, order: 4, color: '#06b6d4' },
    { category: 'body-zones', name: 'Yarım Kol', code: 'half-arm', active: true, order: 5, color: '#0ea5e9' },
    { category: 'body-zones', name: 'Koltuk Altı', code: 'underarm', active: true, order: 6, color: '#10b981' },
    { category: 'body-zones', name: 'Genital / Bikini', code: 'bikini', active: true, order: 7, color: '#ec4899' },
    { category: 'body-zones', name: 'Tüm Yüz', code: 'full-face', active: true, order: 8, color: '#f59e0b' },
    { category: 'body-zones', name: 'Çene ve Bıyık', code: 'chin-upperlip', active: true, order: 9, color: '#f97316' },
    { category: 'body-zones', name: 'Boyun ve Dekolte', code: 'neck', active: true, order: 10, color: '#14b8a6' },
    { category: 'body-zones', name: 'Sırt ve Bel', code: 'back', active: true, order: 11, color: '#64748b' },
    { category: 'body-zones', name: 'Göğüs ve Karın', code: 'chest', active: true, order: 12, color: '#3b82f6' },
  ],
  'room-types': [
    { category: 'room-types', name: 'Lazer Epilasyon Kabini', code: 'laser', active: true, order: 1, color: '#6366f1' },
    { category: 'room-types', name: 'Cilt Bakım Kabini', code: 'skin-care', active: true, order: 2, color: '#10b981' },
    { category: 'room-types', name: 'Masaj ve Spa Odası', code: 'massage', active: true, order: 3, color: '#8b5cf6' },
    { category: 'room-types', name: 'El, Ayak & Tırnak Bölümü', code: 'nail', active: true, order: 4, color: '#ec4899' },
    { category: 'room-types', name: 'Bölgesel İncelme Kabini', code: 'slimming', active: true, order: 5, color: '#f59e0b' },
    { category: 'room-types', name: 'Genel Konsültasyon Odası', code: 'general', active: true, order: 6, color: '#64748b' },
  ],
  'staff-roles': [
    { category: 'staff-roles', name: 'İşletme Yöneticisi', code: 'manager', active: true, order: 1, color: '#6366f1' },
    { category: 'staff-roles', name: 'Uzman Estetisyen', code: 'specialist', active: true, order: 2, color: '#10b981' },
    { category: 'staff-roles', name: 'Lazer Uzmanı', code: 'laser-tech', active: true, order: 3, color: '#8b5cf6' },
    { category: 'staff-roles', name: 'Diyetisyen / Beslenme', code: 'dietitian', active: true, order: 4, color: '#06b6d4' },
    { category: 'staff-roles', name: 'Resepsiyon & Danışma', code: 'receptionist', active: true, order: 5, color: '#f59e0b' },
    { category: 'staff-roles', name: 'Kasiyer & Muhasebe', code: 'cashier', active: true, order: 6, color: '#3b82f6' },
  ],
  'product-units': [
    { category: 'product-units', name: 'Adet', code: 'piece', active: true, order: 1, color: '#6366f1' },
    { category: 'product-units', name: 'Mililitre (ml)', code: 'ml', active: true, order: 2, color: '#06b6d4' },
    { category: 'product-units', name: 'Gram (gr)', code: 'gram', active: true, order: 3, color: '#10b981' },
    { category: 'product-units', name: 'Kutu', code: 'box', active: true, order: 4, color: '#f59e0b' },
    { category: 'product-units', name: 'Şişe / Flakon', code: 'bottle', active: true, order: 5, color: '#8b5cf6' },
    { category: 'product-units', name: 'Paket', code: 'package', active: true, order: 6, color: '#ec4899' },
    { category: 'product-units', name: 'Tüp', code: 'tube', active: true, order: 7, color: '#64748b' },
  ],
  'time-off-types': [
    { category: 'time-off-types', name: 'Yıllık Ücretli İzin', code: 'annual', active: true, order: 1, color: '#10b981' },
    { category: 'time-off-types', name: 'Raporlu / Hastalık İzni', code: 'sick', active: true, order: 2, color: '#f43f5e' },
    { category: 'time-off-types', name: 'Mazeret İzni', code: 'personal', active: true, order: 3, color: '#f59e0b' },
    { category: 'time-off-types', name: 'Ücretsiz İzin', code: 'unpaid', active: true, order: 4, color: '#64748b' },
    { category: 'time-off-types', name: 'Resmi / İdari Tatil', code: 'holiday', active: true, order: 5, color: '#8b5cf6' },
  ],
  'consent-types': [
    { category: 'consent-types', name: 'KVKK Açık Rıza Metni', code: 'kvkk-explicit-consent', active: true, order: 1, color: '#6366f1' },
    { category: 'consent-types', name: 'Lazer Epilasyon Uygulama Onamı', code: 'laser-consent', active: true, order: 2, color: '#8b5cf6' },
    { category: 'consent-types', name: 'Cilt Bakımı Uygulama Onamı', code: 'treatment-consent', active: true, order: 3, color: '#10b981' },
    { category: 'consent-types', name: 'Fotoğraf ve Görsel Kayıt İzni', code: 'photo-consent', active: true, order: 4, color: '#ec4899' },
    { category: 'consent-types', name: 'Ticari İleti & Pazarlama İzni', code: 'marketing-consent', active: true, order: 5, color: '#06b6d4' },
  ],
  'invoice-types': [
    { category: 'invoice-types', name: 'Perakende Satış Fişi', code: 'receipt', active: true, order: 1, color: '#64748b' },
    { category: 'invoice-types', name: 'E-Arşiv Fatura', code: 'e-archive', active: true, order: 2, color: '#6366f1' },
    { category: 'invoice-types', name: 'E-Fatura', code: 'e-invoice', active: true, order: 3, color: '#10b981' },
    { category: 'invoice-types', name: 'Serbest Meslek Makbuzu', code: 'smm', active: true, order: 4, color: '#8b5cf6' },
  ],
};
