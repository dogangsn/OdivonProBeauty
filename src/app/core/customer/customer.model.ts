import { BeautyRecord } from '../beauty.model';

export interface WalletTransaction {
  id: string;
  date: string;
  type: 'deposit' | 'spend' | 'refund';
  amount: number;
  description: string;
  paymentMethod: string;
}

export interface InstallmentScheduleItem {
  installmentNo: number;
  dueDate: string;
  amount: number;
  status: 'paid' | 'pending' | 'overdue';
  paidAt?: string;
  paymentMethod?: string;
}

export interface InstallmentPlan {
  id: string;
  title: string;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  installmentCount: number;
  createdAt: string;
  schedule: InstallmentScheduleItem[];
}

export interface CustomerSessionItem {
  sessionNo: number;
  date?: string;
  zone: string;
  staffName?: string;
  status: 'completed' | 'scheduled' | 'pending';
  notes?: string;
}

export interface CustomerPackage {
  id: string;
  packageName: string;
  totalSessions: number;
  completedSessions: number;
  remainingSessions: number;
  startDate: string;
  status: 'active' | 'completed' | 'frozen';
  sessions: CustomerSessionItem[];
}

export interface CustomerHealth {
  skinType?: 'kuru' | 'yagli' | 'karma' | 'normal' | 'hassas' | 'akneye-meyilli';
  fitzpatrick?: 'tip-1' | 'tip-2' | 'tip-3' | 'tip-4' | 'tip-5' | 'tip-6';
  allergies?: string;
  chronicDiseases?: string;
  medications?: string;
  isPregnant?: boolean;
  isNursing?: boolean;
  hasImplant?: boolean;
  bloodType?: string;
  healthNotes?: string;
  lastUpdated?: string;
}

export interface CustomerConsultation {
  id: string;
  customerId?: string;
  customerName: string;
  phone: string;
  email?: string;
  serviceCategory: string;
  inquiredSession: string;
  targetSessionsCount?: number;
  quotedPrice?: number;
  consultantStaffName?: string;
  consultationDate: string;
  nextFollowUpDate?: string;
  interestLevel: 'high' | 'medium' | 'low';
  channel: string;
  status: 'inquiry' | 'scheduled' | 'converted' | 'cancelled';
  notes?: string;
}

export interface CustomerNailProfile {
  preferredShape?: string;
  preferredLength?: string;
  lastColorCode?: string;
  lastColorName?: string;
  lastTechnique?: string;
  activeWarrantyUntil?: string;
  hasHemaAllergy?: boolean;
  notes?: string;
}

export interface CustomerProfile extends BeautyRecord {
  fullName: string;
  identityNumber?: string;
  birthDate?: string;
  age?: number;
  gender?: 'female' | 'male' | 'other' | 'unspecified';
  occupation?: string;

  phone: string;
  emergencyPhone?: string;
  email?: string;
  city?: string;
  district?: string;
  address?: string;

  segment?: string;
  referralSource?: string;
  preferredStaffId?: string;
  preferredStaffName?: string;

  health?: CustomerHealth;
  nailProfile?: CustomerNailProfile;

  walletBalance?: number;
  walletTransactions?: WalletTransaction[];

  installments?: InstallmentPlan[];
  packages?: CustomerPackage[];
  consultations?: CustomerConsultation[];

  notes?: string;
  status: string;
}

export function calculateAge(birthDate?: string | null): number | null {
  if (!birthDate) return null;
  const birth = new Date(birthDate);
  if (isNaN(birth.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age >= 0 ? age : null;
}

export function isValidTckn(tckn?: string | null): boolean {
  if (!tckn) return false;
  const clean = tckn.trim();
  if (!/^[1-9]\d{10}$/.test(clean)) return false;
  const digits = clean.split('').map(Number);
  const oddSum = digits[0] + digits[2] + digits[4] + digits[6] + digits[8];
  const evenSum = digits[1] + digits[3] + digits[5] + digits[7];
  const tenth = (oddSum * 7 - evenSum) % 10;
  if (tenth < 0 ? tenth + 10 !== digits[9] : tenth !== digits[9]) return false;
  const totalFirst10 = digits.slice(0, 10).reduce((acc, d) => acc + d, 0);
  return totalFirst10 % 10 === digits[10];
}
