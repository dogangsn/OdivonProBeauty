import {
  Component,
  computed,
  inject,
  input,
  linkedSignal,
  output,
  signal,
} from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { firstValueFrom } from 'rxjs';
import { ApiClient } from '../../../core/api-client';
import {
  CustomerConsultation,
  CustomerPackage,
  CustomerProfile,
  CustomerSessionItem,
  InstallmentPlan,
  InstallmentScheduleItem,
  WalletTransaction,
  calculateAge,
  isValidTckn,
} from '../../../core/customer/customer.model';
import { StatusBadge } from '../../status-badge/status-badge';

export type DetailTab = 'overview' | 'health' | 'wallet' | 'installments' | 'sessions' | 'consultations' | 'edit';

@Component({
  selector: 'app-customer-detail-modal',
  imports: [DatePipe, DecimalPipe, StatusBadge],
  templateUrl: './customer-detail-modal.html',
  styleUrl: './customer-detail-modal.css',
})
export class CustomerDetailModal {
  private readonly api = inject(ApiClient);

  // Inputs & Outputs
  readonly customer = input.required<CustomerProfile>();
  readonly open = input<boolean>(true);
  readonly initialTab = input<DetailTab>('overview');
  readonly close = output<void>();
  readonly updated = output<CustomerProfile>();

  // State
  protected readonly activeTab = linkedSignal<DetailTab>(() => this.initialTab());
  protected readonly saving = signal<boolean>(false);
  protected readonly feedback = signal<string>('');
  protected readonly error = signal<string>('');

  // Local mutable copy of customer for interactive actions (wallet, installments, sessions)
  protected readonly currentCustomer = linkedSignal<CustomerProfile>(() => this.customer());

  // Modals / Dialog states inside Detail Modal
  protected readonly showDepositModal = signal<boolean>(false);
  protected readonly depositAmount = signal<number>(500);
  protected readonly depositMethod = signal<string>('Kredi Kartı');
  protected readonly depositDescription = signal<string>('Cüzdan Avans Yüklemesi');

  protected readonly showSpendModal = signal<boolean>(false);
  protected readonly spendAmount = signal<number>(250);
  protected readonly spendDescription = signal<string>('Hizmet / Ürün Harcaması');

  protected readonly showCollectInstallmentModal = signal<boolean>(false);
  protected readonly selectedInstallment = signal<{
    planId: string;
    item: InstallmentScheduleItem;
  } | null>(null);
  protected readonly collectionMethod = signal<string>('Kredi Kartı');

  protected readonly showNewInstallmentPlanModal = signal<boolean>(false);
  protected readonly newPlanTitle = signal<string>('');
  protected readonly newPlanAmount = signal<number>(6000);
  protected readonly newPlanCount = signal<number>(3);
  protected readonly newPlanFirstDate = signal<string>(
    new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]
  );

  protected readonly showNewSessionModal = signal<boolean>(false);
  protected readonly selectedPackage = signal<CustomerPackage | null>(null);
  protected readonly sessionZone = signal<string>('Tüm Vücut');
  protected readonly sessionStaff = signal<string>('');
  protected readonly sessionNotes = signal<string>('');

  // Consultation & Preliminary Inquiries State
  protected readonly showNewConsultationModal = signal<boolean>(false);
  protected readonly newConsultationCategory = signal<string>('Lazer Epilasyon');
  protected readonly newConsultationSession = signal<string>('');
  protected readonly newConsultationCount = signal<number>(8);
  protected readonly newConsultationPrice = signal<number>(0);
  protected readonly newConsultationStaff = signal<string>('');
  protected readonly newConsultationFollowUp = signal<string>('');
  protected readonly newConsultationInterest = signal<string>('high');
  protected readonly newConsultationChannel = signal<string>('Yüz Yüze');
  protected readonly newConsultationNotes = signal<string>('');

  // Customer Online Payment Link Modal State
  protected readonly showPaymentLinkModal = signal<boolean>(false);
  protected readonly linkPaymentType = signal<string>('deposit');
  protected readonly linkAmount = signal<number>(500);
  protected readonly linkTitle = signal<string>('Randevu Ön Ödemesi');
  protected readonly generatedPaymentLinkUrl = signal<string>('');

  // Edit Tab Draft
  protected readonly editDraft = linkedSignal<Partial<CustomerProfile>>(() => {
    const c = this.currentCustomer();
    if (!c) return {};
    return {
      fullName: c.fullName,
      identityNumber: c.identityNumber,
      birthDate: c.birthDate,
      gender: c.gender,
      occupation: c.occupation,
      phone: c.phone,
      emergencyPhone: c.emergencyPhone,
      email: c.email,
      city: c.city,
      district: c.district,
      address: c.address,
      segment: c.segment,
      referralSource: c.referralSource,
      preferredStaffName: c.preferredStaffName,
      status: c.status,
      notes: c.notes,
      health: { ...(c.health || {}) },
    };
  });

  // Computed properties
  protected readonly computedAge = computed(() => {
    const c = this.currentCustomer();
    if (!c) return null;
    return calculateAge(c.birthDate);
  });

  protected readonly isTcknValid = computed(() => {
    const c = this.currentCustomer();
    if (!c?.identityNumber) return false;
    return isValidTckn(c.identityNumber);
  });

  protected readonly healthAlerts = computed(() => {
    const c = this.currentCustomer();
    const h = c?.health;
    if (!h) return [];
    const alerts: { text: string; severity: 'critical' | 'warning' | 'info' }[] = [];

    if (h.isPregnant) {
      alerts.push({
        text: 'HAMİLELİK DÖNEMİ: Lazer epilasyon ve agresif kimyasal bakımlar uygulanamaz!',
        severity: 'critical',
      });
    }
    if (h.hasImplant) {
      alerts.push({
        text: 'KALP PİLİ / METAL İMPLANT: Radyofrekans ve elektrik akımlı cihazlar kontrendikedir!',
        severity: 'critical',
      });
    }
    if (h.medications && /roaccutane|retinoid|izotretinoin|zoretanin/i.test(h.medications)) {
      alerts.push({
        text: 'RETİNOİD / ROACCUTANE: Lazer atışı öncesi 6 ay beklenmelidir (cilt incelmesi ve skar riski)!',
        severity: 'critical',
      });
    }
    if (h.medications && /kan suland|aspirin|ecopirin|kumadin|plavix/i.test(h.medications)) {
      alerts.push({
        text: 'KAN SULANDIRICI İLAÇ: İğneli epilasyon ve mikroiğneleme işlemlerinde kanama uyarısı.',
        severity: 'warning',
      });
    }
    if (h.isNursing) {
      alerts.push({
        text: 'EMZİRME DÖNEMİ: Hormon seviyeleri nedeniyle seans verimi değişebilir.',
        severity: 'info',
      });
    }
    if (h.allergies && h.allergies.trim().length > 0 && !/yok/i.test(h.allergies)) {
      alerts.push({
        text: `BİLİNEN ALERJİ: ${h.allergies}`,
        severity: 'warning',
      });
    }

    return alerts;
  });

  protected readonly totalInstallmentDebt = computed(() => {
    const c = this.currentCustomer();
    if (!c?.installments) return 0;
    return c.installments.reduce((acc, p) => acc + (p.remainingAmount || 0), 0);
  });

  protected readonly overdueInstallmentCount = computed(() => {
    const c = this.currentCustomer();
    if (!c?.installments) return 0;
    const now = new Date().toISOString().split('T')[0];
    let count = 0;
    for (const plan of c.installments) {
      for (const item of plan.schedule || []) {
        if (item.status === 'overdue' || (item.status === 'pending' && item.dueDate < now)) {
          count++;
        }
      }
    }
    return count;
  });



  private initDraft(c: CustomerProfile): void {
    this.editDraft.set({
      fullName: c.fullName,
      identityNumber: c.identityNumber,
      birthDate: c.birthDate,
      gender: c.gender,
      occupation: c.occupation,
      phone: c.phone,
      emergencyPhone: c.emergencyPhone,
      email: c.email,
      city: c.city,
      district: c.district,
      address: c.address,
      segment: c.segment,
      referralSource: c.referralSource,
      preferredStaffName: c.preferredStaffName,
      status: c.status,
      notes: c.notes,
      health: { ...(c.health || {}) },
    });
  }

  protected setTab(tab: DetailTab): void {
    this.activeTab.set(tab);
    this.feedback.set('');
    this.error.set('');
  }

  // --- WALLET ACTIONS ---
  protected openDepositModal(): void {
    this.depositAmount.set(500);
    this.depositMethod.set('Kredi Kartı');
    this.depositDescription.set('Cüzdan Avans Yüklemesi');
    this.showDepositModal.set(true);
  }

  protected async confirmDeposit(): Promise<void> {
    const amount = Number(this.depositAmount());
    if (isNaN(amount) || amount <= 0) {
      this.error.set('Geçerli bir yükleme tutarı giriniz.');
      return;
    }

    const current = this.currentCustomer();
    if (!current) return;

    const newTx: WalletTransaction = {
      id: `wtx_${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      type: 'deposit',
      amount,
      paymentMethod: this.depositMethod(),
      description: this.depositDescription().trim() || 'Cüzdan Yüklemesi',
    };

    const newBalance = (current.walletBalance || 0) + amount;
    const newTransactions = [newTx, ...(current.walletTransactions || [])];

    const updatedCust: CustomerProfile = {
      ...current,
      walletBalance: newBalance,
      walletTransactions: newTransactions,
    };

    await this.persistCustomer(updatedCust, `₺${amount} tutarında cüzdan yüklemesi kaydedildi.`);
    this.showDepositModal.set(false);
  }

  protected openSpendModal(): void {
    const current = this.currentCustomer();
    const balance = current?.walletBalance || 0;
    this.spendAmount.set(Math.min(250, balance));
    this.spendDescription.set('Hizmet / Ürün Harcaması');
    this.showSpendModal.set(true);
  }

  protected async confirmSpend(): Promise<void> {
    const amount = Number(this.spendAmount());
    const current = this.currentCustomer();
    if (!current) return;

    const balance = current.walletBalance || 0;
    if (isNaN(amount) || amount <= 0) {
      this.error.set('Geçerli bir harcama tutarı giriniz.');
      return;
    }
    if (amount > balance) {
      this.error.set(`Yetersiz bakiye. Mevcut bakiye: ₺${balance}`);
      return;
    }

    const newTx: WalletTransaction = {
      id: `wtx_${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      type: 'spend',
      amount,
      paymentMethod: 'Cüzdan Bakiyesi',
      description: this.spendDescription().trim() || 'Hizmet Harcaması',
    };

    const newBalance = balance - amount;
    const newTransactions = [newTx, ...(current.walletTransactions || [])];

    const updatedCust: CustomerProfile = {
      ...current,
      walletBalance: newBalance,
      walletTransactions: newTransactions,
    };

    await this.persistCustomer(updatedCust, `₺${amount} cüzdandan tahsil edildi. Kalan bakiye: ₺${newBalance}`);
    this.showSpendModal.set(false);
  }

  // --- INSTALLMENT ACTIONS ---
  protected openCollectModal(planId: string, item: InstallmentScheduleItem): void {
    this.selectedInstallment.set({ planId, item });
    this.collectionMethod.set('Kredi Kartı');
    this.showCollectInstallmentModal.set(true);
  }

  protected async confirmCollection(): Promise<void> {
    const target = this.selectedInstallment();
    const current = this.currentCustomer();
    if (!target || !current) return;

    const method = this.collectionMethod();
    const amount = target.item.amount;

    // If payment method is wallet, check balance
    let newWalletBalance = current.walletBalance || 0;
    let newWalletTxs = [...(current.walletTransactions || [])];

    if (method === 'Cüzdan Bakiyesi') {
      if (newWalletBalance < amount) {
        this.error.set(`Cüzdan bakiyesi yetersiz! Gerekli: ₺${amount}, Mevcut: ₺${newWalletBalance}`);
        return;
      }
      newWalletBalance -= amount;
      newWalletTxs = [
        {
          id: `wtx_${Date.now()}`,
          date: new Date().toISOString().split('T')[0],
          type: 'spend',
          amount,
          paymentMethod: 'Cüzdan Bakiyesi',
          description: `${target.item.installmentNo}. Taksit Ödemesi`,
        },
        ...newWalletTxs,
      ];
    }

    // Update the installment item in the schedule
    const updatedPlans = (current.installments || []).map((plan) => {
      if (plan.id !== target.planId) return plan;

      const newSchedule = plan.schedule.map((sch) => {
        if (sch.installmentNo !== target.item.installmentNo) return sch;
        return {
          ...sch,
          status: 'paid' as const,
          paidAt: new Date().toISOString().split('T')[0],
          paymentMethod: method,
        };
      });

      const newPaid = newSchedule
        .filter((s) => s.status === 'paid')
        .reduce((sum, s) => sum + s.amount, 0);

      const newRemaining = Math.max(0, plan.totalAmount - newPaid);

      return {
        ...plan,
        paidAmount: newPaid,
        remainingAmount: newRemaining,
        schedule: newSchedule,
      };
    });

    const updatedCust: CustomerProfile = {
      ...current,
      walletBalance: newWalletBalance,
      walletTransactions: newWalletTxs,
      installments: updatedPlans,
    };

    await this.persistCustomer(
      updatedCust,
      `${target.item.installmentNo}. Taksit (₺${amount}) ${method} ile başarıyla tahsil edildi.`
    );
    this.showCollectInstallmentModal.set(false);
    this.selectedInstallment.set(null);
  }

  protected openNewInstallmentPlanModal(): void {
    this.newPlanTitle.set('Lazer Epilasyon Paketi (6 Taksit)');
    this.newPlanAmount.set(6000);
    this.newPlanCount.set(3);
    const today = new Date();
    today.setMonth(today.getMonth() + 1);
    this.newPlanFirstDate.set(today.toISOString().split('T')[0]);
    this.showNewInstallmentPlanModal.set(true);
  }

  protected async confirmNewInstallmentPlan(): Promise<void> {
    const title = this.newPlanTitle().trim();
    const totalAmount = Number(this.newPlanAmount());
    const count = Number(this.newPlanCount());
    const firstDateStr = this.newPlanFirstDate();

    if (!title) {
      this.error.set('Lütfen plan başlığı giriniz.');
      return;
    }
    if (isNaN(totalAmount) || totalAmount <= 0) {
      this.error.set('Geçerli bir toplam tutar giriniz.');
      return;
    }
    if (isNaN(count) || count < 1 || count > 24) {
      this.error.set('Taksit sayısı 1 ile 24 arasında olmalıdır.');
      return;
    }

    const current = this.currentCustomer();
    if (!current) return;

    // Generate schedule
    const installmentAmount = Math.round(totalAmount / count);
    const schedule: InstallmentScheduleItem[] = [];
    const baseDate = new Date(firstDateStr || Date.now());

    for (let i = 1; i <= count; i++) {
      const dueDate = new Date(baseDate);
      dueDate.setMonth(dueDate.getMonth() + (i - 1));
      // Adjust last installment for rounding differences
      const amt = i === count ? totalAmount - installmentAmount * (count - 1) : installmentAmount;

      schedule.push({
        installmentNo: i,
        dueDate: dueDate.toISOString().split('T')[0],
        amount: amt,
        status: 'pending',
      });
    }

    const newPlan: InstallmentPlan = {
      id: `inst_${Date.now()}`,
      title,
      totalAmount,
      paidAmount: 0,
      remainingAmount: totalAmount,
      installmentCount: count,
      createdAt: new Date().toISOString().split('T')[0],
      schedule,
    };

    const updatedCust: CustomerProfile = {
      ...current,
      installments: [...(current.installments || []), newPlan],
    };

    await this.persistCustomer(updatedCust, `Yeni taksit planı (${title} - ₺${totalAmount}) başarıyla oluşturuldu.`);
    this.showNewInstallmentPlanModal.set(false);
  }

  // --- SESSION ACTIONS ---
  protected openNewSessionModal(pkg: CustomerPackage): void {
    this.selectedPackage.set(pkg);
    this.sessionZone.set('Tüm Vücut');
    this.sessionStaff.set(this.currentCustomer()?.preferredStaffName || 'Uzm. Estetisyen');
    this.sessionNotes.set('Uygulama başarıyla tamamlandı, soğutucu başlık kullanıldı.');
    this.showNewSessionModal.set(true);
  }

  protected async confirmAddSession(): Promise<void> {
    const pkg = this.selectedPackage();
    const current = this.currentCustomer();
    if (!pkg || !current) return;

    const nextSessionNo = (pkg.completedSessions || 0) + 1;
    const newSession: CustomerSessionItem = {
      sessionNo: nextSessionNo,
      date: new Date().toISOString().split('T')[0],
      zone: this.sessionZone().trim() || 'Tüm Vücut',
      staffName: this.sessionStaff().trim() || 'Uzm. Estetisyen',
      status: 'completed',
      notes: this.sessionNotes().trim() || undefined,
    };

    // Update package
    const updatedPackages = (current.packages || []).map((p) => {
      if (p.id !== pkg.id) return p;

      // Replace pending/scheduled session or append
      let found = false;
      const updatedSessions = p.sessions.map((s) => {
        if (!found && (s.status === 'pending' || s.status === 'scheduled')) {
          found = true;
          return newSession;
        }
        return s;
      });

      if (!found) {
        updatedSessions.push(newSession);
      }

      const completed = updatedSessions.filter((s) => s.status === 'completed').length;
      const remaining = Math.max(0, p.totalSessions - completed);
      const isFinished = remaining === 0;

      return {
        ...p,
        completedSessions: completed,
        remainingSessions: remaining,
        status: (isFinished ? 'completed' : p.status) as 'active' | 'completed' | 'frozen',
        sessions: updatedSessions,
      };
    });

    const updatedCust: CustomerProfile = {
      ...current,
      packages: updatedPackages,
    };

    await this.persistCustomer(
      updatedCust,
      `${pkg.packageName} için ${nextSessionNo}. seans başarıyla düşüldü ve kaydedildi.`
    );
    this.showNewSessionModal.set(false);
    this.selectedPackage.set(null);
  }

  // Quick Action: Deduct next session directly
  protected async quickDeductSession(pkg: CustomerPackage): Promise<void> {
    if (pkg.remainingSessions <= 0) {
      this.error.set('Bu pakette kalan seans bulunmuyor.');
      return;
    }
    this.openNewSessionModal(pkg);
  }

  // --- CONSULTATIONS & SESSION INQUIRIES ---
  protected openNewConsultationModal(): void {
    this.newConsultationCategory.set('Lazer Epilasyon');
    this.newConsultationSession.set('');
    this.newConsultationCount.set(8);
    this.newConsultationPrice.set(0);
    this.newConsultationStaff.set(this.currentCustomer()?.preferredStaffName || '');
    this.newConsultationFollowUp.set('');
    this.newConsultationInterest.set('high');
    this.newConsultationChannel.set('Yüz Yüze');
    this.newConsultationNotes.set('');
    this.showNewConsultationModal.set(true);
    this.error.set('');
  }

  protected closeNewConsultationModal(): void {
    this.showNewConsultationModal.set(false);
  }

  protected async saveNewConsultation(): Promise<void> {
    const session = this.newConsultationSession().trim();
    if (!session) {
      this.error.set('Lütfen bilgi alınan seans veya paket detayını girin.');
      return;
    }

    const current = this.currentCustomer();
    if (!current) return;

    const newConsultation: CustomerConsultation = {
      id: `cns_${Date.now()}`,
      customerId: current.id,
      customerName: current.fullName,
      phone: current.phone,
      email: current.email,
      serviceCategory: this.newConsultationCategory(),
      inquiredSession: session,
      targetSessionsCount: this.newConsultationCount() || 1,
      quotedPrice: this.newConsultationPrice() || 0,
      consultantStaffName: this.newConsultationStaff().trim() || undefined,
      consultationDate: new Date().toISOString().split('T')[0],
      nextFollowUpDate: this.newConsultationFollowUp() || undefined,
      interestLevel: this.newConsultationInterest() as 'high' | 'medium' | 'low',
      channel: this.newConsultationChannel() as 'Yüz Yüze' | 'Telefon' | 'WhatsApp' | 'Instagram' | 'Web',
      status: 'inquiry',
      notes: this.newConsultationNotes().trim() || undefined,
    };

    const updatedCust: CustomerProfile = {
      ...current,
      consultations: [newConsultation, ...(current.consultations || [])],
    };

    await this.persistCustomer(
      updatedCust,
      `"${session}" seans ön görüşmesi ve teklif bilgisi başarıyla kaydedildi.`
    );
    this.showNewConsultationModal.set(false);
  }

  protected async updateConsultationStatus(
    consultationId: string,
    newStatus: CustomerConsultation['status']
  ): Promise<void> {
    const current = this.currentCustomer();
    if (!current || !current.consultations) return;

    const updatedConsultations = current.consultations.map((c) =>
      c.id === consultationId ? { ...c, status: newStatus } : c
    );

    const updatedCust: CustomerProfile = {
      ...current,
      consultations: updatedConsultations,
    };

    const statusLabel =
      newStatus === 'converted'
        ? 'Satışa Dönüştü'
        : newStatus === 'scheduled'
        ? 'Randevu Verildi'
        : newStatus === 'cancelled'
        ? 'Vazgeçti'
        : 'Bilgi Aldı';

    await this.persistCustomer(
      updatedCust,
      `Ön görüşme durumu "${statusLabel}" olarak güncellendi.`
    );
  }

  protected async removeConsultation(consultationId: string): Promise<void> {
    if (!confirm('Bu ön görüşme kaydını silmek istediğinize emin misiniz?')) return;

    const current = this.currentCustomer();
    if (!current || !current.consultations) return;

    const updatedConsultations = current.consultations.filter((c) => c.id !== consultationId);

    const updatedCust: CustomerProfile = {
      ...current,
      consultations: updatedConsultations,
    };

    await this.persistCustomer(updatedCust, 'Ön görüşme kaydı silindi.');
  }

  // --- EDIT TAB & PROFILE UPDATE ---
  protected updateDraftField(field: string, event: Event): void {
    const target = event.target as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
    const val = target.value;
    this.editDraft.update((d) => ({
      ...d,
      [field]: val,
      ...(field === 'birthDate' ? { age: calculateAge(val) ?? undefined } : {}),
    }));
  }

  protected updateHealthField(field: string, event: Event): void {
    const target = event.target as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
    const isCheckbox = target.type === 'checkbox';
    const val = isCheckbox ? (target as HTMLInputElement).checked : target.value;

    this.editDraft.update((d) => ({
      ...d,
      health: {
        ...(d.health || {}),
        [field]: val,
        lastUpdated: new Date().toISOString(),
      },
    }));
  }

  protected async saveDraft(): Promise<void> {
    const draft = this.editDraft();
    const current = this.currentCustomer();
    if (!current) return;

    if (!draft.fullName?.trim()) {
      this.error.set('Müşteri adı ve soyadı zorunludur.');
      return;
    }
    if (!draft.phone?.trim()) {
      this.error.set('Telefon numarası zorunludur.');
      return;
    }

    if (draft.identityNumber && !isValidTckn(draft.identityNumber)) {
      this.error.set('Girilen TC Kimlik Numarası geçersizdir. Lütfen 11 haneli geçerli bir TCKN giriniz.');
      return;
    }

    const calculatedAge = draft.birthDate ? calculateAge(draft.birthDate) ?? undefined : undefined;

    const updatedCust: CustomerProfile = {
      ...current,
      ...draft,
      age: calculatedAge,
      fullName: draft.fullName.trim(),
      phone: draft.phone.trim(),
    };

    await this.persistCustomer(updatedCust, 'Müşteri profili ve sağlık bilgileri başarıyla güncellendi.');
    this.setTab('overview');
  }

  // --- PERSISTENCE HELPER ---
  private async persistCustomer(updated: CustomerProfile, successMsg: string): Promise<void> {
    this.saving.set(true);
    this.feedback.set('');
    this.error.set('');

    try {
      // In MainAPI, PATCH /beauty/customers/:id accepts { data: updatedCustomer }
      const { id, createdAt, updatedAt, createdBy, updatedBy, deletedAt, ...cleanData } = updated;

      await firstValueFrom(
        this.api.update<CustomerProfile>('customers', id, {
          data: cleanData,
        })
      );

      this.currentCustomer.set(updated);
      this.initDraft(updated);
      this.feedback.set(successMsg);
      this.updated.emit(updated);
    } catch (err) {
      console.error('Failed to update customer:', err);
      this.error.set(err instanceof Error ? err.message : 'Kayıt güncellenirken bir hata oluştu.');
    } finally {
      this.saving.set(false);
    }
  }

  // --- ONLINE PAYMENT LINK ACTIONS ---
  protected openPaymentLinkModal(): void {
    const cust = this.currentCustomer();
    this.linkPaymentType.set('deposit');
    this.linkAmount.set(500);
    this.linkTitle.set(`${cust?.fullName || 'Müşteri'} - Randevu Ön Ödemesi`);
    this.generatedPaymentLinkUrl.set('');
    this.showPaymentLinkModal.set(true);
  }

  protected closePaymentLinkModal(): void {
    this.showPaymentLinkModal.set(false);
    this.generatedPaymentLinkUrl.set('');
  }

  protected generatePaymentLink(): void {
    const code = `LNK-${Math.floor(8930 + Math.random() * 900)}`;
    const fullUrl = `${window.location.origin}/pay/${code}`;
    this.generatedPaymentLinkUrl.set(fullUrl);
    this.feedback.set(`${code} kodlu online ödeme bağlantısı hazırlandı.`);
  }

  protected sendPaymentLinkViaWhatsApp(): void {
    const cust = this.currentCustomer();
    if (!cust) return;
    const cleanPhone = (cust.phone || '').replace(/\D/g, '');
    const url = this.generatedPaymentLinkUrl();
    const msg = encodeURIComponent(
      `Sayın ${cust.fullName},\nOdivonPro Güzellik Merkezi bünyesindeki "${this.linkTitle()}" işleminiz için ${this.linkAmount().toLocaleString('tr-TR')} ₺ tutarındaki güvenli 3D Secure ödeme bağlantınız:\n\n${url}\n\nİyi günler dileriz.`
    );
    window.open(`https://wa.me/${cleanPhone}?text=${msg}`, '_blank');
  }

  protected copyPaymentLink(): void {
    const url = this.generatedPaymentLinkUrl();
    navigator.clipboard.writeText(url).then(() => {
      this.feedback.set('Ödeme linki panoya kopyalandı.');
    });
  }

  // Helpers
  protected getInitials(name?: string): string {
    if (!name) return 'OD';
    return name
      .split(' ')
      .filter(Boolean)
      .map((part) => part[0])
      .slice(0, 2)
      .join('')
      .toLocaleUpperCase('tr');
  }

  protected getProgressPercent(completed: number, total: number): number {
    if (!total || total <= 0) return 0;
    return Math.min(100, Math.round((completed / total) * 100));
  }
}
