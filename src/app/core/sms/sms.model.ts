export type SmsProviderId =
  | 'netgsm'
  | 'iletimerkezi'
  | 'mutlucell'
  | 'vatansms'
  | 'twilio'
  | 'odivon_cloud';

export type SmsLogStatus = 'delivered' | 'pending' | 'failed';

export interface SmsProvider {
  id: SmsProviderId;
  firestoreDocId?: string;
  providerId?: string;
  name: string;
  tagline: string;
  badge?: string;
  originator: string; // Sender ID / Header
  isActive: boolean;
  isDefault: boolean;
  balance: number; // Remaining SMS credits
  lastTestedAt?: string;
  lastTestStatus?: 'success' | 'failed' | 'untested';
  credentials: {
    username?: string;
    password?: string;
    apiKey?: string;
    apiSecret?: string;
    accountSid?: string;
    authToken?: string;
  };
}

export type SmsTemplateCategory = 'appointment' | 'payment' | 'care' | 'marketing';

export interface SmsTemplate {
  id: string;
  firestoreDocId?: string;
  key: string;
  title: string;
  description: string;
  category: SmsTemplateCategory;
  content: string;
  isAutoSend: boolean;
  triggerEvent: string;
  timingHours?: number;
  defaultSenderTitle?: string;
}

export interface SmsLog {
  id: string;
  firestoreDocId?: string;
  recipientPhone: string;
  recipientName: string;
  messageContent: string;
  providerId?: string;
  providerName: string;
  senderTitle: string;
  sentAt: string;
  status: SmsLogStatus;
  smsCount: number;
  templateTitle?: string;
  templateKey?: string;
  branchId?: string;
  customerId?: string;
  appointmentId?: string;
}

export interface SmsStats {
  totalSentThisMonth: number;
  deliveredRate: number;
  totalCreditsRemaining: number;
  activeProvidersCount: number;
}
