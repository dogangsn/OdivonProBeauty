import { Component, computed, inject, resource, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { ApiClient } from '../../core/api-client';
import { BranchService } from '../../core/branch.service';
import {
  FingerKey,
  FINGER_LABELS,
  NAIL_ART_TIERS,
  NAIL_LENGTHS,
  NAIL_SHAPES,
  NailArtTier,
  NailArtTierMeta,
  NailDesignConfig,
  NailFinish,
  NailHealthAssessment,
  NailLength,
  NailLengthMeta,
  NailShape,
  NailShapeMeta,
  NailSterilizationRecord,
  NailSwatch,
  NailTechnique,
  NailWarrantyRecord,
} from '../../core/nail-studio/nail-studio.model';
import {
  DEMO_NAIL_HEALTH,
  DEMO_NAIL_WARRANTIES,
  DEMO_STERILIZATIONS,
  NAIL_SWATCHES,
  NAIL_TECHNIQUES,
} from '../../core/nail-studio/nail-studio-demo-data';

import { PageHeader } from '../../shared/page-header/page-header';

export type NailStudioTab = 'customizer' | 'warranty' | 'health' | 'hygiene';

@Component({
  selector: 'app-nail-studio',
  imports: [DatePipe, PageHeader],
  styleUrl: './nail-studio.css',
  templateUrl: './nail-studio.html',
})
export class NailStudio {
  private readonly api = inject(ApiClient);
  protected readonly branchService = inject(BranchService);
  private readonly router = inject(Router);

  // Active Tab
  protected readonly activeTab = signal<NailStudioTab>('customizer');

  // Master Data Catalogs
  protected readonly shapes = NAIL_SHAPES;
  protected readonly lengths = NAIL_LENGTHS;
  protected readonly artTiers = NAIL_ART_TIERS;
  protected readonly techniques = NAIL_TECHNIQUES;
  protected readonly swatches = signal<NailSwatch[]>([...NAIL_SWATCHES]);

  // Swatch Filter & Category
  protected readonly selectedColorCategory = signal<string>('all');
  protected readonly swatchSearch = signal<string>('');

  // Interactive Customizer State
  protected readonly selectedShape = signal<NailShape>('almond');
  protected readonly selectedLength = signal<NailLength>('medium');
  protected readonly selectedFinish = signal<NailFinish>('glossy');
  protected readonly selectedTechniqueId = signal<string>('tech-rubber-base');
  protected readonly selectedSwatchId = signal<string>('sw-2'); // Ballerina Soft Pink
  protected readonly selectedArtTier = signal<NailArtTier>('tier-1'); // French / Minimalist
  protected readonly needsSafeRemoval = signal<boolean>(false);
  protected readonly selectedAccentFinger = signal<FingerKey>('right-ring');
  protected readonly frenchColor = signal<string>('#ffffff'); // Tip accent color

  // Hand preview mode: single finger focus or 5 fingers
  protected readonly previewMode = signal<'single' | 'hand'>('single');

  // Warranty & Repairs State
  protected readonly warranties = signal<NailWarrantyRecord[]>([...DEMO_NAIL_WARRANTIES]);
  protected readonly warrantySearch = signal<string>('');
  protected readonly warrantyStatusFilter = signal<string>('all');
  protected readonly showRepairModal = signal<boolean>(false);
  protected readonly selectedWarrantyForRepair = signal<NailWarrantyRecord | null>(null);
  protected readonly repairFinger = signal<FingerKey>('right-middle');
  protected readonly repairNotes = signal<string>('');
  protected readonly isFreeUnderWarranty = signal<boolean>(true);

  // Sterilization / Autoclave Log State
  protected readonly sterilizations = signal<NailSterilizationRecord[]>([...DEMO_STERILIZATIONS]);
  protected readonly showSterilizationModal = signal<boolean>(false);
  protected readonly newCycleDevice = signal<string>('Melag Vacuklav 23B+ (B-Class Medikal Otoklav)');
  protected readonly newCycleHoldTime = signal<number>(18);
  protected readonly newCycleTemp = signal<number>(134);
  protected readonly newCyclePressure = signal<number>(2.15);
  protected readonly newCyclePouchBarcode = signal<string>(
    'POUCH-' + Math.floor(100000 + Math.random() * 900000),
  );
  protected readonly newCyclePouchCount = signal<number>(14);
  protected readonly newCycleStaff = signal<string>('Elena Petrova');
  protected readonly newCyclePassed = signal<boolean>(true);

  // Health & Contraindication State
  protected readonly healthAssessments = signal<NailHealthAssessment[]>([...DEMO_NAIL_HEALTH]);
  protected readonly showHealthModal = signal<boolean>(false);
  protected readonly healthCustomerName = signal<string>('');
  protected readonly healthThickness = signal<'normal' | 'thin' | 'very-thin' | 'damaged'>('thin');
  protected readonly healthHasOnycholysis = signal<boolean>(false);
  protected readonly healthHasFungal = signal<boolean>(false);
  protected readonly healthHasIngrown = signal<boolean>(false);
  protected readonly healthHasHemaAllergy = signal<boolean>(false);
  protected readonly healthHasRemovalDamage = signal<boolean>(true);
  protected readonly healthRecommendedTech = signal<string>('Rubber Base ile Koruyucu Güçlendirme');
  protected readonly healthCareNotes = signal<string>('');

  // Feedback Notification
  protected readonly notification = signal<string>('');

  // Computed properties for Customizer
  protected readonly currentShape = computed<NailShapeMeta>(
    () => this.shapes.find((s) => s.key === this.selectedShape()) ?? this.shapes[0],
  );

  protected readonly currentLength = computed<NailLengthMeta>(
    () => this.lengths.find((l) => l.key === this.selectedLength()) ?? this.lengths[2],
  );

  protected readonly currentTechnique = computed<NailTechnique>(
    () => this.techniques.find((t) => t.id === this.selectedTechniqueId()) ?? this.techniques[0],
  );

  protected readonly currentSwatch = computed<NailSwatch>(
    () => this.swatches().find((s) => s.id === this.selectedSwatchId()) ?? this.swatches()[0],
  );

  protected readonly currentArtTier = computed<NailArtTierMeta>(
    () => this.artTiers.find((a) => a.tier === this.selectedArtTier()) ?? this.artTiers[1],
  );

  protected readonly filteredSwatches = computed(() => {
    const category = this.selectedColorCategory();
    const query = this.swatchSearch().trim().toLowerCase();
    return this.swatches().filter((s) => {
      const matchCat = category === 'all' || s.category === category;
      const matchQuery =
        !query ||
        s.code.toLowerCase().includes(query) ||
        s.name.toLowerCase().includes(query) ||
        s.brand.toLowerCase().includes(query);
      return matchCat && matchQuery;
    });
  });

  // Financial & Duration Calculation
  protected readonly totalDurationMin = computed(() => {
    let duration = this.currentTechnique().durationMin;
    duration += this.currentLength().extraMinutes;
    duration += this.currentArtTier().extraMinutes;
    if (this.needsSafeRemoval()) {
      duration += 25; // 25 minutes safe de-application
    }
    return duration;
  });

  protected readonly totalPrice = computed(() => {
    let price = this.currentTechnique().basePrice;
    price += this.currentLength().surcharge;
    price += this.currentArtTier().surcharge;
    if (this.needsSafeRemoval()) {
      price += 250; // 250 TL removal fee
    }
    return price;
  });

  // Warranty Metrics
  protected readonly activeWarrantiesCount = computed(() => {
    return this.warranties().filter((w) => w.status === 'active').length;
  });

  protected readonly claimedRepairsCount = computed(() => {
    return this.warranties().filter((w) => w.status === 'claimed').length;
  });

  protected readonly filteredWarranties = computed(() => {
    const query = this.warrantySearch().trim().toLowerCase();
    const status = this.warrantyStatusFilter();
    return this.warranties().filter((w) => {
      const matchStatus = status === 'all' || w.status === status;
      const matchQuery =
        !query ||
        w.customerName.toLowerCase().includes(query) ||
        w.phone.includes(query) ||
        w.technique.toLowerCase().includes(query);
      return matchStatus && matchQuery;
    });
  });

  // Sterilization Metrics
  protected readonly todayCycleCount = computed(() => this.sterilizations().length);
  protected readonly totalSterilizedInstruments = computed(() =>
    this.sterilizations().reduce((acc, s) => acc + s.instrumentCount, 0),
  );

  // Tab switching
  protected setTab(tab: NailStudioTab): void {
    this.activeTab.set(tab);
    this.notification.set('');
  }

  // Customizer actions
  protected selectShape(shape: NailShape): void {
    this.selectedShape.set(shape);
  }

  protected selectLength(length: NailLength): void {
    this.selectedLength.set(length);
  }

  protected selectFinish(finish: NailFinish): void {
    this.selectedFinish.set(finish);
  }

  protected selectTechnique(techId: string): void {
    this.selectedTechniqueId.set(techId);
  }

  protected selectSwatch(swatch: NailSwatch): void {
    this.selectedSwatchId.set(swatch.id);
  }

  protected selectArtTier(tier: NailArtTier): void {
    this.selectedArtTier.set(tier);
  }

  protected toggleSafeRemoval(): void {
    this.needsSafeRemoval.update((v) => !v);
  }

  protected setFrenchColor(color: string): void {
    this.frenchColor.set(color);
  }

  protected bookThisDesign(): void {
    const designSummary = `${this.currentShape().nameTr} Form, ${this.currentLength().label}, ${this.currentSwatch().name} (${this.currentSwatch().code}), ${this.currentArtTier().label}`;
    this.showToast(`Tasarım özeti kaydedildi (${this.totalPrice()} ₺ - ${this.totalDurationMin()} dk). Randevu takvimine aktarılıyor…`);
    setTimeout(() => {
      void this.router.navigate(['/appointments'], {
        queryParams: {
          note: `Nail Studio Tasarımı: ${designSummary}`,
          service: this.currentTechnique().name,
          duration: this.totalDurationMin(),
          price: this.totalPrice(),
        },
      });
    }, 1200);
  }

  protected saveDesignToCustomer(): void {
    this.showToast(`"${this.currentSwatch().name}" tırnak tasarımı ve reçetesi müşteri kartına işlendi!`);
  }

  // Warranty & Repair actions
  protected openRepairDialog(record: NailWarrantyRecord): void {
    this.selectedWarrantyForRepair.set(record);
    this.repairFinger.set('right-middle');
    this.repairNotes.set('Serbest kenardan hafif darbe hasarı. Apex korundu.');
    this.isFreeUnderWarranty.set(record.status === 'active');
    this.showRepairModal.set(true);
  }

  protected closeRepairDialog(): void {
    this.showRepairModal.set(false);
    this.selectedWarrantyForRepair.set(null);
  }

  protected saveRepairClaim(): void {
    const target = this.selectedWarrantyForRepair();
    if (!target) return;

    this.warranties.update((list) =>
      list.map((item) =>
        item.id === target.id
          ? {
              ...item,
              status: 'claimed',
              claimedAt: new Date().toISOString().split('T')[0],
              damagedFinger: this.repairFinger(),
              repairNotes: this.repairNotes(),
              repairCompletedDate: new Date().toISOString().split('T')[0],
            }
          : item,
      ),
    );

    this.showRepairModal.set(false);
    this.showToast(
      `${target.customerName} için ${FINGER_LABELS[this.repairFinger()]} onarım işlemi başarıyla kaydedildi! (Garanti Kapsamında)`,
    );
  }

  protected getWarrantyDaysRemaining(expireDate: string): number {
    const expire = new Date(expireDate).getTime();
    const today = new Date().getTime();
    const diffDays = Math.ceil((expire - today) / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  }

  // Sterilization actions
  protected openSterilizationDialog(): void {
    this.newCyclePouchBarcode.set('POUCH-' + Math.floor(100000 + Math.random() * 900000));
    this.showSterilizationModal.set(true);
  }

  protected closeSterilizationDialog(): void {
    this.showSterilizationModal.set(false);
  }

  protected saveSterilizationCycle(): void {
    const newRecord: NailSterilizationRecord = {
      id: 'st-' + Date.now(),
      cycleNumber: `CYC-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-0${this.sterilizations().length + 1}`,
      autoclaveDeviceName: this.newCycleDevice(),
      sterilizedAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
      sterilizedByStaffName: this.newCycleStaff(),
      temperatureCelsius: this.newCycleTemp(),
      pressureBar: this.newCyclePressure(),
      holdTimeMinutes: this.newCycleHoldTime(),
      indicatorStripPassed: this.newCyclePassed(),
      batchPouchBarcode: this.newCyclePouchBarcode(),
      instrumentCount: this.newCyclePouchCount(),
      notes: 'B-Class vakumlu döngü başarıyla tamamlandı. Kimyasal şerit onaylandı.',
    };

    this.sterilizations.update((list) => [newRecord, ...list]);
    this.showSterilizationModal.set(false);
    this.showToast(`Yeni Otoklav Döngüsü (${newRecord.cycleNumber}) ve ${newRecord.instrumentCount} alet sterilizasyon kütüğüne kaydedildi.`);
  }

  // Health Assessment actions
  protected openHealthDialog(): void {
    this.healthCustomerName.set('');
    this.healthCareNotes.set('');
    this.showHealthModal.set(true);
  }

  protected closeHealthDialog(): void {
    this.showHealthModal.set(false);
  }

  protected saveHealthAssessment(): void {
    if (!this.healthCustomerName().trim()) return;

    const contraindications: string[] = [];
    if (this.healthHasHemaAllergy()) contraindications.push('HEMA-Free Jel ve Baz kullanılmalı');
    if (this.healthHasFungal()) contraindications.push('Mantar kuşkusu: Jel uygulaması ertelenmeli, dermatolog onayı şart');
    if (this.healthHasOnycholysis()) contraindications.push('Boşalan alan freze ile temizlenmeli, tırnak serbest kenarı kısaltılmalı');
    if (this.healthHasRemovalDamage()) contraindications.push('Asitsiz primer ve elastik rubber base uygulanmalı');

    const newAssessment: NailHealthAssessment = {
      customerId: 'cust-' + Date.now(),
      customerName: this.healthCustomerName().trim(),
      assessedAt: new Date().toISOString().split('T')[0],
      assessedByStaffName: 'Elena Petrova (Tırnak Uzmanı)',
      nailPlateThickness: this.healthThickness(),
      hasOnycholysis: this.healthHasOnycholysis(),
      hasFungalSuspicion: this.healthHasFungal(),
      hasIngrownNail: this.healthHasIngrown(),
      hasHemaAllergy: this.healthHasHemaAllergy(),
      hasMonomerSensitivity: false,
      hasRemovalDamage: this.healthHasRemovalDamage(),
      recommendedTechnique: this.healthRecommendedTech(),
      contraindications,
      carePlanNotes: this.healthCareNotes().trim() || 'Tırnak yapısına uygun koruyucu protokol başlatıldı.',
    };

    this.healthAssessments.update((list) => [newAssessment, ...list]);
    this.showHealthModal.set(false);
    this.showToast(`${newAssessment.customerName} için Tırnak Sağlık ve Kontrendikasyon kartı kaydedildi.`);
  }

  protected showToast(msg: string): void {
    this.notification.set(msg);
    setTimeout(() => {
      if (this.notification() === msg) {
        this.notification.set('');
      }
    }, 4000);
  }

  protected getFingerLabel(finger?: FingerKey): string {
    if (!finger) return 'Belirtilmedi';
    return FINGER_LABELS[finger] || finger;
  }
}
