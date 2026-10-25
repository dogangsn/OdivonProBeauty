export type SupportTicketStatus = 'pending' | 'in_progress' | 'approved' | 'completed' | 'rejected';
export type SupportTicketPriority = 'low' | 'normal' | 'high' | 'urgent';

/** Talep kaydı; MainApi `support/tickets` uçlarının döndürdüğü şekil. */
export interface SupportTicket {
  id: string;
  trackingNumber: string;
  tenantId?: string | null;
  tenantName?: string | null;
  category: string;
  categoryLabel: string;
  subject: string;
  description: string;
  fullName: string;
  email: string;
  phone?: string | null;
  priority: SupportTicketPriority;
  status: SupportTicketStatus;
  adminNote?: string | null;
  approvedAt?: string | null;
  completedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSupportTicketInput {
  category: string;
  categoryLabel?: string;
  subject: string;
  description: string;
  fullName: string;
  email: string;
  phone?: string;
  priority?: SupportTicketPriority;
  tenantId?: string;
  tenantName?: string;
}

export const SUPPORT_CATEGORIES: readonly { value: string; label: string; icon: string }[] = [
  { value: 'technical_support', label: 'Teknik Destek', icon: 'build' },
  { value: 'billing_payment', label: 'Abonelik & Ödeme', icon: 'payments' },
  { value: 'account_access', label: 'Hesap & Giriş', icon: 'key' },
  { value: 'feature_request', label: 'Öneri & Yeni Özellik', icon: 'lightbulb' },
  { value: 'general_inquiry', label: 'Genel Soru', icon: 'help' },
  { value: 'complaint_suggestion', label: 'Şikayet & Bildirim', icon: 'report' },
];

export const SUPPORT_PRIORITIES: readonly { value: SupportTicketPriority; label: string }[] = [
  { value: 'low', label: 'Düşük' },
  { value: 'normal', label: 'Normal' },
  { value: 'high', label: 'Yüksek' },
  { value: 'urgent', label: 'Acil' },
];

export const SUPPORT_STATUS: Record<
  SupportTicketStatus,
  { label: string; icon: string; tone: string; hint: string }
> = {
  pending: {
    label: 'Beklemede',
    icon: 'schedule',
    tone: 'amber',
    hint: 'Talebiniz alındı, ekibimiz en kısa sürede inceleyecek.',
  },
  in_progress: {
    label: 'İşlemde',
    icon: 'autorenew',
    tone: 'sky',
    hint: 'Ekibimiz talebiniz üzerinde çalışıyor.',
  },
  approved: {
    label: 'Onaylandı',
    icon: 'thumb_up',
    tone: 'indigo',
    hint: 'Talebiniz onaylandı, uygulama aşamasında.',
  },
  completed: {
    label: 'Tamamlandı',
    icon: 'task_alt',
    tone: 'emerald',
    hint: 'Talebiniz sonuçlandı.',
  },
  rejected: {
    label: 'Reddedildi',
    icon: 'block',
    tone: 'rose',
    hint: 'Talebiniz karşılanamadı. Ayrıntı için yanıtı okuyun.',
  },
};
