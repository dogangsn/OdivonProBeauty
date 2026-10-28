import {
  Component,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { CdkDrag, CdkDragHandle } from '@angular/cdk/drag-drop';
import { firstValueFrom } from 'rxjs';
import { ApiClient } from '../../../core/api-client';
import { BranchService } from '../../../core/branch.service';
import { EntityLookupService } from '../../../core/entity-lookup.service';
import { BeautyRecord } from '../../../core/beauty.model';
import {
  CustomerConsultation,
  CustomerProfile,
  calculateAge,
  isValidTckn,
} from '../../../core/customer/customer.model';

export type FormTab = 'identity' | 'contact' | 'health' | 'finance_crm' | 'consultation';

export interface FormStepMeta {
  id: FormTab;
  number: number;
  title: string;
  subtitle: string;
  icon: string;
}

@Component({
  imports: [CdkDrag, CdkDragHandle],
  selector: 'app-customer-form-modal',
  templateUrl: './customer-form-modal.html',
  styleUrl: './customer-form-modal.css',
})
export class CustomerFormModal {
  private readonly api = inject(ApiClient);
  private readonly branchService = inject(BranchService);
  private readonly entityLookup = inject(EntityLookupService);

  readonly open = input<boolean>(true);
  readonly initialData = input<Partial<CustomerProfile> | null>(null);
  readonly close = output<void>();
  readonly saved = output<CustomerProfile>();

  protected readonly isMaximized = signal<boolean>(false);
  protected readonly activeTab = signal<FormTab>('identity');
  protected readonly saving = signal<boolean>(false);
  protected readonly error = signal<string>('');

  // 5 Step definitions for visual Stepper
  readonly steps: FormStepMeta[] = [
    { id: 'identity', number: 1, title: 'Kimlik & Profil', subtitle: 'Ad, TCKN, Doğum', icon: 'badge' },
    { id: 'contact', number: 2, title: 'İletişim & Adres', subtitle: 'Telefon, Konum', icon: 'call' },
    { id: 'health', number: 3, title: 'Sağlık & Cilt', subtitle: 'Cilt Tipi, Alerji', icon: 'medical_services' },
    { id: 'finance_crm', number: 4, title: 'CRM & Cüzdan', subtitle: 'Segment, Bakiye', icon: 'account_balance_wallet' },
    { id: 'consultation', number: 5, title: 'Ön Görüşme', subtitle: 'Aday Talebi & Seans', icon: 'support_agent' },
  ];

  private getTodayString(): string {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  // Form Fields State
  protected readonly fullName = signal<string>('');
  protected readonly identityNumber = signal<string>('');
  protected readonly birthDate = signal<string>(this.getTodayString());
  protected readonly gender = signal<string>('female');
  protected readonly occupation = signal<string>('');

  protected readonly phone = signal<string>('');
  protected readonly emergencyPhone = signal<string>('');
  protected readonly email = signal<string>('');
  protected readonly city = signal<string>('');
  protected readonly district = signal<string>('');
  protected readonly address = signal<string>('');

  protected readonly skinType = signal<string>('karma');
  protected readonly fitzpatrick = signal<string>('tip-3');
  protected readonly allergies = signal<string>('');
  protected readonly chronicDiseases = signal<string>('');
  protected readonly medications = signal<string>('');
  protected readonly isPregnant = signal<boolean>(false);
  protected readonly isNursing = signal<boolean>(false);
  protected readonly hasImplant = signal<boolean>(false);
  protected readonly bloodType = signal<string>('');
  protected readonly healthNotes = signal<string>('');

  protected readonly segment = signal<string>('standart');
  protected readonly referralSource = signal<string>('Instagram');
  protected readonly preferredStaffName = signal<string>('');
  protected readonly initialWalletBalance = signal<number>(0);
  protected readonly status = signal<string>('active');
  protected readonly notes = signal<string>('');

  // Preliminary Consultation (Ön Görüşme / Aday) State
  protected readonly isLead = signal<boolean>(false);
  protected readonly consultationCategory = signal<string>('Lazer Epilasyon');
  protected readonly consultationInquiredSession = signal<string>('');
  protected readonly consultationTargetCount = signal<number>(8);
  protected readonly consultationQuotedPrice = signal<number>(0);
  protected readonly consultationStaff = signal<string>('');
  protected readonly consultationFollowUpDate = signal<string>('');
  protected readonly consultationInterest = signal<string>('high');
  protected readonly consultationChannel = signal<string>('Yüz Yüze');
  protected readonly consultationNotes = signal<string>('');

  // Live Calculations
  protected readonly computedAge = computed(() => {
    return calculateAge(this.birthDate());
  });

  protected readonly isTcknValid = computed(() => {
    const val = this.identityNumber().trim();
    if (!val) return null;
    return isValidTckn(val);
  });

  // TCKN Duplicate Check across loaded customers
  protected readonly existingCustomerWithTckn = computed<BeautyRecord | null>(() => {
    const val = this.identityNumber().trim();
    if (!val || val.length !== 11) return null;
    const currentId = this.initialData()?.id;
    const list = this.entityLookup.getRecords('customers');
    const found = list.find((c) => {
      const cTckn = String(c['identityNumber'] || c['tckn'] || '').trim();
      return cTckn === val && c.id !== currentId;
    });
    return found ?? null;
  });

  protected readonly currentStepIndex = computed(() => {
    const tab = this.activeTab();
    return this.steps.findIndex((s) => s.id === tab);
  });

  protected readonly stepProgress = computed(() => {
    const idx = this.currentStepIndex();
    return ((idx + 1) / this.steps.length) * 100;
  });

  constructor() {
    void this.entityLookup.ensure('customers');
  }

  ngOnChanges(): void {
    void this.entityLookup.ensure('customers');
    const init = this.initialData();
    if (init) {
      this.fullName.set(init.fullName || '');
      this.identityNumber.set(init.identityNumber || '');
      this.birthDate.set(init.birthDate || this.getTodayString());
      this.gender.set(init.gender || 'female');
      this.occupation.set(init.occupation || '');
      this.phone.set(init.phone || '');
      this.emergencyPhone.set(init.emergencyPhone || '');
      this.email.set(init.email || '');
      this.city.set(init.city || '');
      this.district.set(init.district || '');
      this.address.set(init.address || '');

      const h = init.health || {};
      this.skinType.set(h.skinType || 'karma');
      this.fitzpatrick.set(h.fitzpatrick || 'tip-3');
      this.allergies.set(h.allergies || '');
      this.chronicDiseases.set(h.chronicDiseases || '');
      this.medications.set(h.medications || '');
      this.isPregnant.set(!!h.isPregnant);
      this.isNursing.set(!!h.isNursing);
      this.hasImplant.set(!!h.hasImplant);
      this.bloodType.set(h.bloodType || '');
      this.healthNotes.set(h.healthNotes || '');

      this.segment.set(init.segment || 'standart');
      this.referralSource.set(init.referralSource || 'Instagram');
      this.preferredStaffName.set(init.preferredStaffName || '');
      this.initialWalletBalance.set(init.walletBalance || 0);
      this.status.set(init.status || 'active');
      this.notes.set(init.notes || '');
    } else {
      this.birthDate.set(this.getTodayString());
    }
  }

  protected setTab(tab: FormTab): void {
    this.activeTab.set(tab);
    this.error.set('');
  }

  protected isStepCompleted(tab: FormTab): boolean {
    switch (tab) {
      case 'identity':
        return Boolean(this.fullName().trim() && this.identityNumber().trim());
      case 'contact':
        return Boolean(this.phone().trim());
      case 'health':
        return Boolean(this.skinType() || this.allergies().trim());
      case 'finance_crm':
        return Boolean(this.segment());
      case 'consultation':
        return Boolean(this.consultationInquiredSession().trim());
      default:
        return false;
    }
  }

  protected nextTab(): void {
    const idx = this.currentStepIndex();
    if (idx < this.steps.length - 1) {
      this.setTab(this.steps[idx + 1].id);
    }
  }

  protected prevTab(): void {
    const idx = this.currentStepIndex();
    if (idx > 0) {
      this.setTab(this.steps[idx - 1].id);
    }
  }

  protected toggleMaximize(): void {
    this.isMaximized.update((v) => !v);
  }

  protected async submit(): Promise<void> {
    const name = this.fullName().trim();
    const ph = this.phone().trim();

    if (!name) {
      this.activeTab.set('identity');
      this.error.set('Müşteri adı ve soyadı zorunludur.');
      return;
    }
    if (!ph) {
      this.activeTab.set('contact');
      this.error.set('Telefon numarası zorunludur.');
      return;
    }

    const tckn = this.identityNumber().trim();
    if (tckn && !isValidTckn(tckn)) {
      this.activeTab.set('identity');
      this.error.set('Girilen TC Kimlik Numarası geçersizdir. Lütfen 11 haneli geçerli bir numara giriniz.');
      return;
    }

    const dup = this.existingCustomerWithTckn();
    if (dup) {
      this.activeTab.set('identity');
      const dupName = String(dup['fullName'] || dup['name'] || 'Başka bir müşteri');
      this.error.set(`Bu T.C. Kimlik numarası zaten sistemde kayıtlı (${dupName}).`);
      return;
    }

    this.saving.set(true);
    this.error.set('');

    try {
      const activeBranch = this.branchService.activeBranchId();
      const age = this.computedAge();

      const consultations: CustomerConsultation[] = [];
      if (this.consultationInquiredSession().trim()) {
        consultations.push({
          id: `cns_${Date.now()}`,
          customerName: name,
          phone: ph,
          email: this.email().trim() || undefined,
          serviceCategory: this.consultationCategory() || 'Lazer Epilasyon',
          inquiredSession: this.consultationInquiredSession().trim(),
          targetSessionsCount: this.consultationTargetCount() || 1,
          quotedPrice: this.consultationQuotedPrice() || 0,
          consultantStaffName: this.consultationStaff().trim() || undefined,
          consultationDate: new Date().toISOString().split('T')[0],
          nextFollowUpDate: this.consultationFollowUpDate() || undefined,
          interestLevel: this.consultationInterest() as 'high' | 'medium' | 'low',
          channel: this.consultationChannel() as 'Yüz Yüze' | 'Telefon' | 'WhatsApp' | 'Instagram' | 'Web',
          status: 'inquiry',
          notes: this.consultationNotes().trim() || undefined,
        });
      }

      const customerPayload: Partial<CustomerProfile> = {
        fullName: name,
        identityNumber: tckn || undefined,
        birthDate: this.birthDate() || undefined,
        age: age ?? undefined,
        gender: this.gender() as any,
        occupation: this.occupation().trim() || undefined,
        phone: ph,
        emergencyPhone: this.emergencyPhone().trim() || undefined,
        email: this.email().trim() || undefined,
        city: this.city().trim() || undefined,
        district: this.district().trim() || undefined,
        address: this.address().trim() || undefined,
        segment: this.isLead() ? 'lead' : (this.segment() || 'standart'),
        referralSource: this.referralSource() || undefined,
        preferredStaffName: this.preferredStaffName().trim() || undefined,
        status: this.status() || 'active',
        notes: this.notes().trim() || undefined,
        consultations,
        health: {
          skinType: this.skinType() as any,
          fitzpatrick: this.fitzpatrick() as any,
          allergies: this.allergies().trim() || undefined,
          chronicDiseases: this.chronicDiseases().trim() || undefined,
          medications: this.medications().trim() || undefined,
          isPregnant: this.isPregnant(),
          isNursing: this.isNursing(),
          hasImplant: this.hasImplant(),
          bloodType: this.bloodType().trim() || undefined,
          healthNotes: this.healthNotes().trim() || undefined,
          lastUpdated: new Date().toISOString(),
        },
        walletBalance: this.initialWalletBalance() || 0,
        walletTransactions:
          this.initialWalletBalance() > 0
            ? [
                {
                  id: `wtx_${Date.now()}`,
                  date: new Date().toISOString().split('T')[0],
                  type: 'deposit',
                  amount: this.initialWalletBalance(),
                  description: 'Açılış Cüzdan Bakiyesi',
                  paymentMethod: 'Kayıt Açılış',
                },
              ]
            : [],
        installments: [],
        packages: [],
      };

      const res = await firstValueFrom(
        this.api.create<CustomerProfile>('customers', {
          branchId: activeBranch || undefined,
          data: customerPayload,
        })
      );

      this.saved.emit(res.data);
      this.close.emit();
    } catch (err) {
      console.error('Failed to create customer:', err);
      this.error.set(err instanceof Error ? err.message : 'Müşteri kaydedilirken bir hata oluştu.');
    } finally {
      this.saving.set(false);
    }
  }
}
