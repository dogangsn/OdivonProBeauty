import { DOCUMENT } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { ApiClient } from '../../core/api-client';
import { Auth } from '../../core/auth';
import { BeautyRecord, BranchRecord } from '../../core/beauty.model';
import { BranchService } from '../../core/branch.service';
import { TURKISH_CITIES } from '../../core/data/turkish-cities';
import {
  DEFAULT_DEFINITIONS,
  DEFINITION_CATEGORIES,
  DefinitionCategoryKey,
  DefinitionItem,
} from '../../core/definitions/definitions.model';
import { DefinitionsService } from '../../core/definitions/definitions.service';
import { PRESET_CATEGORIES, PresetCategory } from '../../core/presets/beauty-presets';
import { AuthBackdrop } from '../auth/auth-backdrop/auth-backdrop';

export interface DaySchedule {
  day: number;
  label: string;
  short: string;
  selected: boolean;
}

export const INITIAL_DAYS: DaySchedule[] = [
  { day: 1, label: 'Pazartesi', short: 'Pzt', selected: true },
  { day: 2, label: 'Salı', short: 'Sal', selected: true },
  { day: 3, label: 'Çarşamba', short: 'Çar', selected: true },
  { day: 4, label: 'Perşembe', short: 'Per', selected: true },
  { day: 5, label: 'Cuma', short: 'Cum', selected: true },
  { day: 6, label: 'Cumartesi', short: 'Cmt', selected: true },
  { day: 0, label: 'Pazar', short: 'Paz', selected: false },
];

@Component({
  imports: [AuthBackdrop],
  selector: 'app-onboarding',
  styleUrl: './onboarding.css',
  templateUrl: './onboarding.html',
})
export class Onboarding implements OnInit {
  private readonly api = inject(ApiClient);
  private readonly auth = inject(Auth);
  private readonly branchService = inject(BranchService);
  private readonly defService = inject(DefinitionsService);
  private readonly router = inject(Router);
  private readonly document = inject(DOCUMENT);

  // Stepper state: 1: Şube & Konum, 2: Çalışma Saatleri, 3: Tanımlar & Varsayılanlar, 4: Hizmet Kataloğu, 5: Özet & Başlatma
  readonly currentStep = signal<1 | 2 | 3 | 4 | 5>(1);
  readonly isSubmitting = signal(false);
  readonly submitProgress = signal<string>('');
  readonly errorMessage = signal<string>('');

  // 1. Şube ve İşletme Bilgileri
  readonly cities = TURKISH_CITIES;
  readonly businessName = signal<string>('Odivon Beauty');
  readonly branchName = signal<string>('Merkez Şube');
  readonly branchPhone = signal<string>('');
  readonly branchEmail = signal<string>('');
  readonly branchCity = signal<string>('İstanbul');
  readonly branchDistrict = signal<string>('Kadıköy');
  readonly branchAddress = signal<string>('Bağdat Caddesi No: 142');
  readonly taxOffice = signal<string>('');
  readonly taxNumber = signal<string>('');

  // 2. Çalışma Saatleri & Randevu Planı
  readonly workDayStart = signal<string>('09:00');
  readonly workDayEnd = signal<string>('20:00');
  readonly slotDurationMin = signal<number>(30);
  readonly hasBreak = signal<boolean>(false);
  readonly breakStart = signal<string>('13:00');
  readonly breakEnd = signal<string>('14:00');
  readonly days = signal<DaySchedule[]>(JSON.parse(JSON.stringify(INITIAL_DAYS)));

  // 3. Tanımlar ve Varsayılanlar Seçimleri
  readonly categoriesMeta = DEFINITION_CATEGORIES;
  readonly selectedDefCategories = signal<Record<DefinitionCategoryKey, boolean>>({
    'payment-methods': true,
    'room-types': true,
    'staff-roles': true,
    'customer-segments': true,
    'body-zones': true,
    'time-off-types': true,
    'expense-categories': true,
    'consent-types': true,
    'product-units': true,
    'invoice-types': true,
  });
  readonly initialFirstRoomName = signal<string>('1. Lazer & Bakım Kabini');
  readonly initialStaffName = signal<string>('');

  // 4. Hizmet Kataloğu
  readonly presetCategories = signal<PresetCategory[]>(
    JSON.parse(JSON.stringify(PRESET_CATEGORIES)),
  );

  // Computed summary
  readonly selectedDaysCount = computed(
    () => this.days().filter((d) => d.selected).length,
  );
  readonly selectedDefCount = computed(
    () => Object.values(this.selectedDefCategories()).filter(Boolean).length,
  );
  readonly selectedPresetCategories = computed(
    () => this.presetCategories().filter((c) => c.selected),
  );
  readonly totalPresetServicesCount = computed(() =>
    this.selectedPresetCategories().reduce(
      (acc, c) => acc + c.services.filter((s) => s.selected !== false).length,
      0,
    ),
  );

  ngOnInit(): void {
    // Try restoring pending setup info from registration
    try {
      const storage = this.document.defaultView?.sessionStorage;
      if (storage) {
        const raw = storage.getItem('odivon_pending_setup');
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed.businessName) this.businessName.set(parsed.businessName);
          if (parsed.branchName) this.branchName.set(parsed.branchName);
          if (parsed.ownerName) this.initialStaffName.set(parsed.ownerName);
          if (parsed.phone) this.branchPhone.set(parsed.phone);
        }
        const email = storage.getItem('odivon_registered_email');
        if (email) this.branchEmail.set(email);
      }
    } catch {
      // Ignore
    }

    const currentUser = this.auth.currentUser();
    if (currentUser?.email && !this.branchEmail()) {
      this.branchEmail.set(currentUser.email);
    }
    if (currentUser?.displayName && !this.initialStaffName()) {
      this.initialStaffName.set(currentUser.displayName);
    }
  }

  // --- Step Navigation & Validation ---

  setStep(step: 1 | 2 | 3 | 4 | 5): void {
    if (step > this.currentStep() && !this.validateCurrentStep()) {
      return;
    }
    this.errorMessage.set('');
    this.currentStep.set(step);
  }

  nextStep(): void {
    if (!this.validateCurrentStep()) return;
    this.errorMessage.set('');
    const next = Math.min(5, this.currentStep() + 1) as 1 | 2 | 3 | 4 | 5;
    this.currentStep.set(next);
  }

  prevStep(): void {
    this.errorMessage.set('');
    const prev = Math.max(1, this.currentStep() - 1) as 1 | 2 | 3 | 4 | 5;
    this.currentStep.set(prev);
  }

  private validateCurrentStep(): boolean {
    const step = this.currentStep();
    if (step === 1) {
      if (!this.businessName().trim()) {
        this.errorMessage.set('Lütfen merkezinizin / işletmenizin adını girin.');
        return false;
      }
      if (!this.branchName().trim()) {
        this.errorMessage.set('Lütfen en az bir şube adı belirtin (örn: Merkez Şube).');
        return false;
      }
      if (!this.branchCity().trim()) {
        this.errorMessage.set('Lütfen şubenizin bulunduğu ili seçin.');
        return false;
      }
    } else if (step === 2) {
      if (this.selectedDaysCount() === 0) {
        this.errorMessage.set('Lütfen en az bir çalışma günü seçin.');
        return false;
      }
      if (!this.workDayStart() || !this.workDayEnd()) {
        this.errorMessage.set('Lütfen şubenin açılış ve kapanış saatlerini belirtin.');
        return false;
      }
    }
    return true;
  }

  // --- Step 2: Preset Day Shortcuts ---

  setDaysPreset(preset: 'weekdays' | 'mon_sat' | 'all'): void {
    this.days.update((list) =>
      list.map((d) => {
        if (preset === 'weekdays') return { ...d, selected: d.day >= 1 && d.day <= 5 };
        if (preset === 'mon_sat') return { ...d, selected: d.day !== 0 };
        return { ...d, selected: true };
      }),
    );
  }

  toggleDay(dayIndex: number): void {
    this.days.update((list) =>
      list.map((d) => (d.day === dayIndex ? { ...d, selected: !d.selected } : d)),
    );
  }

  // --- Step 3: Definitions Toggles ---

  toggleDefCategory(key: DefinitionCategoryKey): void {
    this.selectedDefCategories.update((map) => ({
      ...map,
      [key]: !map[key],
    }));
  }

  toggleAllDefCategories(value: boolean): void {
    this.selectedDefCategories.update((map) => {
      const next = { ...map };
      for (const k of Object.keys(next) as DefinitionCategoryKey[]) {
        next[k] = value;
      }
      return next;
    });
  }

  // --- Step 4: Preset Categories & Services ---

  togglePresetCategory(categoryKey: string): void {
    this.presetCategories.update((cats) =>
      cats.map((c) => (c.key === categoryKey ? { ...c, selected: !c.selected } : c)),
    );
  }

  toggleAllPresetCategories(value: boolean): void {
    this.presetCategories.update((cats) =>
      cats.map((c) => ({ ...c, selected: value })),
    );
  }

  // --- Final Step: Complete Onboarding ---

  async completeOnboarding(): Promise<void> {
    this.isSubmitting.set(true);
    this.errorMessage.set('');

    try {
      const selectedWorkDays = this.days()
        .filter((d) => d.selected)
        .map((d) => d.day);

      // Step A: Seed / Ensure Onboarding on MainAPI
      this.submitProgress.set('İşletme ve şube kaydı oluşturuluyor…');
      let branchId: string | null = null;
      try {
        const onboardRes = await firstValueFrom(
          this.api.request<{ branchId?: string; tenantId?: string }>(
            'POST',
            'beauty/onboarding',
            {
              businessName: this.businessName().trim(),
              branchName: this.branchName().trim(),
              timezone: 'Europe/Istanbul',
            },
          ),
        );
        branchId = onboardRes.data?.branchId ?? null;
      } catch {
        // If already onboarded, find existing branch
      }

      // Ensure branches list is fetched
      const branches = await this.branchService.ensureBranches();
      if (!branchId && branches.length > 0) {
        branchId = branches[0].id;
      }

      // Step B: Update or Create Detailed Branch
      this.submitProgress.set('Şube çalışma saatleri ve iletişim detayları kaydediliyor…');
      const branchPayload = {
        name: this.branchName().trim(),
        phone: this.branchPhone().trim() || undefined,
        email: this.branchEmail().trim() || undefined,
        city: this.branchCity().trim(),
        district: this.branchDistrict().trim() || undefined,
        address: this.branchAddress().trim() || undefined,
        taxOffice: this.taxOffice().trim() || undefined,
        taxNumber: this.taxNumber().trim() || undefined,
        workDays: selectedWorkDays,
        workDayStart: this.workDayStart(),
        workDayEnd: this.workDayEnd(),
        slotDurationMin: this.slotDurationMin(),
        hasBreak: this.hasBreak(),
        breakStart: this.hasBreak() ? this.breakStart() : undefined,
        breakEnd: this.hasBreak() ? this.breakEnd() : undefined,
        active: true,
      };

      if (branchId) {
        await firstValueFrom(
          this.api.update<BranchRecord>('branches', branchId, {
            data: branchPayload,
          }),
        ).catch(() => undefined);
      } else {
        const created = await firstValueFrom(
          this.api.create<BranchRecord>('branches', {
            data: branchPayload,
          }),
        ).catch(() => null);
        if (created?.data?.id) branchId = created.data.id;
      }

      // Step C: Save Operating Hours to Settings
      await firstValueFrom(
        this.api.create('settings', {
          name: 'branch_operating_schedule',
          scope: 'branch',
          branchId: branchId || undefined,
          value: JSON.stringify({
            workDays: selectedWorkDays,
            workDayStart: this.workDayStart(),
            workDayEnd: this.workDayEnd(),
            slotDurationMin: this.slotDurationMin(),
            hasBreak: this.hasBreak(),
            breakStart: this.breakStart(),
            breakEnd: this.breakEnd(),
          }),
          status: 'active',
        }),
      ).catch(() => undefined);

      // Step D: Seed Default Definitions
      this.submitProgress.set('Standart tanımlar ve ödeme yöntemleri yükleniyor…');
      const defSelection = this.selectedDefCategories();
      for (const cat of DEFINITION_CATEGORIES) {
        if (defSelection[cat.key]) {
          const defaultItems = DEFAULT_DEFINITIONS[cat.key] ?? [];
          const itemsWithIds: DefinitionItem[] = defaultItems.map((item, idx) => ({
            ...item,
            id: `def_sys_${cat.key}_${idx + 1}`,
            isSystem: true,
          }));

          // Persist to settings
          await firstValueFrom(
            this.api.create('settings', {
              name: `def:${cat.key}`,
              scope: 'definition',
              value: JSON.stringify(itemsWithIds),
              status: 'active',
            }),
          ).catch(() => undefined);
        }
      }
      // Trigger sync in DefinitionsService
      await this.defService.syncRemote();

      // Step E: Create Initial Room / Cabin if specified
      if (this.initialFirstRoomName().trim() && branchId) {
        await firstValueFrom(
          this.api.create('rooms', {
            branchId,
            data: {
              name: this.initialFirstRoomName().trim(),
              type: 'laser',
              capacity: 1,
              status: 'active',
            },
          }),
        ).catch(() => undefined);
      }

      // Step F: Seed Preset Service Categories & Services
      this.submitProgress.set('Seçilen güzellik hizmetleri ve kategoriler kataloğa ekleniyor…');
      for (const cat of this.selectedPresetCategories()) {
        try {
          const catRes = await firstValueFrom(
            this.api.create<BeautyRecord>('service-categories', {
              branchId: branchId || undefined,
              data: {
                name: cat.name,
                color: cat.color,
                description: cat.description,
                sortOrder: cat.sortOrder,
                status: 'active',
              },
            }),
          );
          const categoryId = catRes.data?.id;

          const servicesToSeed = cat.services.filter((s) => s.selected !== false);
          for (const s of servicesToSeed) {
            await firstValueFrom(
              this.api.create('services', {
                branchId: branchId || undefined,
                data: {
                  name: s.name,
                  categoryId: categoryId || undefined,
                  durationMin: s.durationMin,
                  price: s.price,
                  vatRate: s.vatRate,
                  sessionIntervalDays: s.sessionIntervalDays,
                  commissionRate: s.commissionRate || 10,
                  status: 'active',
                },
              }),
            ).catch(() => undefined);
          }
        } catch {
          // If a category fails to seed, continue to next
        }
      }

      // Step G: Mark Onboarding Completed
      this.submitProgress.set('Kurulum başarıyla tamamlandı! Sisteme yönlendiriliyorsunuz…');
      await firstValueFrom(
        this.api.create('settings', {
          name: 'onboarding_completed',
          scope: 'tenant',
          value: JSON.stringify({
            completed: true,
            completedAt: new Date().toISOString(),
          }),
          status: 'active',
        }),
      ).catch(() => undefined);

      try {
        const storage = this.document.defaultView?.localStorage;
        if (storage) {
          storage.setItem('odivon_beauty_onboarded', 'true');
        }
        this.document.defaultView?.sessionStorage.removeItem('odivon_pending_setup');
      } catch {
        // Ignore
      }

      // Refresh branches in branch service
      await this.branchService.ensureBranches();

      // Navigate to dashboard
      await this.router.navigateByUrl('/dashboard');
    } catch (err: unknown) {
      const errObj = err as { message?: string };
      this.errorMessage.set(
        errObj?.message ?? 'Kurulum sırasında bir hata oluştu. Lütfen tekrar deneyin.',
      );
    } finally {
      this.isSubmitting.set(false);
    }
  }
}
