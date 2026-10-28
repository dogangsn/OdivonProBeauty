import { Component, computed, inject, resource, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom, catchError, of } from 'rxjs';
import { ApiClient } from '../../../core/api-client';
import { BranchService } from '../../../core/branch.service';
import { DefinitionsService } from '../../../core/definitions/definitions.service';
import { DefinitionCategoryKey } from '../../../core/definitions/definitions.model';
import { EntityLookupService } from '../../../core/entity-lookup.service';
import {
  BeautyRecord,
  BranchRecord,
  WorkspaceColumn,
  WorkspaceDefinition,
  WorkspaceField,
} from '../../../core/beauty.model';
import { PageHeader } from '../../../shared/page-header/page-header';
import { SlideOver } from '../../../shared/slide-over/slide-over';
import { StatusBadge } from '../../../shared/status-badge/status-badge';
import { ServiceWizard, WizardCompletionResult } from '../../../shared/components/service-wizard/service-wizard';
import { CustomerDetailModal, DetailTab } from '../../../shared/components/customer-detail-modal/customer-detail-modal';
import { CustomerFormModal } from '../../../shared/components/customer-form-modal/customer-form-modal';
import { CustomerCombobox } from '../../../shared/components/customer-combobox/customer-combobox';
import {
  SearchableSelect,
  SearchableSelectOption,
} from '../../../shared/components/searchable-select/searchable-select';
import { CustomerConsultation, CustomerHealth, CustomerPackage, CustomerProfile, CustomerSessionItem, calculateAge } from '../../../core/customer/customer.model';
import { DEMO_CUSTOMERS } from '../../../core/customer/customer-demo-data';
import { DEMO_CONSULTATIONS } from '../../../core/customer/consultation-demo-data';
import { Skeleton } from '../../../shared/loader/skeleton';

export interface HealthDocumentAttachment {
  id: string;
  name: string;
  type: 'anamnesis' | 'doctor_approval' | 'allergy_report' | 'consent_scan' | 'skin_photo' | 'other';
  fileType: string;
  size: number;
  dataUrl: string;
  uploadedAt: string;
  notes?: string;
}

export interface ConsentTemplate {
  code: string;
  title: string;
  version: string;
  category: string;
  summary: string;
  body: string;
}

export const CONSENT_TEMPLATES: Record<string, ConsentTemplate> = {
  'kvkk-explicit-consent': {
    code: 'kvkk-explicit-consent',
    title: '6698 Sayılı KVKK Açık Rıza ve Aydınlatma Metni',
    version: 'v2.4 (2026)',
    category: 'Yasal Uyum',
    summary: 'Kişisel ve özel nitelikli sağlık verilerinin güzellik ve bakım hizmetleri kapsamında işlenmesine dair açık rıza beyanı.',
    body: `6698 sayılı Kişisel Verilerin Korunması Kanunu ("KVKK") uyarınca; OdivonPro Beauty güzellik merkezimiz tarafından sunulan seans, randevu, medikal bakım ve estetik hizmetleri kapsamında; kimlik (ad, soyad, TCKN), iletişim (telefon, e-posta, adres) ile özel nitelikli kişisel veri statüsündeki sağlık ve alerji beyanlarımın, cilt analizi ve seans öncesi/sonrası referans görsellerimin; hizmetin gereği gibi ifası, randevu hatırlatmaları, işlem güvenliği ve yasal yükümlülüklerin yerine getirilmesi amacıyla işlenmesine, güvenli sunucularda saklanmasına ve ilgili mevzuat uyarınca yetkili kamu kurum ve kuruluşları ile paylaşılmasına özgür irademle açık rıza veriyorum.`,
  },
  'laser-consent': {
    code: 'laser-consent',
    title: 'Lazer Epilasyon Bilgilendirilmiş Onam Formu',
    version: 'v3.1 (2026)',
    category: 'Lazer Uygulamaları',
    summary: 'Lazer epilasyon prosedürü, olası geçici reaksiyonlar, seans öncesi/sonrası dikkat edilecek hususlar ve danışan taahhüdü.',
    body: `Lazer epilasyon işlemi öncesinde tarafıma uzmanınca gerekli dermatolojik bilgilendirme yapılmış, cilt ve kıl kökü tipim (Fitzpatrick skalası) değerlendirilmiştir. Seans öncesinde güneşlenmemem, solaryuma girmemem, ağda/cımbız yapmamış olmam ve son 6 ayda Roaccutane/retinoid grubu ilaç kullanmamış olmam gerektiği anlatılmıştır. Uygulama sonrasında oluşabilecek geçici kızarıklık, hafif ödem ve kıl folikülü kabarmalarının normal olduğu; doğrudan güneşe maruz kalınmaması ve yüksek faktörlü güneş koruyucu kullanılması gerektiği belirtilmiştir. Hamilelik, metal implant veya aktif cilt lezyonum olmadığını, tarafıma iletilen tüm bakım talimatlarına uyacağımı beyan ve taahhüt ederim.`,
  },
  'treatment-consent': {
    code: 'treatment-consent',
    title: 'Medikal Cilt Bakımı & Peeling Onam Formu',
    version: 'v2.2 (2026)',
    category: 'Cilt Bakımı',
    summary: 'Cilt analizi, kimyasal peeling, derin gözenek temizliği ve serum infüzyon prosedürlerine ilişkin bilgilendirme.',
    body: `Merkezinizde uygulanacak derin cilt temizliği, hydrafacial, asit peeling, mikroiğneleme veya dermaterapi işlemleri hakkında uygulama yapacak uzman tarafından detaylı bilgi verilmiştir. Kullanılacak kozmesötik solüsyonlara karşı bilinen bir alerjim olmadığını; işlem sonrası ilk 24 saat sıcak su, sauna, yoğun makyaj ve direkt güneş ışığından kaçınmam gerektiği açıklanmıştır. Cilt bariyerinin yenilenme sürecinde nemlendirici ve güneş koruyucu kullanımının önemini anladığımı ve işlemi kendi rızamla onayladığımı beyan ederim.`,
  },
  'photo-consent': {
    code: 'photo-consent',
    title: 'Seans Öncesi / Sonrası Referans Görseli İzni',
    version: 'v1.8 (2026)',
    category: 'Görsel Kayıt',
    summary: 'Seans gelişim takibi için alınan klinik fotoğrafların dosyamda saklanması ve anonimleştirilerek paylaşımı izni.',
    body: `Uygulanan bakım ve seansların etkinliğini takip etmek amacıyla uygulama bölgesine ilişkin çekilen "öncesi / sonrası" fotoğrafların hasta dosyamda klinik arşiv olarak saklanmasına; yüzüm ve ayırt edici kişisel özelliklerim gizlenmek (anonimleştirilmek) suretiyle merkezin eğitim ve sosyal medya referans arşivinde kullanılmasına muvafakat ediyorum. (İstediğim an bu izni geri alma hakkım saklıdır.)`,
  },
  'marketing-consent': {
    code: 'marketing-consent',
    title: 'Ticari Elektronik İleti ve Pazarlama Onamı',
    version: 'v2.0 (2026)',
    category: 'Pazarlama & İletişim',
    summary: 'SMS, WhatsApp ve e-posta kanallarıyla randevu hatırlatma, kampanya ve özel indirim bildirimleri izni.',
    body: `OdivonPro Beauty tarafından sunulan yeni hizmetler, dönemsel indirimler, hediye seanslar ve randevu hatırlatmalarına ilişkin olarak tarafıma SMS, telefon araması, WhatsApp ve e-posta kanallarıyla ticari elektronik ileti gönderilmesini kabul ediyorum. Dilediğim zaman ücretsiz olarak bu iletileri reddetme hakkımın olduğunu biliyorum.`,
  },
};

export interface PackagePreset {
  id: string;
  name: string;
  category: string;
  totalSessions: number;
  sessionIntervalDays: number;
  validityMonths: number;
  price: number;
  icon: string;
  color: string;
  description: string;
}

export const PREDEFINED_PACKAGES: PackagePreset[] = [
  {
    id: 'buz-lazer-tum-vucut-8',
    name: 'Buz Lazer Epilasyon (Tüm Vücut)',
    category: 'Lazer Epilasyon',
    totalSessions: 8,
    sessionIntervalDays: 35,
    validityMonths: 12,
    price: 12000,
    icon: 'bolt',
    color: '#6366f1',
    description: 'Bacak, kol, genital ve koltuk altı dahil 8 seans hibrit diod lazer.',
  },
  {
    id: 'hydrafacial-medikal-cilt-6',
    name: 'Hydrafacial & Derin Cilt Bakımı',
    category: 'Medikal Cilt Bakımı',
    totalSessions: 6,
    sessionIntervalDays: 21,
    validityMonths: 6,
    price: 7500,
    icon: 'spa',
    color: '#10b981',
    description: 'Vakum ekstraksiyonu, hyalüronik asit infüzyonu ve LED terapi (6 seans).',
  },
  {
    id: 'g5-bolgesel-incelme-10',
    name: 'G5 Masajı & Pasif Jimnastik',
    category: 'Bölgesel İncelme',
    totalSessions: 10,
    sessionIntervalDays: 7,
    validityMonths: 4,
    price: 9000,
    icon: 'fitness_center',
    color: '#f59e0b',
    description: 'Selülit giderme, sıkılaşma ve lenfatik drenaj odaklı 10 seans kombine paket.',
  },
  {
    id: 'protez-tirnak-kalici-oje-5',
    name: 'Protez Tırnak & Jel Bakım Paketi',
    category: 'Tırnak & El-Ayak',
    totalSessions: 5,
    sessionIntervalDays: 25,
    validityMonths: 6,
    price: 4500,
    icon: 'palette',
    color: '#ec4899',
    description: 'Şablon jel uzatma, kalıcı oje ve medikal manikür periyodik bakımları (5 seans).',
  },
  {
    id: 'diod-ozel-bolge-6',
    name: 'Diod Lazer Koltuk Altı + Genital',
    category: 'Lazer Epilasyon',
    totalSessions: 6,
    sessionIntervalDays: 30,
    validityMonths: 8,
    price: 5500,
    icon: 'flash_on',
    color: '#8b5cf6',
    description: 'Hızlı ve acısız ütüleme başlıkla hassas bölgelere özel 6 seans paket.',
  },
  {
    id: 'spa-aromaterapi-masaj-4',
    name: 'Aromaterapi & Sıcak Taş Masajı',
    category: 'Spa & Masaj',
    totalSessions: 4,
    sessionIntervalDays: 14,
    validityMonths: 3,
    price: 4800,
    icon: 'self_improvement',
    color: '#06b6d4',
    description: 'Doğal aromatik yağlarla 60 dk tam vücut rahatlama ve kas gevşetme (4 seans).',
  },
];

export interface BodyZonePreset {
  code: string;
  name: string;
  icon: string;
}

export const COMMON_BODY_ZONES: BodyZonePreset[] = [
  { code: 'full-body', name: 'Tüm Vücut', icon: 'accessibility' },
  { code: 'full-leg', name: 'Tüm Bacak', icon: 'airline_seat_legroom_extra' },
  { code: 'bikini', name: 'Genital / Bikini', icon: 'shield_moon' },
  { code: 'underarm', name: 'Koltuk Altı', icon: 'dry_cleaning' },
  { code: 'full-face', name: 'Tüm Yüz', icon: 'face' },
  { code: 'full-arm', name: 'Tüm Kol', icon: 'front_hand' },
  { code: 'back', name: 'Sırt & Bel', icon: 'man' },
  { code: 'chest', name: 'Göğüs & Karın', icon: 'fitness_center' },
];

type DraftValue = string | number | boolean | unknown[] | Record<string, unknown> | HealthDocumentAttachment | null | undefined;
type Draft = Record<string, DraftValue>;

@Component({
  imports: [Skeleton, 
    CustomerCombobox,
    CustomerDetailModal,
    CustomerFormModal,
    DecimalPipe,
    PageHeader,
    SearchableSelect,
    ServiceWizard,
    SlideOver,
    StatusBadge,
  ],
  selector: 'app-workspace',
  styleUrl: './workspace.css',
  templateUrl: './workspace.html',
})
export class Workspace {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly api = inject(ApiClient);
  protected readonly branchService = inject(BranchService);
  protected readonly definitions = inject(DefinitionsService);
  protected readonly entityLookup = inject(EntityLookupService);
  protected readonly definition = this.route.snapshot.data['definition'] as WorkspaceDefinition;
  protected readonly search = signal('');
  protected readonly statusFilter = signal('');
  protected readonly branchFilter = signal('');
  protected readonly drawerOpen = signal(false);
  protected readonly wizardOpen = signal(false);
  protected readonly editingId = signal<string | null>(null);
  protected readonly saving = signal(false);
  protected readonly deletingId = signal<string | null>(null);
  protected readonly feedback = signal('');
  protected readonly draft = signal<Draft>({});

  protected readonly isServiceWorkspace = computed(
    () => this.definition.resource === 'services' || this.definition.resource === 'service-categories',
  );
  protected readonly isCustomerWorkspace = computed(
    () => this.definition.resource === 'customers',
  );
  protected readonly isConsultationWorkspace = computed(
    () => this.definition.resource === 'consultations',
  );
  protected readonly isWaitlistWorkspace = computed(
    () => this.definition.resource === 'waitlist',
  );
  protected readonly isHealthWorkspace = computed(
    () => this.definition.resource === 'health',
  );
  protected readonly isConsentWorkspace = computed(
    () => this.definition.resource === 'consents',
  );
  protected readonly isPackageWorkspace = computed(
    () => this.definition.resource === 'customer-packages',
  );
  protected readonly isSessionWorkspace = computed(
    () => this.definition.resource === 'sessions',
  );

  protected readonly allCustomers = computed<BeautyRecord[]>(() => {
    return this.entityLookup.getRecords('customers');
  });

  protected readonly allServices = computed<BeautyRecord[]>(() => {
    return this.entityLookup.getRecords('services');
  });

  protected readonly allStaff = computed<BeautyRecord[]>(() => {
    return this.entityLookup.getRecords('staff');
  });

  protected readonly waitlistServiceOptions = computed<SearchableSelectOption[]>(() => {
    return this.allServices().map((s) => {
      const duration = typeof s['durationMin'] === 'number' ? `${s['durationMin']} dk` : '';
      const price = typeof s['price'] === 'number' ? `₺${s['price']}` : '';
      const badge = [duration, price].filter(Boolean).join(' · ');
      return {
        value: s.id,
        label: String(s['name'] || s.id),
        badge: badge || undefined,
        icon: 'spa',
        raw: s,
      };
    });
  });

  protected readonly waitlistStaffOptions = computed<SearchableSelectOption[]>(() => {
    const list: SearchableSelectOption[] = [
      {
        value: '',
        label: 'Fark Etmez / İlk Müsait Uzman',
        icon: 'group',
        badge: 'Esnek',
      },
    ];
    for (const stf of this.allStaff()) {
      const name = String(stf['fullName'] || stf['name'] || stf.id);
      const role = String(stf['role'] || '');
      const parts = name.split(/\s+/).filter(Boolean);
      const initials =
        parts.length >= 2
          ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
          : name.slice(0, 2).toUpperCase();
      list.push({
        value: stf.id,
        label: name,
        badge: role ? `[${role}]` : undefined,
        icon: 'badge',
        avatarText: initials,
        raw: stf,
      });
    }
    return list;
  });

  protected readonly waitlistBranchOptions = computed<SearchableSelectOption[]>(() => {
    return (this.branches.value() ?? []).map((b) => ({
      value: b.id,
      label: b.name,
      icon: 'store',
      raw: b,
    }));
  });

  protected readonly waitlistSelectedCustomer = computed(() => {
    const id = String(this.fieldValue('customerId') || '');
    if (!id) return null;
    return this.allCustomers().find((c) => c.id === id) ?? null;
  });

  protected readonly waitlistSelectedService = computed(() => {
    const id = String(this.fieldValue('serviceId') || '');
    if (!id) return null;
    return this.allServices().find((s) => s.id === id) ?? null;
  });

  protected readonly waitlistSelectedStaff = computed(() => {
    const id = String(this.fieldValue('preferredStaffId') || '');
    if (!id) return null;
    return this.allStaff().find((s) => s.id === id) ?? null;
  });

  protected readonly selectedCustomer = signal<CustomerProfile | null>(null);
  protected readonly customerDetailOpen = signal<boolean>(false);
  protected readonly customerDetailInitialTab = signal<DetailTab>('overview');
  protected readonly customerFormOpen = signal<boolean>(false);
  protected readonly seedingDemoCustomers = signal<boolean>(false);
  protected readonly seedingDemoConsultations = signal<boolean>(false);

  protected readonly healthDocuments = signal<HealthDocumentAttachment[]>([]);
  protected readonly pendingDocType = signal<HealthDocumentAttachment['type']>('anamnesis');
  protected readonly previewingDocument = signal<HealthDocumentAttachment | null>(null);

  protected readonly fitzpatrickTypes = [
    { value: 'tip-1', label: 'Tip I (Çok Açık - Kolay Yanar, Asla Bronzlaşmaz)', color: '#fed7aa', textColor: '#9a3412' },
    { value: 'tip-2', label: 'Tip II (Açık - Kolay Yanar, Zor Bronzlaşır)', color: '#fef08a', textColor: '#854d0e' },
    { value: 'tip-3', label: 'Tip III (Buğday / Orta - Bazen Yanar, Yavaş Bronzlaşır)', color: '#fde047', textColor: '#713f12' },
    { value: 'tip-4', label: 'Tip IV (Koyu Buğday / Esmer - Nadiren Yanar, Kolay Bronzlaşır)', color: '#d97706', textColor: '#ffffff' },
    { value: 'tip-5', label: 'Tip V (Koyu Esmer - Çok Nadir Yanar, Çok Koyu Bronzlaşır)', color: '#92400e', textColor: '#ffffff' },
    { value: 'tip-6', label: 'Tip VI (Siyah - Asla Yanmaz)', color: '#451a03', textColor: '#ffffff' },
  ] as const;

  protected readonly healthDocumentTypes: { type: HealthDocumentAttachment['type']; label: string; icon: string }[] = [
    { type: 'anamnesis', label: 'Anamnez / Sağlık Beyanı', icon: 'description' },
    { type: 'doctor_approval', label: 'Doktor Onayı / Rapor', icon: 'medical_services' },
    { type: 'allergy_report', label: 'Laboratuvar / Alerji Testi', icon: 'biotech' },
    { type: 'consent_scan', label: 'İmzalı Onam Formu', icon: 'draw' },
    { type: 'skin_photo', label: 'Cilt / Bölge Görseli', icon: 'photo_camera' },
    { type: 'other', label: 'Diğer Tıbbi Belge', icon: 'folder' },
  ];

  protected readonly healthSelectedCustomer = computed(() => {
    const id = String(this.fieldValue('customerId') || '');
    if (!id) return null;
    return this.allCustomers().find((c) => c.id === id) ?? null;
  });

  protected readonly highRiskHealthCount = computed(() => {
    return this.rows().filter((r) => r['contraindicationRisk'] === 'high').length;
  });

  protected readonly specialConditionHealthCount = computed(() => {
    return this.rows().filter(
      (r) =>
        Boolean(r['isPregnant']) ||
        Boolean(r['isNursing']) ||
        Boolean(r['hasImplant']) ||
        Boolean(r['isRoaccutane']) ||
        r['contraindicationRisk'] === 'medium',
    ).length;
  });

  protected readonly totalHealthDocumentsCount = computed(() => {
    return this.rows().reduce((sum, r) => {
      const docs = r['documents'];
      return sum + (Array.isArray(docs) ? docs.length : 0);
    }, 0);
  });

  protected readonly consentTemplates = CONSENT_TEMPLATES;
  protected readonly signatureDataUrl = signal<string>('');
  protected readonly scannedConsentDoc = signal<HealthDocumentAttachment | null>(null);
  protected readonly templateExpanded = signal<boolean>(false);
  protected readonly smsVerified = signal<boolean>(false);
  protected readonly smsCodeSent = signal<boolean>(false);
  protected readonly smsInputCode = signal<string>('');
  protected readonly todayIso = new Date().toISOString().slice(0, 10);

  protected readonly consentTypeOptions = [
    { code: 'kvkk-explicit-consent', label: 'KVKK Açık Rıza', icon: 'gavel', color: '#6366f1' },
    { code: 'laser-consent', label: 'Lazer Epilasyon', icon: 'bolt', color: '#8b5cf6' },
    { code: 'treatment-consent', label: 'Cilt Bakımı & Peeling', icon: 'spa', color: '#10b981' },
    { code: 'photo-consent', label: 'Görsel / Fotoğraf İzni', icon: 'photo_camera', color: '#ec4899' },
    { code: 'marketing-consent', label: 'Ticari İleti & SMS', icon: 'chat', color: '#06b6d4' },
  ] as const;

  protected readonly signatureMethodOptions = [
    { value: 'digital_screen', label: 'Ekranda E-İmza', icon: 'draw', desc: 'Danışan ekranda parmakla veya fareyle imzalar' },
    { value: 'physical_scan', label: 'Islak İmzalı Belge', icon: 'upload_file', desc: 'İmzalı kağıt formun fotoğrafını / PDF yükleyin' },
    { value: 'sms_otp', label: 'SMS Onay Kodu', icon: 'sms', desc: 'Danışanın cep telefonuna 6 haneli onay kodu gönderin' },
  ] as const;

  protected readonly consentSelectedCustomer = computed(() => {
    const id = String(this.fieldValue('customerId') || '');
    if (!id) return null;
    return this.allCustomers().find((c) => c.id === id) ?? null;
  });

  protected readonly selectedConsentTemplate = computed<ConsentTemplate>(() => {
    const type = String(this.fieldValue('consentType') || 'kvkk-explicit-consent');
    return CONSENT_TEMPLATES[type] || CONSENT_TEMPLATES['kvkk-explicit-consent'];
  });

  protected readonly validSignedConsentCount = computed(() => {
    return this.rows().filter((r) => r.status === 'signed' || r.status === 'completed' || r.status === 'active').length;
  });

  protected readonly pendingConsentCount = computed(() => {
    return this.rows().filter((r) => r.status === 'pending' || r.status === 'draft' || r.status === 'waiting').length;
  });

  protected readonly laserTreatmentConsentCount = computed(() => {
    return this.rows().filter(
      (r) => r['consentType'] === 'laser-consent' || r['consentType'] === 'treatment-consent',
    ).length;
  });

  protected readonly digitalSignatureCount = computed(() => {
    return this.rows().filter(
      (r) => r['signatureMethod'] === 'digital_screen' || Boolean(r['signatureImage']),
    ).length;
  });

  protected readonly packagePresets = PREDEFINED_PACKAGES;
  protected readonly selectedPackagePresetId = signal<string>('');

  protected readonly packageSelectedCustomer = computed(() => {
    const id = String(this.fieldValue('customerId') || '');
    if (!id) return null;
    return this.allCustomers().find((c) => c.id === id) ?? null;
  });

  protected readonly packageSelectedCustomerPackagesCount = computed(() => {
    const cust = this.packageSelectedCustomer() as unknown as CustomerProfile;
    if (!cust || !Array.isArray(cust.packages)) return 0;
    return cust.packages.filter((p) => p.status === 'active').length;
  });

  protected readonly packageSelectedStaff = computed(() => {
    const id = String(this.fieldValue('staffId') || '');
    if (!id) return null;
    return this.allStaff().find((s) => s.id === id) ?? null;
  });

  protected readonly packageCatalogOptions = computed<SearchableSelectOption[]>(() => {
    const records = this.entityLookup.getRecords('packages');
    const options: SearchableSelectOption[] = [
      {
        value: '',
        label: 'Özel / Şablon Seçilmedi',
        icon: 'edit_note',
        badge: 'Manuel Giriş',
      },
    ];
    for (const pkg of records) {
      const name = String(pkg['name'] || pkg.id);
      const sessions = pkg['totalSessions'] ? `${pkg['totalSessions']} Seans` : '';
      const price = pkg['price'] ? `₺${pkg['price']}` : '';
      const badge = [sessions, price].filter(Boolean).join(' · ');
      options.push({
        value: pkg.id,
        label: name,
        badge: badge || undefined,
        icon: 'inventory_2',
        raw: pkg,
      });
    }
    return options;
  });

  protected readonly packageStaffOptions = computed<SearchableSelectOption[]>(() => {
    const list: SearchableSelectOption[] = [
      {
        value: '',
        label: 'Belirtilmedi / Genel Satış',
        icon: 'person_outline',
      },
    ];
    for (const stf of this.allStaff()) {
      const name = String(stf['fullName'] || stf['name'] || stf.id);
      const role = String(stf['role'] || '');
      list.push({
        value: stf.id,
        label: name,
        badge: role || undefined,
        icon: 'badge',
        raw: stf,
      });
    }
    return list;
  });

  protected readonly totalPackageSalesCount = computed(() => this.rows().length);
  protected readonly activePackageCount = computed(
    () => this.rows().filter((r) => r.status === 'active').length,
  );
  protected readonly totalRemainingSessionsCount = computed(() =>
    this.rows().reduce((acc, r) => acc + (Number(r['remainingSessions']) || 0), 0),
  );
  protected readonly totalPackageRevenue = computed(() =>
    this.rows().reduce((acc, r) => acc + (Number(r['price']) || 0), 0),
  );

  protected readonly commonBodyZones = COMMON_BODY_ZONES;

  protected readonly allDevices = computed<BeautyRecord[]>(() => {
    return this.entityLookup.getRecords('devices');
  });

  protected readonly allRooms = computed<BeautyRecord[]>(() => {
    return this.entityLookup.getRecords('rooms');
  });

  protected readonly sessionCustomerRecord = signal<BeautyRecord | null>(null);

  protected readonly sessionSelectedCustomer = computed(() => {
    const direct = this.sessionCustomerRecord();
    const id = String(this.fieldValue('customerId') || '');
    if (direct && direct.id === id) return direct;
    if (!id) return null;
    return this.allCustomers().find((c) => c.id === id) ?? null;
  });

  protected readonly sessionCustomerPackages = computed<CustomerPackage[]>(() => {
    const cust = this.sessionSelectedCustomer() as unknown as CustomerProfile;
    if (!cust || !Array.isArray(cust.packages)) return [];
    return cust.packages;
  });

  protected readonly sessionSelectedPackage = computed<CustomerPackage | null>(() => {
    const pkgId = String(this.fieldValue('customerPackageId') || '');
    if (!pkgId) return null;
    return this.sessionCustomerPackages().find((p) => p.id === pkgId) ?? null;
  });

  protected readonly sessionCustomerHealthAlert = computed<string | null>(() => {
    const cust = this.sessionSelectedCustomer() as unknown as CustomerProfile;
    if (!cust || !cust.health) return null;
    const h = cust.health;
    const alerts: string[] = [];
    if (h.fitzpatrick) alerts.push(`Fitzpatrick ${h.fitzpatrick.toUpperCase()}`);
    if (h.allergies) alerts.push(`Alerji: ${h.allergies}`);
    if (h.isPregnant) alerts.push('Hamilelik');
    if (h.isNursing) alerts.push('Emzirme');
    if (h.hasImplant) alerts.push('İmplant/Platin');
    if ((h as any).isRoaccutane) alerts.push('Roaccutane');
    if ((h as any).isBloodThinner) alerts.push('Kan Sulandırıcı');
    if (h.healthNotes) alerts.push(h.healthNotes);
    return alerts.length > 0 ? alerts.join(' · ') : null;
  });

  protected readonly sessionDeviceOptions = computed<SearchableSelectOption[]>(() => {
    const list: SearchableSelectOption[] = [
      {
        value: '',
        label: 'Cihaz Seçilmedi / Manuel Uygulama',
        icon: 'devices',
      },
    ];
    for (const d of this.allDevices()) {
      const name = String(d['name'] || d.id);
      const brand = d['brand'] || d['model'] ? `${d['brand'] || ''} ${d['model'] || ''}`.trim() : '';
      list.push({
        value: d.id,
        label: name,
        badge: brand || undefined,
        icon: 'precision_manufacturing',
        raw: d,
      });
    }
    return list;
  });

  protected readonly sessionRoomOptions = computed<SearchableSelectOption[]>(() => {
    const list: SearchableSelectOption[] = [
      {
        value: '',
        label: 'Oda Belirtilmedi',
        icon: 'meeting_room',
      },
    ];
    for (const r of this.allRooms()) {
      const name = String(r['name'] || r.id);
      const type = String(r['roomType'] || '');
      list.push({
        value: r.id,
        label: name,
        badge: type || undefined,
        icon: 'door_front',
        raw: r,
      });
    }
    return list;
  });

  protected readonly sessionServiceOptions = computed<SearchableSelectOption[]>(() => {
    const list: SearchableSelectOption[] = [
      {
        value: '',
        label: 'Genel / Paket Kapsamında',
        icon: 'spa',
      },
    ];
    for (const s of this.allServices()) {
      const name = String(s['name'] || s.id);
      const cat = String(s['category'] || '');
      list.push({
        value: s.id,
        label: name,
        badge: cat || undefined,
        icon: 'check_circle',
        raw: s,
      });
    }
    return list;
  });

  protected readonly sessionStaffOptions = computed<SearchableSelectOption[]>(() => {
    const list: SearchableSelectOption[] = [
      {
        value: '',
        label: 'Uzman Seçilmedi',
        icon: 'person_outline',
      },
    ];
    for (const stf of this.allStaff()) {
      const name = String(stf['fullName'] || stf['name'] || stf.id);
      const role = String(stf['role'] || '');
      list.push({
        value: stf.id,
        label: name,
        badge: role || undefined,
        icon: 'badge',
        raw: stf,
      });
    }
    return list;
  });

  protected readonly totalSessionsCount = computed(() => this.rows().length);
  protected readonly todaySessionsCount = computed(() => {
    const today = this.todayIso;
    return this.rows().filter((r) => String(r['performedAt'] || '').startsWith(today)).length;
  });
  protected readonly completedSessionsCount = computed(() => {
    return this.rows().filter((r) => r.status === 'completed' || r.status === 'done').length;
  });
  protected readonly averageSessionDuration = computed(() => {
    const list = this.rows().filter(
      (r) => typeof r['durationMin'] === 'number' && (r['durationMin'] as number) > 0,
    );
    if (list.length === 0) return 30;
    const sum = list.reduce((acc, r) => acc + (r['durationMin'] as number), 0);
    return Math.round(sum / list.length);
  });

  protected readonly branches = resource({
    loader: async () => this.branchService.ensureBranches(),
  });
  protected readonly remote = resource({
    params: () => ({ resource: this.definition.resource, branchId: this.branchFilter() }),
    loader: async ({ params }) => {
      if (params.resource === 'reports/dashboard') {
        const response = await firstValueFrom(
          this.api.request<Record<string, unknown>>('GET', 'beauty/reports/dashboard'),
        );
        return Object.entries(response.data).map(([key, value]): BeautyRecord => ({
          id: key,
          name: this.metricLabel(key),
          value,
          status: 'ready',
        }));
      }

      if (params.resource === 'consultations') {
        const [cnsRes, custRes] = await Promise.all([
          firstValueFrom(
            this.api.list<BeautyRecord>('consultations', {
              branchId: params.branchId || undefined,
              limit: 100,
            }),
          ).catch(() => ({ data: [] })),
          firstValueFrom(
            this.api.list<CustomerProfile>('customers', {
              branchId: params.branchId || undefined,
              limit: 100,
            }),
          ).catch(() => ({ data: [] })),
        ]);

        const records: BeautyRecord[] = [...cnsRes.data];
        const existingIds = new Set(records.map((r) => r.id));

        for (const cust of custRes.data) {
          if (Array.isArray(cust.consultations) && cust.consultations.length > 0) {
            for (const c of cust.consultations) {
              if (!existingIds.has(c.id)) {
                records.push({
                  id: c.id,
                  customerId: cust.id,
                  customerName: c.customerName || cust.fullName,
                  phone: c.phone || cust.phone,
                  email: c.email || cust.email || '',
                  serviceCategory: c.serviceCategory,
                  inquiredSession: c.inquiredSession,
                  targetSessionsCount: c.targetSessionsCount,
                  quotedPrice: c.quotedPrice,
                  consultantStaffName: c.consultantStaffName || '',
                  consultationDate: c.consultationDate,
                  nextFollowUpDate: c.nextFollowUpDate || '',
                  interestLevel: c.interestLevel || 'high',
                  channel: c.channel || 'Yüz Yüze',
                  status: c.status || 'inquiry',
                  notes: c.notes || '',
                  branchId: cust.branchId,
                  createdAt: c.consultationDate || cust.createdAt,
                });
                existingIds.add(c.id);
              }
            }
          } else if ((cust.segment === 'lead' || cust.segment === 'aday') && !existingIds.has(cust.id)) {
            records.push({
              id: cust.id,
              customerId: cust.id,
              customerName: cust.fullName,
              phone: cust.phone,
              email: cust.email || '',
              serviceCategory: 'Genel Danışmanlık',
              inquiredSession: cust.notes || 'Hizmet Bilgisi Talebi',
              targetSessionsCount: 1,
              quotedPrice: 0,
              consultantStaffName: cust.preferredStaffName || '',
              consultationDate: cust.createdAt ? cust.createdAt.split('T')[0] : new Date().toISOString().split('T')[0],
              nextFollowUpDate: '',
              interestLevel: 'high',
              channel: cust.referralSource || 'Yüz Yüze',
              status: cust.status === 'active' ? 'inquiry' : cust.status,
              notes: cust.notes || '',
              branchId: cust.branchId,
            });
            existingIds.add(cust.id);
          }
        }
        return records;
      }

      if (params.resource === 'customer-packages') {
        const [pkgRes, custRes] = await Promise.all([
          firstValueFrom(
            this.api.list<BeautyRecord>('customer-packages', {
              branchId: params.branchId || undefined,
              limit: 100,
            }),
          ).catch(() => ({ data: [] })),
          firstValueFrom(
            this.api.list<CustomerProfile>('customers', {
              branchId: params.branchId || undefined,
              limit: 100,
            }),
          ).catch(() => ({ data: [] })),
        ]);

        const records: BeautyRecord[] = [...pkgRes.data];
        const existingIds = new Set(records.map((r) => r.id));

        for (const cust of custRes.data) {
          if (Array.isArray(cust.packages) && cust.packages.length > 0) {
            for (const p of cust.packages) {
              if (!existingIds.has(p.id)) {
                records.push({
                  id: p.id,
                  customerId: cust.id,
                  customerName: cust.fullName,
                  phone: cust.phone,
                  packageName: p.packageName,
                  packageCatalogId: (p as any).packageCatalogId,
                  totalSessions: p.totalSessions,
                  remainingSessions: p.remainingSessions,
                  usedSessions: p.completedSessions ?? (p.totalSessions - p.remainingSessions),
                  sessionIntervalDays: (p as any).sessionIntervalDays || 21,
                  price: (p as any).price || 0,
                  paidAmount: (p as any).paidAmount ?? (p as any).price ?? 0,
                  paymentStatus: (p as any).paymentStatus || 'paid',
                  paymentMethod: (p as any).paymentMethod || 'credit_card',
                  staffId: (p as any).staffId || '',
                  soldByStaffName: (p as any).soldByStaffName || '',
                  startDate: p.startDate || new Date().toISOString().slice(0, 10),
                  expiresAt: (p as any).expiresAt || '',
                  status: p.status || 'active',
                  notes: (p as any).notes || '',
                  branchId: cust.branchId,
                  createdAt: (p as any).createdAt || new Date().toISOString(),
                });
                existingIds.add(p.id);
              }
            }
          }
        }
        return records;
      }

      if (params.resource === 'sessions') {
        const [sesRes, custRes] = await Promise.all([
          firstValueFrom(
            this.api.list<BeautyRecord>('sessions', {
              branchId: params.branchId || undefined,
              limit: 100,
            }),
          ).catch(() => ({ data: [] })),
          firstValueFrom(
            this.api.list<CustomerProfile>('customers', {
              branchId: params.branchId || undefined,
              limit: 100,
            }),
          ).catch(() => ({ data: [] })),
        ]);

        const records: BeautyRecord[] = [...sesRes.data];
        const existingIds = new Set(records.map((r) => r.id));

        for (const cust of custRes.data) {
          if (Array.isArray(cust.packages)) {
            for (const p of cust.packages) {
              if (Array.isArray(p.sessions)) {
                for (const s of p.sessions) {
                  const sId = (s as any).id || `${p.id}_s_${s.sessionNo}`;
                  if (!existingIds.has(sId)) {
                    records.push({
                      id: sId,
                      customerId: cust.id,
                      customerName: cust.fullName,
                      phone: cust.phone,
                      customerPackageId: p.id,
                      packageName: p.packageName,
                      sessionNumber: s.sessionNo,
                      performedAt: s.date,
                      deviceId: (s as any).deviceId || '',
                      staffId: (s as any).staffId || '',
                      staffName: s.staffName || '',
                      bodyZone: s.zone || 'Tüm Vücut',
                      energyJcm2: (s as any).energyJ || 18,
                      shotCount: (s as any).shots || 2500,
                      durationMin: (s as any).durationMin || 30,
                      status: s.status || 'completed',
                      notes: s.notes || '',
                      branchId: cust.branchId,
                    });
                    existingIds.add(sId);
                  }
                }
              }
            }
          }
        }
        return records;
      }

      return (
        await firstValueFrom(
          this.api.list<BeautyRecord>(params.resource, {
            branchId: params.branchId || undefined,
            limit: 100,
          }),
        )
      ).data;
    },
  });
  protected readonly page = signal<number>(1);
  protected readonly pageSize = signal<number>(10);

  protected readonly rows = computed(() => {
    const query = this.search().trim().toLocaleLowerCase('tr');
    const status = this.statusFilter();
    return (this.remote.value() ?? []).filter((row) => {
      const matchesQuery = !query || JSON.stringify(row).toLocaleLowerCase('tr').includes(query);
      const matchesStatus = !status || row.status === status;
      return matchesQuery && matchesStatus;
    });
  });

  protected readonly totalRows = computed(() => this.rows().length);
  protected readonly totalPages = computed(() =>
    Math.max(1, Math.ceil(this.totalRows() / this.pageSize())),
  );
  protected readonly paginatedRows = computed(() => {
    const p = Math.min(Math.max(1, this.page()), this.totalPages());
    const size = this.pageSize();
    const start = (p - 1) * size;
    return this.rows().slice(start, start + size);
  });
  protected readonly paginationRangeText = computed(() => {
    const total = this.totalRows();
    if (total === 0) return '0 kayıt';
    const p = Math.min(Math.max(1, this.page()), this.totalPages());
    const size = this.pageSize();
    const start = (p - 1) * size + 1;
    const end = Math.min(start + size - 1, total);
    return `${start} - ${end} / ${total} kayıt`;
  });
  protected readonly pagesList = computed<number[]>(() => {
    const total = this.totalPages();
    const current = Math.min(Math.max(1, this.page()), total);
    const delta = 2;
    const pages: number[] = [];
    for (let i = Math.max(1, current - delta); i <= Math.min(total, current + delta); i++) {
      pages.push(i);
    }
    return pages;
  });

  protected setPage(p: number): void {
    const target = Math.min(Math.max(1, p), this.totalPages());
    this.page.set(target);
  }

  protected nextPage(): void {
    if (this.page() < this.totalPages()) {
      this.page.update((p) => p + 1);
    }
  }

  protected prevPage(): void {
    if (this.page() > 1) {
      this.page.update((p) => p - 1);
    }
  }

  protected onPageSizeChange(event: Event): void {
    const size = Number((event.target as HTMLSelectElement).value) || 10;
    this.pageSize.set(size);
    this.page.set(1);
  }

  protected readonly hotLeadsCount = computed(() => {
    return this.rows().filter((r) => r['interestLevel'] === 'high').length;
  });
  protected readonly totalQuotedPrice = computed(() => {
    return this.rows().reduce((sum, r) => sum + (Number(r['quotedPrice']) || 0), 0);
  });
  protected readonly convertedConsultationCount = computed(() => {
    return this.rows().filter((r) => r.status === 'converted').length;
  });
  protected readonly complete = computed(() => {
    if (this.isHealthWorkspace() || this.isConsentWorkspace()) {
      return Boolean(this.fieldValue('customerId'));
    }
    if (this.isPackageWorkspace()) {
      return (
        Boolean(this.fieldValue('customerId')) &&
        Boolean(String(this.fieldValue('packageName') || '').trim()) &&
        Number(this.fieldValue('totalSessions')) > 0
      );
    }
    if (this.isSessionWorkspace()) {
      return (
        Boolean(this.fieldValue('customerId')) &&
        Number(this.fieldValue('sessionNumber')) > 0 &&
        Boolean(String(this.fieldValue('bodyZone') || '').trim())
      );
    }
    return (this.definition.fields ?? [])
      .filter((field) => field.required)
      .every((field) => {
        const value = this.draft()[field.key];
        if (typeof value === 'number') {
          return Number.isFinite(value) && (field.min === undefined || value >= field.min);
        }
        return String(value ?? '').trim() !== '';
      });
  });

  constructor() {
    this.preloadLookups();
    if (this.route.snapshot.queryParamMap.get('create') === '1') {
      this.openCreate();
    }
    if (this.route.snapshot.queryParamMap.get('wizard') === '1' && this.isServiceWorkspace()) {
      this.openWizard();
    }
  }

  protected openWizard(): void {
    this.wizardOpen.set(true);
  }

  protected closeWizard(): void {
    this.wizardOpen.set(false);
  }

  protected onWizardCompleted(result: WizardCompletionResult): void {
    this.wizardOpen.set(false);
    this.feedback.set(
      `${result.createdCategoriesCount} kategori ve ${result.createdServicesCount} hazır hizmet başarıyla tanımlandı.`,
    );
    this.remote.reload();
  }

  private preloadLookups(): void {
    void this.definitions.syncRemote();

    if (
      this.isWaitlistWorkspace() ||
      this.isHealthWorkspace() ||
      this.isConsentWorkspace() ||
      this.isPackageWorkspace() ||
      this.isSessionWorkspace()
    ) {
      void this.entityLookup.ensure('customers');
      void this.entityLookup.ensure('services');
      void this.entityLookup.ensure('staff');
      void this.entityLookup.ensure('packages');
      void this.entityLookup.ensure('devices');
      void this.entityLookup.ensure('rooms');
    }

    const needed = new Set<string>();
    for (const field of this.definition.fields ?? []) {
      if (field.lookup && this.entityLookup.isEntityResource(field.lookup)) {
        needed.add(field.lookup);
      }
    }
    for (const col of this.definition.columns ?? []) {
      const inferred = this.inferEntityFromColumn(col.key);
      if (inferred) needed.add(inferred);
    }
    for (const entity of needed) {
      void this.entityLookup.ensure(entity);
    }
  }

  protected optionsForField(field: WorkspaceField): readonly { label: string; value: string }[] {
    if (field.lookup) {
      if (this.entityLookup.isEntityResource(field.lookup)) {
        return this.entityLookup.getOptions(field.lookup);
      }
      return this.definitions.getOptions(field.lookup as DefinitionCategoryKey);
    }
    return field.options ?? [];
  }

  protected updateSearch(event: Event): void {
    this.search.set((event.target as HTMLInputElement).value);
    this.page.set(1);
  }

  protected updateFilter(target: 'branch' | 'status', event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    target === 'branch' ? this.branchFilter.set(value) : this.statusFilter.set(value);
    this.page.set(1);
  }

  protected openCustomerDetail(row: BeautyRecord): void {
    if (!this.isCustomerWorkspace()) return;
    this.selectedCustomer.set(row as unknown as CustomerProfile);
    this.customerDetailInitialTab.set('overview');
    this.customerDetailOpen.set(true);
  }

  protected closeCustomerDetail(): void {
    this.customerDetailOpen.set(false);
    this.selectedCustomer.set(null);
  }

  protected onCustomerUpdated(_updated: CustomerProfile): void {
    this.remote.reload();
  }

  protected openCustomerCreateModal(): void {
    this.customerFormOpen.set(true);
  }

  protected closeCustomerCreateModal(): void {
    this.customerFormOpen.set(false);
  }

  protected onCustomerCreated(): void {
    this.customerFormOpen.set(false);
    this.feedback.set('Yeni müşteri başarıyla eklendi.');
    this.remote.reload();
    void this.entityLookup.refresh('customers');
  }

  protected async seedDemoCustomers(): Promise<void> {
    if (this.seedingDemoCustomers()) return;
    this.seedingDemoCustomers.set(true);
    this.feedback.set('10 örnek müşteri yükleniyor…');
    try {
      const availableBranches = this.branches.value() ?? this.branchService.branches();
      const branchId = this.branchService.activeBranchId() || availableBranches[0]?.id;

      for (const demoCust of DEMO_CUSTOMERS) {
        const { id, ...data } = demoCust;
        await firstValueFrom(
          this.api.create<CustomerProfile>('customers', {
            branchId,
            data,
          }),
        );
      }
      this.feedback.set(
        '10 Örnek Müşteri başarıyla yüklendi! Kimlik, sağlık, cüzdan ve seans detaylarıyla test edebilirsiniz.',
      );
      this.remote.reload();
    } catch (err) {
      console.error('Failed to seed demo customers:', err);
      this.feedback.set('Örnek müşteriler yüklenirken bir hata oluştu.');
    } finally {
      this.seedingDemoCustomers.set(false);
    }
  }

  protected asCustomer(row: BeautyRecord): CustomerProfile {
    return row as unknown as CustomerProfile;
  }

  protected computeCustomerAge(birthDate?: string): number | null {
    return calculateAge(birthDate);
  }

  protected asNumber(value: unknown): number {
    return typeof value === 'number' ? value : Number(value) || 0;
  }

  protected asString(value: unknown): string {
    return typeof value === 'string' ? value : String(value ?? '');
  }

  protected openCreate(): void {
    if (this.isCustomerWorkspace()) {
      this.openCustomerCreateModal();
      return;
    }
    if (this.isConsultationWorkspace()) {
      void this.entityLookup.ensure('customers');
      void this.entityLookup.ensure('services');
      void this.entityLookup.ensure('staff');
      const draft = this.emptyDraft();
      const now = new Date();
      const followUp = new Date(now);
      followUp.setDate(followUp.getDate() + 3);
      draft['consultationDate'] = this.toLocalDateString(now);
      draft['nextFollowUpDate'] = this.toLocalDateString(followUp);
      draft['interestLevel'] = 'high';
      draft['channel'] = 'Yüz Yüze';
      draft['status'] = 'inquiry';
      draft['serviceCategory'] = 'Lazer Epilasyon';
      draft['targetSessionsCount'] = 8;
      draft['quotedPrice'] = 0;
      const availableBranches = this.branches.value() ?? this.branchService.branches();
      draft['branchId'] =
        this.branchFilter() || this.branchService.activeBranchId() || (availableBranches[0]?.id ?? '');
      this.editingId.set(null);
      this.draft.set(draft);
      this.feedback.set('');
      this.drawerOpen.set(true);
      return;
    }
    if (this.isWaitlistWorkspace()) {
      void this.entityLookup.ensure('customers');
      void this.entityLookup.ensure('services');
      void this.entityLookup.ensure('staff');
      const draft = this.emptyDraft();
      draft['priority'] = 'normal';
      draft['status'] = 'pending';
      draft['timeSlot'] = 'any';
      const now = new Date();
      now.setHours(9, 0, 0, 0);
      const end = new Date(now);
      end.setDate(end.getDate() + 3);
      end.setHours(19, 0, 0, 0);
      draft['preferredFrom'] = this.toLocalDatetimeString(now);
      draft['preferredTo'] = this.toLocalDatetimeString(end);
      this.editingId.set(null);
      this.draft.set(draft);
      this.feedback.set('');
      this.drawerOpen.set(true);
      return;
    }
    if (this.isHealthWorkspace()) {
      void this.entityLookup.ensure('customers');
      const draft = this.emptyDraft();
      draft['contraindicationRisk'] = 'low';
      draft['skinType'] = 'normal';
      draft['fitzpatrick'] = 'tip-3';
      draft['bloodType'] = 'Bilinmiyor';
      draft['allergies'] = '';
      draft['chronicConditions'] = '';
      draft['medications'] = '';
      draft['isPregnant'] = false;
      draft['isNursing'] = false;
      draft['hasImplant'] = false;
      draft['isBloodThinner'] = false;
      draft['isRoaccutane'] = false;
      draft['isKeloid'] = false;
      draft['notes'] = '';
      const availableBranches = this.branches.value() ?? this.branchService.branches();
      draft['branchId'] =
        this.branchFilter() || this.branchService.activeBranchId() || (availableBranches[0]?.id ?? '');
      this.healthDocuments.set([]);
      this.editingId.set(null);
      this.draft.set(draft);
      this.feedback.set('');
      this.drawerOpen.set(true);
      return;
    }
    if (this.isConsentWorkspace()) {
      void this.entityLookup.ensure('customers');
      const draft = this.emptyDraft();
      draft['consentType'] = 'kvkk-explicit-consent';
      draft['signatureMethod'] = 'digital_screen';
      draft['documentVersion'] = 'v2.4 (2026)';
      draft['status'] = 'signed';
      draft['signedAt'] = new Date().toISOString();
      draft['notes'] = '';
      draft['confirmOralExplanation'] = true;
      draft['confirmTruthfulness'] = true;
      draft['confirmReadAndAgreed'] = true;
      const availableBranches = this.branches.value() ?? this.branchService.branches();
      draft['branchId'] =
        this.branchFilter() || this.branchService.activeBranchId() || (availableBranches[0]?.id ?? '');
      this.signatureDataUrl.set('');
      this.scannedConsentDoc.set(null);
      this.smsVerified.set(false);
      this.smsCodeSent.set(false);
      this.smsInputCode.set('');
      this.templateExpanded.set(false);
      this.editingId.set(null);
      this.draft.set(draft);
      this.feedback.set('');
      this.drawerOpen.set(true);
      return;
    }
    if (this.isPackageWorkspace()) {
      void this.entityLookup.ensure('customers');
      void this.entityLookup.ensure('services');
      void this.entityLookup.ensure('staff');
      void this.entityLookup.ensure('packages');
      const draft = this.emptyDraft();
      draft['startDate'] = this.todayIso;
      const defaultExp = new Date();
      defaultExp.setMonth(defaultExp.getMonth() + 6);
      draft['expiresAt'] = this.toLocalDateString(defaultExp);
      draft['totalSessions'] = 6;
      draft['remainingSessions'] = 6;
      draft['sessionIntervalDays'] = 21;
      draft['price'] = 5000;
      draft['paidAmount'] = 5000;
      draft['paymentStatus'] = 'paid';
      draft['paymentMethod'] = 'credit_card';
      draft['status'] = 'active';
      draft['packageName'] = '';
      draft['maxFreezeDays'] = 30;
      draft['notes'] = '';
      const availableBranches = this.branches.value() ?? this.branchService.branches();
      draft['branchId'] =
        this.branchFilter() || this.branchService.activeBranchId() || (availableBranches[0]?.id ?? '');
      this.selectedPackagePresetId.set('');
      this.editingId.set(null);
      this.draft.set(draft);
      this.feedback.set('');
      this.drawerOpen.set(true);
      return;
    }
    if (this.isSessionWorkspace()) {
      void this.entityLookup.ensure('customers');
      void this.entityLookup.ensure('devices');
      void this.entityLookup.ensure('rooms');
      void this.entityLookup.ensure('services');
      void this.entityLookup.ensure('staff');
      const draft = this.emptyDraft();
      draft['performedAt'] = this.toLocalDatetimeString(new Date());
      draft['sessionNumber'] = 1;
      draft['bodyZone'] = 'Tüm Vücut';
      draft['energyJcm2'] = 18;
      draft['shotCount'] = 2500;
      draft['durationMin'] = 30;
      draft['frequencyHz'] = 10;
      draft['coolingApplied'] = true;
      draft['reaction'] = 'normal';
      draft['skinReactionRating'] = 2;
      draft['status'] = 'completed';
      const nextDate = new Date();
      nextDate.setDate(nextDate.getDate() + 21);
      draft['nextSessionDate'] = this.toLocalDateString(nextDate);
      draft['notes'] = '';
      const availableBranches = this.branches.value() ?? this.branchService.branches();
      draft['branchId'] =
        this.branchFilter() || this.branchService.activeBranchId() || (availableBranches[0]?.id ?? '');
      this.sessionCustomerRecord.set(null);
      this.editingId.set(null);
      this.draft.set(draft);
      this.feedback.set('');
      this.drawerOpen.set(true);
      return;
    }
    this.editingId.set(null);
    this.draft.set(this.emptyDraft());
    this.feedback.set('');
    this.drawerOpen.set(true);
  }

  protected setDraftValue(key: string, value: DraftValue): void {
    this.draft.update((curr) => ({ ...curr, [key]: value }));
  }

  protected onWaitlistCustomerChange(customerId: string): void {
    this.setDraftValue('customerId', customerId);
    const found = this.allCustomers().find((c) => c.id === customerId);
    if (found && found['preferredStaffId'] && !this.fieldValue('preferredStaffId')) {
      this.setDraftValue('preferredStaffId', String(found['preferredStaffId']));
    }
  }

  protected onWaitlistCustomerSelected(rec: BeautyRecord | null): void {
    if (rec && rec['preferredStaffId'] && !this.fieldValue('preferredStaffId')) {
      this.setDraftValue('preferredStaffId', String(rec['preferredStaffId']));
    }
  }

  protected onConsultationCustomerSelected(rec: BeautyRecord | null): void {
    if (rec) {
      this.setDraftValue('customerId', rec.id);
      this.setDraftValue('customerName', String(rec['fullName'] || rec['name'] || ''));
      if (rec['phone']) this.setDraftValue('phone', String(rec['phone']));
      if (rec['email']) this.setDraftValue('email', String(rec['email']));
      if (rec['preferredStaffName'] && !this.fieldValue('consultantStaffName')) {
        this.setDraftValue('consultantStaffName', String(rec['preferredStaffName']));
      }
    }
  }

  protected onHealthCustomerSelected(rec: BeautyRecord | null): void {
    if (rec) {
      this.setDraftValue('customerId', rec.id);
      this.setDraftValue('customerName', String(rec['fullName'] || rec['name'] || ''));

      const cust = rec as unknown as CustomerProfile;
      if (cust.health) {
        const h = cust.health;
        if (h.skinType) {
          this.setDraftValue('skinType', h.skinType);
        }
        if (h.fitzpatrick) {
          this.setDraftValue('fitzpatrick', h.fitzpatrick);
        }
        if (h.allergies) {
          this.setDraftValue('allergies', h.allergies);
        }
        if (h.chronicDiseases) {
          this.setDraftValue('chronicConditions', h.chronicDiseases);
        }
        if (h.medications) {
          this.setDraftValue('medications', h.medications);
        }
        if (h.isPregnant !== undefined) {
          this.setDraftValue('isPregnant', Boolean(h.isPregnant));
        }
        if (h.isNursing !== undefined) {
          this.setDraftValue('isNursing', Boolean(h.isNursing));
        }
        if (h.hasImplant !== undefined) {
          this.setDraftValue('hasImplant', Boolean(h.hasImplant));
        }
        if (h.bloodType) {
          this.setDraftValue('bloodType', h.bloodType);
        }
        if (h.healthNotes) {
          this.setDraftValue('notes', h.healthNotes);
        }
      }
    }
  }

  protected async onHealthFilesSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const files = Array.from(input.files);
    const newAttachments: HealthDocumentAttachment[] = [];

    for (const file of files) {
      if (file.size > 10 * 1024 * 1024) {
        this.feedback.set(`"${file.name}" dosyası 10 MB sınırını aşıyor.`);
        continue;
      }

      try {
        const dataUrl = await this.readFileAsDataUrl(file);
        const docId = 'doc_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 6);
        newAttachments.push({
          id: docId,
          name: file.name,
          type: this.pendingDocType(),
          fileType: file.type || 'application/octet-stream',
          size: file.size,
          dataUrl,
          uploadedAt: new Date().toISOString(),
        });
      } catch (err) {
        console.error('File read error:', err);
      }
    }

    if (newAttachments.length > 0) {
      this.healthDocuments.update((current) => [...current, ...newAttachments]);
      this.setDraftValue('documents', this.healthDocuments());
      this.feedback.set(`${newAttachments.length} döküman başarıyla eklendi.`);
    }

    input.value = '';
  }

  private readFileAsDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
    });
  }

  protected removeHealthDocument(docId: string): void {
    this.healthDocuments.update((docs) => docs.filter((d) => d.id !== docId));
    this.setDraftValue('documents', this.healthDocuments());
  }

  protected updateHealthDocumentType(docId: string, type: HealthDocumentAttachment['type']): void {
    this.healthDocuments.update((docs) =>
      docs.map((d) => (d.id === docId ? { ...d, type } : d)),
    );
    this.setDraftValue('documents', this.healthDocuments());
  }

  protected previewHealthDocument(doc: HealthDocumentAttachment): void {
    this.previewingDocument.set(doc);
  }

  protected closeDocumentPreview(): void {
    this.previewingDocument.set(null);
  }

  protected formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  protected getDocumentTypeLabel(type: string): string {
    const item = this.healthDocumentTypes.find((t) => t.type === type);
    return item ? item.label : type;
  }

  protected getDocumentTypeIcon(type: string): string {
    const item = this.healthDocumentTypes.find((t) => t.type === type);
    return item ? item.icon : 'attachment';
  }

  protected isImageDocument(doc: HealthDocumentAttachment): boolean {
    return doc.fileType.startsWith('image/') || doc.dataUrl.startsWith('data:image/');
  }

  protected isPdfDocument(doc: HealthDocumentAttachment): boolean {
    return doc.fileType === 'application/pdf' || doc.dataUrl.startsWith('data:application/pdf');
  }

  // --- Consent & KVKK Methods ---
  private isCanvasDrawing = false;
  private canvasLastX = 0;
  private canvasLastY = 0;

  protected onConsentCustomerSelected(rec: BeautyRecord | null): void {
    if (rec) {
      this.setDraftValue('customerId', rec.id);
      this.setDraftValue('customerName', String(rec['fullName'] || rec['name'] || ''));
      if (rec['phone']) this.setDraftValue('phone', String(rec['phone']));
      if (rec['identityNumber']) this.setDraftValue('identityNumber', String(rec['identityNumber']));
    }
  }

  protected onConsentTypeChange(type: string): void {
    this.setDraftValue('consentType', type);
    const tmpl = CONSENT_TEMPLATES[type];
    if (tmpl) {
      this.setDraftValue('documentVersion', tmpl.version);
    }
  }

  protected toggleTemplateExpanded(): void {
    this.templateExpanded.update((v) => !v);
  }

  protected startDrawing(event: MouseEvent): void {
    const canvas = event.target as HTMLCanvasElement;
    const rect = canvas.getBoundingClientRect();
    this.isCanvasDrawing = true;
    this.canvasLastX = event.clientX - rect.left;
    this.canvasLastY = event.clientY - rect.top;
  }

  protected draw(event: MouseEvent): void {
    if (!this.isCanvasDrawing) return;
    const canvas = event.target as HTMLCanvasElement;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const currentX = event.clientX - rect.left;
    const currentY = event.clientY - rect.top;

    ctx.strokeStyle = '#4338ca'; // indigo-700
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.beginPath();
    ctx.moveTo(this.canvasLastX, this.canvasLastY);
    ctx.lineTo(currentX, currentY);
    ctx.stroke();

    this.canvasLastX = currentX;
    this.canvasLastY = currentY;
    this.signatureDataUrl.set(canvas.toDataURL('image/png'));
  }

  protected startTouchDrawing(event: TouchEvent): void {
    event.preventDefault();
    const touch = event.touches[0];
    const canvas = event.target as HTMLCanvasElement;
    const rect = canvas.getBoundingClientRect();
    this.isCanvasDrawing = true;
    this.canvasLastX = touch.clientX - rect.left;
    this.canvasLastY = touch.clientY - rect.top;
  }

  protected touchDraw(event: TouchEvent): void {
    if (!this.isCanvasDrawing) return;
    event.preventDefault();
    const touch = event.touches[0];
    const canvas = event.target as HTMLCanvasElement;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const currentX = touch.clientX - rect.left;
    const currentY = touch.clientY - rect.top;

    ctx.strokeStyle = '#4338ca';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.beginPath();
    ctx.moveTo(this.canvasLastX, this.canvasLastY);
    ctx.lineTo(currentX, currentY);
    ctx.stroke();

    this.canvasLastX = currentX;
    this.canvasLastY = currentY;
    this.signatureDataUrl.set(canvas.toDataURL('image/png'));
  }

  protected stopDrawing(): void {
    this.isCanvasDrawing = false;
  }

  protected clearSignature(): void {
    this.signatureDataUrl.set('');
    const canvas = document.querySelector('canvas.cursor-crosshair') as HTMLCanvasElement | null;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }

  protected async onScannedConsentDocSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;
    const file = input.files[0];
    if (file.size > 10 * 1024 * 1024) {
      this.feedback.set('Dosya boyutu 10 MB sınırını aşıyor.');
      return;
    }
    try {
      const dataUrl = await this.readFileAsDataUrl(file);
      this.scannedConsentDoc.set({
        id: 'scan_' + Date.now().toString(36),
        name: file.name,
        type: 'consent_scan',
        size: file.size,
        dataUrl,
        fileType: file.type || 'application/octet-stream',
        uploadedAt: new Date().toISOString(),
      });
      this.feedback.set('İmzalı belge başarıyla eklendi.');
    } catch {
      this.feedback.set('Dosya okunurken bir hata oluştu.');
    }
    input.value = '';
  }

  protected removeScannedConsentDoc(): void {
    this.scannedConsentDoc.set(null);
  }

  protected sendConsentSmsCode(): void {
    const cust = this.consentSelectedCustomer();
    const phone = cust?.['phone'] || this.fieldValue('phone');
    if (!phone) {
      this.feedback.set('SMS göndermek için müşteri telefon numarası bulunamadı.');
      return;
    }
    this.smsCodeSent.set(true);
    this.smsInputCode.set('482915');
    this.feedback.set(`${phone} numarasına 6 haneli onay kodu gönderildi.`);
  }

  protected verifyConsentSmsCode(): void {
    if (this.smsInputCode().trim().length >= 4) {
      this.smsVerified.set(true);
      this.setDraftValue('status', 'signed');
      this.feedback.set('SMS doğrulama kodu başarıyla onaylandı.');
    } else {
      this.feedback.set('Geçerli bir onay kodu girin.');
    }
  }

  protected getConsentTypeLabel(type: string): string {
    const tmpl = CONSENT_TEMPLATES[type];
    return tmpl ? tmpl.title : type;
  }

  protected onConsultationQuickServicePick(srv: BeautyRecord): void {
    this.setDraftValue('inquiredSession', String(srv['name'] || ''));
    if (srv['category']) {
      this.setDraftValue('serviceCategory', String(srv['category']));
    }
    if (typeof srv['price'] === 'number' && !this.fieldValue('quotedPrice')) {
      this.setDraftValue('quotedPrice', srv['price']);
    }
  }

  protected onConsultationStaffChange(staffIdOrName: string): void {
    const staff = this.allStaff().find(
      (s) => s.id === staffIdOrName || s['name'] === staffIdOrName || s['fullName'] === staffIdOrName,
    );
    const name = staff ? String(staff['fullName'] || staff['name'] || '') : staffIdOrName;
    this.setDraftValue('consultantStaffName', name);
  }

  protected setConsultationFollowUpQuickDays(days: number): void {
    const target = new Date();
    target.setDate(target.getDate() + days);
    this.setDraftValue('nextFollowUpDate', this.toLocalDateString(target));
  }

  protected setWaitlistQuickDate(type: 'today' | 'tomorrow' | 'weekend' | 'nextWeek'): void {
    const now = new Date();
    let start = new Date(now);
    let end = new Date(now);

    switch (type) {
      case 'today':
        start.setHours(9, 0, 0, 0);
        end.setHours(19, 0, 0, 0);
        break;
      case 'tomorrow':
        start.setDate(start.getDate() + 1);
        start.setHours(9, 0, 0, 0);
        end = new Date(start);
        end.setHours(19, 0, 0, 0);
        break;
      case 'weekend': {
        const day = start.getDay();
        const daysToSaturday = (6 - day + 7) % 7 || 7;
        start.setDate(start.getDate() + daysToSaturday);
        start.setHours(9, 0, 0, 0);
        end = new Date(start);
        end.setDate(start.getDate() + 1);
        end.setHours(19, 0, 0, 0);
        break;
      }
      case 'nextWeek':
        start.setDate(start.getDate() + 7);
        start.setHours(9, 0, 0, 0);
        end = new Date(start);
        end.setDate(start.getDate() + 5);
        end.setHours(19, 0, 0, 0);
        break;
    }

    this.draft.update((curr) => ({
      ...curr,
      preferredFrom: this.toLocalDatetimeString(start),
      preferredTo: this.toLocalDatetimeString(end),
    }));
  }

  protected setWaitlistTimeSlot(slot: string): void {
    this.setDraftValue('timeSlot', slot);
  }

  protected setWaitlistPriority(priority: string): void {
    this.setDraftValue('priority', priority);
  }

  // --- Customer Package Methods ---
  protected onPackageCustomerSelected(rec: BeautyRecord | null): void {
    if (rec) {
      this.setDraftValue('customerId', rec.id);
      this.setDraftValue('customerName', String(rec['fullName'] || rec['name'] || ''));
      if (rec['phone']) this.setDraftValue('phone', String(rec['phone']));
      if (rec['preferredStaffId'] && !this.fieldValue('staffId')) {
        this.setDraftValue('staffId', String(rec['preferredStaffId']));
        const staff = this.allStaff().find((s) => s.id === rec['preferredStaffId']);
        if (staff) {
          this.setDraftValue('soldByStaffName', String(staff['fullName'] || staff['name'] || ''));
        }
      }
    }
  }

  protected applyPackagePreset(preset: PackagePreset): void {
    this.selectedPackagePresetId.set(preset.id);
    this.setDraftValue('packageName', preset.name);
    this.setDraftValue('totalSessions', preset.totalSessions);
    this.setDraftValue('remainingSessions', preset.totalSessions);
    this.setDraftValue('sessionIntervalDays', preset.sessionIntervalDays);
    this.setDraftValue('price', preset.price);
    this.setDraftValue('paidAmount', preset.price);
    this.setDraftValue('paymentStatus', 'paid');
    this.setDraftValue('paymentMethod', 'credit_card');
    this.setDraftValue('notes', preset.description);
    this.setDraftValue('maxFreezeDays', 30);

    const start = String(this.fieldValue('startDate') || this.todayIso);
    this.setDraftValue('startDate', start);
    this.calculatePackageExpiryDate(start, preset.validityMonths);
  }

  protected onPackageCatalogSelect(selection: SearchableSelectOption | string | null): void {
    const catalogId = typeof selection === 'string' ? selection : (selection?.value || '');
    this.setDraftValue('packageId', catalogId);
    if (!catalogId) return;
    const records = this.entityLookup.getRecords('packages');
    const pkg = records.find((p) => p.id === catalogId);
    if (pkg) {
      this.selectedPackagePresetId.set('');
      if (pkg['name']) this.setDraftValue('packageName', String(pkg['name']));
      if (pkg['totalSessions']) {
        const total = Number(pkg['totalSessions']);
        this.setDraftValue('totalSessions', total);
        this.setDraftValue('remainingSessions', total);
      }
      if (pkg['price']) {
        const price = Number(pkg['price']);
        this.setDraftValue('price', price);
        this.setDraftValue('paidAmount', price);
        this.setDraftValue('paymentStatus', 'paid');
      }
      const days = Number(pkg['validityDays']) || 180;
      const start = String(this.fieldValue('startDate') || this.todayIso);
      const d = new Date(start);
      d.setDate(d.getDate() + days);
      this.setDraftValue('expiresAt', this.toLocalDateString(d));
    }
  }

  protected calculatePackageExpiryDate(startDateStr: string, monthsToAdd: number): void {
    const base = startDateStr ? new Date(startDateStr) : new Date();
    base.setMonth(base.getMonth() + monthsToAdd);
    this.setDraftValue('expiresAt', this.toLocalDateString(base));
  }

  protected onPackageQuickExpiry(months: number): void {
    const start = String(this.fieldValue('startDate') || this.todayIso);
    this.calculatePackageExpiryDate(start, months);
  }

  protected onPackageStaffSelect(selection: SearchableSelectOption | string | null): void {
    const staffId = typeof selection === 'string' ? selection : (selection?.value || '');
    this.setDraftValue('staffId', staffId);
    const staff = this.allStaff().find((s) => s.id === staffId);
    if (staff) {
      this.setDraftValue('soldByStaffName', String(staff['fullName'] || staff['name'] || ''));
    } else {
      this.setDraftValue('soldByStaffName', '');
    }
  }

  protected computePackageUnitPrice(): number {
    const price = Number(this.fieldValue('price')) || 0;
    const totalSessions = Number(this.fieldValue('totalSessions')) || 1;
    if (totalSessions <= 0) return 0;
    return Math.round(price / totalSessions);
  }

  protected computePackageRemainingDebt(): number {
    const price = Number(this.fieldValue('price')) || 0;
    const paid = Number(this.fieldValue('paidAmount')) || 0;
    return Math.max(0, price - paid);
  }

  protected computePackageTotal(): number {
    return Number(this.fieldValue('price')) || 0;
  }

  protected computePackagePaid(): number {
    return Number(this.fieldValue('paidAmount')) || 0;
  }

  protected onPackagePaidAmountChange(paid: number): void {
    this.setDraftValue('paidAmount', paid);
    const price = Number(this.fieldValue('price')) || 0;
    if (paid >= price && price > 0) {
      this.setDraftValue('paymentStatus', 'paid');
    } else if (paid > 0 && paid < price) {
      this.setDraftValue('paymentStatus', 'partial');
    } else {
      this.setDraftValue('paymentStatus', 'unpaid');
    }
  }

  // --- Customer Session Methods ---
  protected onSessionCustomerSelected(rec: BeautyRecord | null): void {
    this.sessionCustomerRecord.set(rec);
    if (rec) {
      this.setDraftValue('customerId', rec.id);
      this.setDraftValue('customerName', String(rec['fullName'] || rec['name'] || ''));
      if (rec['phone']) this.setDraftValue('phone', String(rec['phone']));

      const cust = rec as unknown as CustomerProfile;
      if (Array.isArray(cust.packages) && cust.packages.length > 0) {
        const activePkg = cust.packages.find((p) => p.status === 'active') || cust.packages[0];
        if (activePkg) {
          this.onSessionPackageSelect(activePkg.id);
        }
      }

      if (rec['preferredStaffId'] && !this.fieldValue('staffId')) {
        this.setDraftValue('staffId', String(rec['preferredStaffId']));
        const staff = this.allStaff().find((s) => s.id === rec['preferredStaffId']);
        if (staff) {
          this.setDraftValue('staffName', String(staff['fullName'] || staff['name'] || ''));
        }
      }
    }
  }

  protected onSessionPackageSelect(pkgId: string): void {
    this.setDraftValue('customerPackageId', pkgId);
    if (!pkgId) {
      this.setDraftValue('packageName', '');
      return;
    }
    const pkg = this.sessionCustomerPackages().find((p) => p.id === pkgId);
    if (pkg) {
      this.setDraftValue('packageName', pkg.packageName);
      const nextNo = (pkg.completedSessions || 0) + 1;
      this.setDraftValue('sessionNumber', nextNo);

      if (!this.fieldValue('bodyZone') || this.fieldValue('bodyZone') === 'Tüm Vücut') {
        const lower = pkg.packageName.toLowerCase();
        if (lower.includes('lazer') && lower.includes('vücut')) {
          this.setDraftValue('bodyZone', 'Tüm Vücut');
        } else if (lower.includes('cilt') || lower.includes('facial')) {
          this.setDraftValue('bodyZone', 'Tüm Yüz');
        } else if (lower.includes('bacak')) {
          this.setDraftValue('bodyZone', 'Tüm Bacak');
        } else if (lower.includes('genital') || lower.includes('özel bölge') || lower.includes('bikini')) {
          this.setDraftValue('bodyZone', 'Genital / Bikini');
        } else if (lower.includes('g5') || lower.includes('incelme')) {
          this.setDraftValue('bodyZone', 'Göğüs & Karın');
        }
      }
    }
  }

  protected onSessionBodyZoneSelect(zone: string): void {
    this.setDraftValue('bodyZone', zone);
  }

  protected onSessionDeviceSelect(selection: SearchableSelectOption | string | null): void {
    const deviceId = typeof selection === 'string' ? selection : (selection?.value || '');
    this.setDraftValue('deviceId', deviceId);
  }

  protected onSessionStaffSelect(selection: SearchableSelectOption | string | null): void {
    const staffId = typeof selection === 'string' ? selection : (selection?.value || '');
    this.setDraftValue('staffId', staffId);
    const staff = this.allStaff().find((s) => s.id === staffId);
    if (staff) {
      this.setDraftValue('staffName', String(staff['fullName'] || staff['name'] || ''));
    } else {
      this.setDraftValue('staffName', '');
    }
  }

  protected onSessionRoomSelect(selection: SearchableSelectOption | string | null): void {
    const roomId = typeof selection === 'string' ? selection : (selection?.value || '');
    this.setDraftValue('roomId', roomId);
  }

  protected onSessionServiceSelect(selection: SearchableSelectOption | string | null): void {
    const serviceId = typeof selection === 'string' ? selection : (selection?.value || '');
    this.setDraftValue('serviceId', serviceId);
    const srv = this.allServices().find((s) => s.id === serviceId);
    if (srv && !this.fieldValue('packageName')) {
      this.setDraftValue('packageName', String(srv['name'] || ''));
    }
  }

  protected adjustSessionEnergy(delta: number): void {
    const current = Number(this.fieldValue('energyJcm2')) || 18;
    const next = Math.max(0, Math.round((current + delta) * 10) / 10);
    this.setDraftValue('energyJcm2', next);
  }

  protected adjustSessionShots(delta: number): void {
    const current = Number(this.fieldValue('shotCount')) || 0;
    const next = Math.max(0, current + delta);
    this.setDraftValue('shotCount', next);
  }

  protected adjustSessionDuration(delta: number): void {
    const current = Number(this.fieldValue('durationMin')) || 30;
    const next = Math.max(5, current + delta);
    this.setDraftValue('durationMin', next);
  }

  protected onSessionQuickNextDate(days: number): void {
    const base = new Date();
    base.setDate(base.getDate() + days);
    this.setDraftValue('nextSessionDate', this.toLocalDateString(base));
  }

  protected toLocalDateString(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  protected toLocalDatetimeString(date: Date): string {
    const offset = date.getTimezoneOffset() * 60_000;
    return new Date(date.getTime() - offset).toISOString().slice(0, 16);
  }

  protected openEdit(row: BeautyRecord): void {
    if (this.isHealthWorkspace()) {
      void this.entityLookup.ensure('customers');
      const next = this.emptyDraft();
      const docs = Array.isArray(row['documents']) ? (row['documents'] as HealthDocumentAttachment[]) : [];
      this.healthDocuments.set([...docs]);
      next['documents'] = [...docs];

      for (const boolKey of ['isPregnant', 'isNursing', 'hasImplant', 'isBloodThinner', 'isRoaccutane', 'isKeloid']) {
        next[boolKey] = Boolean(row[boolKey]);
      }
      for (const strKey of [
        'customerId',
        'customerName',
        'skinType',
        'fitzpatrick',
        'bloodType',
        'contraindicationRisk',
        'allergies',
        'chronicConditions',
        'medications',
        'notes',
        'branchId',
      ]) {
        if (row[strKey] !== undefined) {
          next[strKey] = String(row[strKey] ?? '');
        }
      }
      this.editingId.set(row.id);
      this.draft.set(next);
      this.feedback.set('');
      this.drawerOpen.set(true);
      return;
    }

    if (this.isConsentWorkspace()) {
      void this.entityLookup.ensure('customers');
      const next = this.emptyDraft();
      for (const strKey of [
        'customerId',
        'customerName',
        'phone',
        'identityNumber',
        'consentType',
        'signatureMethod',
        'documentVersion',
        'signedAt',
        'status',
        'notes',
        'branchId',
        'signatureImage',
      ]) {
        if (row[strKey] !== undefined) {
          next[strKey] = String(row[strKey] ?? '');
        }
      }
      for (const boolKey of ['confirmOralExplanation', 'confirmTruthfulness', 'confirmReadAndAgreed']) {
        next[boolKey] = Boolean(row[boolKey] ?? true);
      }
      if (typeof row['signatureImage'] === 'string' && row['signatureImage']) {
        this.signatureDataUrl.set(row['signatureImage']);
      } else {
        this.signatureDataUrl.set('');
      }
      if (row['scannedDocument'] && typeof row['scannedDocument'] === 'object') {
        this.scannedConsentDoc.set(row['scannedDocument'] as any);
      } else {
        this.scannedConsentDoc.set(null);
      }
      this.editingId.set(row.id);
      this.draft.set(next);
      this.feedback.set('');
      this.drawerOpen.set(true);
      return;
    }

    if (this.isPackageWorkspace()) {
      void this.entityLookup.ensure('customers');
      void this.entityLookup.ensure('services');
      void this.entityLookup.ensure('staff');
      void this.entityLookup.ensure('packages');
      const next = this.emptyDraft();
      for (const strKey of [
        'customerId',
        'customerName',
        'packageId',
        'packageName',
        'startDate',
        'expiresAt',
        'paymentStatus',
        'paymentMethod',
        'staffId',
        'soldByStaffName',
        'status',
        'notes',
        'branchId',
      ]) {
        if (row[strKey] !== undefined) {
          next[strKey] = String(row[strKey] ?? '');
        }
      }
      for (const numKey of [
        'totalSessions',
        'remainingSessions',
        'usedSessions',
        'sessionIntervalDays',
        'price',
        'paidAmount',
        'maxFreezeDays',
      ]) {
        if (row[numKey] !== undefined) {
          next[numKey] = Number(row[numKey]);
        }
      }
      const matchedPreset = this.packagePresets.find(
        (p) => p.name.toLowerCase() === String(next['packageName'] || '').toLowerCase(),
      );
      this.selectedPackagePresetId.set(matchedPreset?.id || '');
      this.editingId.set(row.id);
      this.draft.set(next);
      this.feedback.set('');
      this.drawerOpen.set(true);
      return;
    }

    if (this.isSessionWorkspace()) {
      void this.entityLookup.ensure('customers');
      void this.entityLookup.ensure('services');
      void this.entityLookup.ensure('staff');
      void this.entityLookup.ensure('packages');
      void this.entityLookup.ensure('devices');
      void this.entityLookup.ensure('rooms');
      const next = this.emptyDraft();
      for (const strKey of [
        'customerId',
        'customerName',
        'phone',
        'customerPackageId',
        'packageName',
        'serviceId',
        'performedAt',
        'deviceId',
        'staffId',
        'staffName',
        'roomId',
        'bodyZone',
        'reaction',
        'nextSessionDate',
        'status',
        'notes',
        'branchId',
      ]) {
        if (row[strKey] !== undefined) {
          next[strKey] = String(row[strKey] ?? '');
        }
      }
      for (const numKey of [
        'sessionNumber',
        'energyJcm2',
        'durationMin',
        'shotCount',
        'frequencyHz',
        'skinReactionRating',
      ]) {
        if (row[numKey] !== undefined) {
          next[numKey] = Number(row[numKey]);
        }
      }
      if (row['coolingApplied'] !== undefined) {
        next['coolingApplied'] = Boolean(row['coolingApplied']);
      }
      this.sessionCustomerRecord.set(null);
      this.editingId.set(row.id);
      this.draft.set(next);
      this.feedback.set('');
      this.drawerOpen.set(true);
      return;
    }

    const next = this.emptyDraft();
    for (const field of this.definition.fields ?? []) {
      const value = row[field.key];
      if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
        next[field.key] = this.inputValue(field, value);
      }
    }
    if (typeof row.branchId === 'string') next['branchId'] = row.branchId;
    if (typeof row['customerId'] === 'string') next['customerId'] = row['customerId'];
    this.editingId.set(row.id);
    this.draft.set(next);
    this.feedback.set('');
    this.drawerOpen.set(true);
  }

  protected closeDrawer(): void {
    this.drawerOpen.set(false);
    this.feedback.set('');
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { create: null },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  protected fieldValue(key: string): DraftValue {
    return this.draft()[key] ?? '';
  }

  protected updateField(field: WorkspaceField, event: Event): void {
    const target = event.target as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
    const value: DraftValue = field.type === 'number' ? Number(target.value) : target.value;
    this.draft.update((current) => ({ ...current, [field.key]: value }));
  }

  protected async save(): Promise<void> {
    if (!this.complete()) {
      this.feedback.set('Zorunlu alanları tamamlayın.');
      return;
    }
    const values = this.draft();
    const availableBranches = this.branches.value() ?? this.branchService.branches();
    let branchId = String(values['branchId'] ?? '');
    if (!branchId && availableBranches.length > 0) {
      branchId = this.branchService.activeBranchId() || availableBranches[0].id;
    }
    if (this.definition.branchRequired && availableBranches.length > 0 && !branchId) {
      this.feedback.set('Devam etmek için bir şube seçin.');
      return;
    }
    this.saving.set(true);
    this.feedback.set('');
    try {
      const data = this.normalizedData(values);

      if (this.definition.resource === 'consultations') {
        const custRes = await firstValueFrom(
          this.api.list<CustomerProfile>('customers', { limit: 100 }),
        );
        const existingCustomers = custRes.data;

        if (this.editingId()) {
          const editId = this.editingId()!;
          const cust = existingCustomers.find(
            (c) => c.id === editId || (c.consultations && c.consultations.some((item) => item.id === editId)),
          );
          if (cust) {
            const updatedConsultations = (cust.consultations || []).map((item) => {
              if (item.id === editId) {
                return {
                  ...item,
                  serviceCategory: String(data['serviceCategory'] || item.serviceCategory),
                  inquiredSession: String(data['inquiredSession'] || item.inquiredSession),
                  targetSessionsCount: Number(data['targetSessionsCount'] || item.targetSessionsCount),
                  quotedPrice: Number(data['quotedPrice'] || item.quotedPrice),
                  consultantStaffName: String(data['consultantStaffName'] || item.consultantStaffName),
                  consultationDate: String(data['consultationDate'] || item.consultationDate),
                  nextFollowUpDate: data['nextFollowUpDate'] ? String(data['nextFollowUpDate']) : item.nextFollowUpDate,
                  interestLevel: (data['interestLevel'] as any) || item.interestLevel,
                  channel: (data['channel'] as any) || item.channel,
                  status: (data['status'] as any) || item.status,
                  notes: data['notes'] ? String(data['notes']) : item.notes,
                };
              }
              return item;
            });
            const { id: custId, createdAt, updatedAt, createdBy, updatedBy, deletedAt, ...cleanData } = cust;
            await firstValueFrom(
              this.api.update<CustomerProfile>('customers', cust.id, {
                data: {
                  ...cleanData,
                  consultations: updatedConsultations,
                },
              }),
            );
            await firstValueFrom(
              this.api.update<BeautyRecord>('consultations', editId, { data }).pipe(
                catchError(() => of(null)),
              ),
            );
          } else {
            await firstValueFrom(
              this.api.update<BeautyRecord>('consultations', editId, { data }).pipe(
                catchError(() => of(null)),
              ),
            );
          }
        } else {
          const phone = String(data['phone'] || '').trim();
          const name = String(data['customerName'] || '').trim();
          const existingCust = existingCustomers.find(
            (c) => (phone && c.phone === phone) || (name && c.fullName.toLowerCase() === name.toLowerCase()),
          );

          const newCns: CustomerConsultation = {
            id: 'cns_' + Date.now().toString(36),
            customerId: existingCust?.id || '',
            customerName: name,
            phone,
            email: String(data['email'] || ''),
            serviceCategory: String(data['serviceCategory'] || 'Lazer Epilasyon'),
            inquiredSession: String(data['inquiredSession'] || ''),
            targetSessionsCount: Number(data['targetSessionsCount'] || 1),
            quotedPrice: Number(data['quotedPrice'] || 0),
            consultantStaffName: String(data['consultantStaffName'] || ''),
            consultationDate: String(data['consultationDate'] || new Date().toISOString().split('T')[0]),
            nextFollowUpDate: data['nextFollowUpDate'] ? String(data['nextFollowUpDate']) : undefined,
            interestLevel: (data['interestLevel'] as any) || 'high',
            channel: (data['channel'] as any) || 'Yüz Yüze',
            status: (data['status'] as any) || 'inquiry',
            notes: data['notes'] ? String(data['notes']) : undefined,
          };

          if (existingCust) {
            const { id: custId, createdAt, updatedAt, createdBy, updatedBy, deletedAt, ...cleanData } = existingCust;
            await firstValueFrom(
              this.api.update<CustomerProfile>('customers', existingCust.id, {
                data: {
                  ...cleanData,
                  consultations: [newCns, ...(existingCust.consultations || [])],
                },
              }),
            );
          } else {
            await firstValueFrom(
              this.api.create<CustomerProfile>('customers', {
                branchId: branchId || undefined,
                data: {
                  fullName: name,
                  phone,
                  email: String(data['email'] || ''),
                  segment: 'lead',
                  status: 'active',
                  consultations: [newCns],
                  notes: `Ön görüşme kaydı: ${newCns.inquiredSession}`,
                },
              }),
            );
          }
          await firstValueFrom(
            this.api.create<BeautyRecord>('consultations', {
              branchId: branchId || undefined,
              data: newCns,
            }).pipe(catchError(() => of(null))),
          );
        }
        this.closeDrawer();
        this.remote.reload();
        return;
      }

      if (this.isHealthWorkspace()) {
        data['contraindicationRisk'] = values['contraindicationRisk'] || 'low';
        data['skinType'] = values['skinType'] || 'normal';
        data['fitzpatrick'] = values['fitzpatrick'] || 'tip-3';
        data['bloodType'] = values['bloodType'] || 'Bilinmiyor';
        data['allergies'] = values['allergies'] || '';
        data['chronicConditions'] = values['chronicConditions'] || '';
        data['medications'] = values['medications'] || '';
        data['isPregnant'] = Boolean(values['isPregnant']);
        data['isNursing'] = Boolean(values['isNursing']);
        data['hasImplant'] = Boolean(values['hasImplant']);
        data['isBloodThinner'] = Boolean(values['isBloodThinner']);
        data['isRoaccutane'] = Boolean(values['isRoaccutane']);
        data['isKeloid'] = Boolean(values['isKeloid']);
        data['notes'] = values['notes'] || '';
        data['documents'] = this.healthDocuments();
        data['updatedAt'] = new Date().toISOString();

        const cust = this.healthSelectedCustomer();
        if (cust) {
          data['customerName'] = String(cust['fullName'] || cust['name'] || values['customerName'] || '');
        }

        const id = this.editingId();
        if (id) {
          await firstValueFrom(this.api.update<BeautyRecord>('health', id, { data }));
        } else {
          await firstValueFrom(
            this.api.create<BeautyRecord>('health', {
              data,
              branchId: branchId || undefined,
            }),
          );
        }

        // Synchronize with CustomerProfile.health
        const customerId = String(values['customerId'] || '');
        if (customerId) {
          try {
            const custRes = await firstValueFrom(
              this.api.get<CustomerProfile>('customers', customerId),
            ).catch(() => null);
            if (custRes && custRes.data) {
              const fullCust = custRes.data;
              const { id: _, createdAt: __, updatedAt: ___, ...cleanCust } = fullCust;
              await firstValueFrom(
                this.api.update<CustomerProfile>('customers', fullCust.id, {
                  data: {
                    ...cleanCust,
                    health: {
                      ...(cleanCust.health || {}),
                      skinType: values['skinType'] as any,
                      fitzpatrick: values['fitzpatrick'] as any,
                      allergies: String(values['allergies'] || ''),
                      chronicDiseases: String(values['chronicConditions'] || ''),
                      medications: String(values['medications'] || ''),
                      isPregnant: Boolean(values['isPregnant']),
                      isNursing: Boolean(values['isNursing']),
                      hasImplant: Boolean(values['hasImplant']),
                      bloodType: String(values['bloodType'] || ''),
                      healthNotes: String(values['notes'] || ''),
                      lastUpdated: new Date().toISOString(),
                    },
                  },
                }),
              ).catch(() => null);
            }
          } catch (syncErr) {
            console.warn('CustomerProfile.health sync warning:', syncErr);
          }
        }

        this.closeDrawer();
        this.remote.reload();
        return;
      }

      if (this.isConsentWorkspace()) {
        data['consentType'] = values['consentType'] || 'kvkk-explicit-consent';
        data['signatureMethod'] = values['signatureMethod'] || 'digital_screen';
        data['documentVersion'] = values['documentVersion'] || 'v2.4 (2026)';
        data['status'] = values['status'] || 'signed';
        data['signedAt'] = values['signedAt'] || new Date().toISOString();
        data['notes'] = values['notes'] || '';
        data['confirmOralExplanation'] = Boolean(values['confirmOralExplanation']);
        data['confirmTruthfulness'] = Boolean(values['confirmTruthfulness']);
        data['confirmReadAndAgreed'] = Boolean(values['confirmReadAndAgreed']);
        if (this.signatureDataUrl()) {
          data['signatureImage'] = this.signatureDataUrl();
        }
        if (this.scannedConsentDoc()) {
          data['scannedDocument'] = this.scannedConsentDoc();
        }

        const cust = this.consentSelectedCustomer();
        if (cust) {
          data['customerName'] = String(cust['fullName'] || cust['name'] || values['customerName'] || '');
          if (cust['phone']) data['phone'] = String(cust['phone']);
          if (cust['identityNumber']) data['identityNumber'] = String(cust['identityNumber']);
        }

        const id = this.editingId();
        if (id) {
          await firstValueFrom(this.api.update<BeautyRecord>('consents', id, { data }));
        } else {
          await firstValueFrom(
            this.api.create<BeautyRecord>('consents', {
              data,
              branchId: branchId || undefined,
            }),
          );
        }

        this.closeDrawer();
        this.remote.reload();
        return;
      }

      if (this.isPackageWorkspace()) {
        const total = Number(values['totalSessions']) || 1;
        const remaining = values['remainingSessions'] !== undefined ? Number(values['remainingSessions']) : total;
        const price = Number(values['price']) || 0;
        const paid = values['paidAmount'] !== undefined ? Number(values['paidAmount']) : price;

        data['customerId'] = values['customerId'];
        data['packageId'] = values['packageId'] || '';
        data['packageName'] = values['packageName'] || 'Seans Paketi';
        data['totalSessions'] = total;
        data['remainingSessions'] = remaining;
        data['usedSessions'] = total - remaining;
        data['sessionIntervalDays'] = Number(values['sessionIntervalDays']) || 21;
        data['price'] = price;
        data['paidAmount'] = paid;
        data['paymentStatus'] = values['paymentStatus'] || (paid >= price ? 'paid' : 'partial');
        data['paymentMethod'] = values['paymentMethod'] || 'credit_card';
        data['startDate'] = values['startDate'] || this.todayIso;
        data['expiresAt'] = values['expiresAt'] || '';
        data['staffId'] = values['staffId'] || '';
        data['soldByStaffName'] = values['soldByStaffName'] || '';
        data['maxFreezeDays'] = Number(values['maxFreezeDays']) || 30;
        data['status'] = values['status'] || 'active';
        data['notes'] = values['notes'] || '';
        data['updatedAt'] = new Date().toISOString();

        const cust = this.packageSelectedCustomer();
        if (cust) {
          data['customerName'] = String(cust['fullName'] || cust['name'] || values['customerName'] || '');
          if (cust['phone']) data['phone'] = String(cust['phone']);
        }

        const id = this.editingId();
        let savedPackageId = id;
        if (id) {
          await firstValueFrom(this.api.update<BeautyRecord>('customer-packages', id, { data }));
        } else {
          const createRes = await firstValueFrom(
            this.api.create<BeautyRecord>('customer-packages', {
              data,
              branchId: branchId || undefined,
            }),
          );
          savedPackageId = createRes?.data?.id || 'pkg_' + Date.now().toString(36);
        }

        // Synchronize with CustomerProfile.packages
        const customerId = String(values['customerId'] || '');
        if (customerId) {
          try {
            const custRes = await firstValueFrom(
              this.api.get<CustomerProfile>('customers', customerId),
            ).catch(() => null);
            if (custRes && custRes.data) {
              const fullCust = custRes.data;
              const existingPackages: CustomerPackage[] = Array.isArray(fullCust.packages) ? [...fullCust.packages] : [];

              const targetPkg: CustomerPackage = {
                id: savedPackageId || 'pkg_' + Date.now().toString(36),
                packageName: String(data['packageName']),
                totalSessions: total,
                completedSessions: total - remaining,
                remainingSessions: remaining,
                startDate: String(data['startDate']),
                status:
                  data['status'] === 'active' || data['status'] === 'completed' || data['status'] === 'frozen'
                    ? (data['status'] as any)
                    : 'active',
                sessions: [],
              };

              const pkgIdx = existingPackages.findIndex((p) => p.id === targetPkg.id);
              if (pkgIdx >= 0) {
                existingPackages[pkgIdx] = {
                  ...existingPackages[pkgIdx],
                  ...targetPkg,
                  sessions: existingPackages[pkgIdx].sessions || [],
                };
              } else {
                existingPackages.unshift(targetPkg);
              }

              const { id: _, createdAt: __, updatedAt: ___, ...cleanCust } = fullCust;
              await firstValueFrom(
                this.api.update<CustomerProfile>('customers', fullCust.id, {
                  data: {
                    ...cleanCust,
                    packages: existingPackages,
                  },
                }),
              ).catch(() => null);
            }
          } catch (syncErr) {
            console.warn('CustomerProfile.packages sync warning:', syncErr);
          }
        }

        this.closeDrawer();
        this.remote.reload();
        return;
      }

      if (this.isSessionWorkspace()) {
        const sessionNo = Number(values['sessionNumber']) || 1;
        data['customerId'] = values['customerId'];
        data['customerPackageId'] = values['customerPackageId'] || '';
        data['packageName'] = values['packageName'] || '';
        data['serviceId'] = values['serviceId'] || '';
        data['sessionNumber'] = sessionNo;
        data['performedAt'] = values['performedAt'] || this.toLocalDatetimeString(new Date());
        data['deviceId'] = values['deviceId'] || '';
        data['staffId'] = values['staffId'] || '';
        data['roomId'] = values['roomId'] || '';
        data['bodyZone'] = values['bodyZone'] || 'Genel Bölge';
        data['energyJcm2'] = Number(values['energyJcm2']) || 18;
        data['shotCount'] = Number(values['shotCount']) || 0;
        data['durationMin'] = Number(values['durationMin']) || 30;
        data['frequencyHz'] = Number(values['frequencyHz']) || 10;
        data['reaction'] = values['reaction'] || 'normal';
        data['skinReactionRating'] = Number(values['skinReactionRating']) || 2;
        data['coolingApplied'] = Boolean(values['coolingApplied']);
        data['nextSessionDate'] = values['nextSessionDate'] || '';
        data['status'] = values['status'] || 'completed';
        data['notes'] = values['notes'] || '';
        data['updatedAt'] = new Date().toISOString();

        const cust = this.sessionSelectedCustomer();
        if (cust) {
          data['customerName'] = String(cust['fullName'] || cust['name'] || values['customerName'] || '');
          if (cust['phone']) data['phone'] = String(cust['phone']);
        }

        const staff = this.allStaff().find((s) => s.id === values['staffId']);
        if (staff) {
          data['staffName'] = String(staff['fullName'] || staff['name'] || '');
        }

        const id = this.editingId();
        if (id) {
          await firstValueFrom(this.api.update<BeautyRecord>('sessions', id, { data }));
        } else {
          await firstValueFrom(
            this.api.create<BeautyRecord>('sessions', {
              data,
              branchId: branchId || undefined,
            }),
          );
        }

        // Synchronize package session decrement and customer sessions
        const customerPackageId = String(values['customerPackageId'] || '');
        const customerId = String(values['customerId'] || '');
        if (customerPackageId && customerId) {
          try {
            const custRes = await firstValueFrom(
              this.api.get<CustomerProfile>('customers', customerId),
            ).catch(() => null);
            if (custRes && custRes.data) {
              const fullCust = custRes.data;
              const packages = Array.isArray(fullCust.packages) ? [...fullCust.packages] : [];
              const pkgIdx = packages.findIndex((p) => p.id === customerPackageId);
              if (pkgIdx >= 0) {
                const targetPkg = { ...packages[pkgIdx] };
                const sessions = Array.isArray(targetPkg.sessions) ? [...targetPkg.sessions] : [];

                const newSessionItem: CustomerSessionItem = {
                  sessionNo,
                  date: String(data['performedAt']).slice(0, 10),
                  zone: String(data['bodyZone']),
                  staffName: String(data['staffName'] || ''),
                  status:
                    data['status'] === 'in_progress'
                      ? 'pending'
                      : data['status'] === 'cancelled' || data['status'] === 'no_show'
                        ? 'pending'
                        : 'completed',
                  notes: data['notes'] ? String(data['notes']) : undefined,
                };

                const existingItemIdx = sessions.findIndex((s) => s.sessionNo === sessionNo);
                if (existingItemIdx >= 0) {
                  sessions[existingItemIdx] = newSessionItem;
                } else {
                  sessions.push(newSessionItem);
                  if (!id && data['status'] === 'completed') {
                    targetPkg.completedSessions = (targetPkg.completedSessions || 0) + 1;
                    targetPkg.remainingSessions = Math.max(0, (targetPkg.remainingSessions || 1) - 1);
                    if (targetPkg.remainingSessions === 0) {
                      targetPkg.status = 'completed';
                    }
                  }
                }
                targetPkg.sessions = sessions;
                packages[pkgIdx] = targetPkg;

                const { id: _, createdAt: __, updatedAt: ___, ...cleanCust } = fullCust;
                await firstValueFrom(
                  this.api.update<CustomerProfile>('customers', fullCust.id, {
                    data: {
                      ...cleanCust,
                      packages,
                    },
                  }),
                ).catch(() => null);

                await firstValueFrom(
                  this.api.update<BeautyRecord>('customer-packages', customerPackageId, {
                    data: {
                      remainingSessions: targetPkg.remainingSessions,
                      completedSessions: targetPkg.completedSessions,
                      status: targetPkg.status,
                    },
                  }),
                ).catch(() => null);
              }
            }
          } catch (syncErr) {
            console.warn('CustomerProfile sessions sync warning:', syncErr);
          }
        }

        this.closeDrawer();
        this.remote.reload();
        return;
      }

      const id = this.editingId();
      if (id) {
        await firstValueFrom(this.api.update<BeautyRecord>(this.definition.resource, id, { data }));
      } else if (this.definition.resource === 'payments') {
        await firstValueFrom(
          this.api.create<BeautyRecord>('payments', {
            ...data,
            branchId,
            idempotencyKey: crypto.randomUUID(),
          }),
        );
      } else {
        await firstValueFrom(
          this.api.create<BeautyRecord>(this.definition.resource, {
            data,
            branchId: branchId || undefined,
          }),
        );
      }
      if (this.entityLookup.isEntityResource(this.definition.resource)) {
        void this.entityLookup.refresh(this.definition.resource);
      }
      this.closeDrawer();
      this.remote.reload();
    } catch (error) {
      this.feedback.set(error instanceof Error ? error.message : 'Kayıt tamamlanamadı.');
    } finally {
      this.saving.set(false);
    }
  }

  protected async remove(row: BeautyRecord): Promise<void> {
    if (!confirm(`“${this.recordName(row)}” kaydi silinsin mi?`)) return;
    this.deletingId.set(row.id);
    try {
      if (this.definition.resource === 'consultations') {
        const custRes = await firstValueFrom(
          this.api.list<CustomerProfile>('customers', { limit: 100 }),
        );
        const cust = custRes.data.find(
          (c) => c.id === row.id || (c.consultations && c.consultations.some((item) => item.id === row.id)),
        );
        if (cust) {
          const updatedConsultations = (cust.consultations || []).filter((item) => item.id !== row.id);
          const { id: custId, createdAt, updatedAt, createdBy, updatedBy, deletedAt, ...cleanData } = cust;
          await firstValueFrom(
            this.api.update<CustomerProfile>('customers', cust.id, {
              data: {
                ...cleanData,
                consultations: updatedConsultations,
              },
            }),
          );
        }
        this.remote.reload();
        return;
      }

      await firstValueFrom(this.api.remove(this.definition.resource, row.id));
      if (this.entityLookup.isEntityResource(this.definition.resource)) {
        void this.entityLookup.refresh(this.definition.resource);
      }
      this.remote.reload();
    } catch (error) {
      this.feedback.set(error instanceof Error ? error.message : 'Kayit silinemedi.');
    } finally {
      this.deletingId.set(null);
    }
  }

  protected async openCustomerDetailFromConsultation(row: BeautyRecord): Promise<void> {
    const custId = String(row['customerId'] || row.id);
    try {
      let customer: CustomerProfile | undefined;
      try {
        const directRes = await firstValueFrom(this.api.get<CustomerProfile>('customers', custId));
        if (directRes && directRes.data) {
          customer = directRes.data;
        }
      } catch {
        // Fallback
      }

      if (!customer) {
        const custRes = await firstValueFrom(
          this.api.list<CustomerProfile>('customers', { limit: 100 }),
        );
        customer = custRes.data.find((c) => c.id === custId || c.phone === row['phone']);
      }

      if (customer) {
        this.selectedCustomer.set(customer);
        this.customerDetailInitialTab.set('consultations');
        this.customerDetailOpen.set(true);
      } else {
        this.feedback.set('Müşteri kaydı bulunamadı.');
      }
    } catch {
      this.feedback.set('Müşteri detayı yüklenemedi.');
    }
  }

  protected async openCustomerDetailFromPackage(rec: BeautyRecord): Promise<void> {
    const custId = String(rec['customerId'] || rec.id);
    try {
      let customer: CustomerProfile | undefined;
      try {
        const directRes = await firstValueFrom(this.api.get<CustomerProfile>('customers', custId));
        if (directRes && directRes.data) {
          customer = directRes.data;
        }
      } catch {
        // Fallback
      }

      if (!customer) {
        const custRes = await firstValueFrom(
          this.api.list<CustomerProfile>('customers', { limit: 100 }),
        );
        customer = custRes.data.find((c) => c.id === custId || c.phone === rec['phone']);
      }

      if (customer) {
        this.selectedCustomer.set(customer);
        this.customerDetailInitialTab.set('sessions');
        this.customerDetailOpen.set(true);
      } else {
        this.feedback.set('Danışan profili bulunamadı.');
      }
    } catch {
      this.feedback.set('Danışan detayları yüklenirken bir hata oluştu.');
    }
  }

  protected async openCustomerDetailFromSession(rec: BeautyRecord): Promise<void> {
    return this.openCustomerDetailFromPackage(rec);
  }

  protected async seedDemoConsultations(): Promise<void> {
    if (this.seedingDemoConsultations()) return;
    this.seedingDemoConsultations.set(true);
    this.feedback.set('Örnek ön görüşme ve seans bilgi talebi kayıtları yükleniyor…');
    try {
      const availableBranches = this.branches.value() ?? this.branchService.branches();
      const branchId = this.branchService.activeBranchId() || availableBranches[0]?.id;

      const custRes = await firstValueFrom(
        this.api.list<CustomerProfile>('customers', { limit: 100 }),
      );
      const existingCustomers = custRes.data;

      for (const cns of DEMO_CONSULTATIONS) {
        const existing = existingCustomers.find(
          (c) => c.fullName.toLowerCase() === cns.customerName.toLowerCase() || c.phone === cns.phone,
        );
        if (existing) {
          const hasIt = (existing.consultations || []).some((item) => item.id === cns.id);
          if (!hasIt) {
            const { id: custId, createdAt, updatedAt, createdBy, updatedBy, deletedAt, ...cleanData } = existing;
            await firstValueFrom(
              this.api.update<CustomerProfile>('customers', existing.id, {
                data: {
                  ...cleanData,
                  consultations: [cns, ...(existing.consultations || [])],
                },
              }),
            );
          }
        } else {
          await firstValueFrom(
            this.api.create<CustomerProfile>('customers', {
              branchId,
              data: {
                fullName: cns.customerName,
                phone: cns.phone,
                email: cns.email,
                segment: 'lead',
                status: 'active',
                consultations: [cns],
                notes: `Ön görüşme: ${cns.inquiredSession}. Not: ${cns.notes || ''}`,
              },
            }),
          );
        }
      }

      this.feedback.set('10 Gerçekçi Ön Görüşme ve Seans Bilgi Talebi başarıyla yüklendi!');
      this.remote.reload();
    } catch (err) {
      console.error('Failed to seed demo consultations:', err);
      this.feedback.set('Örnek ön görüşmeler yüklenirken bir hata oluştu.');
    } finally {
      this.seedingDemoConsultations.set(false);
    }
  }

  protected recordName(row: BeautyRecord): string {
    for (const key of ['fullName', 'name', 'title', 'invoiceNumber']) {
      const value = row[key];
      if (typeof value === 'string' && value) return value;
    }
    if (typeof row['customerId'] === 'string') {
      const cust = this.entityLookup.resolve('customers', row['customerId']);
      if (cust) return cust;
    }
    if (typeof row['staffId'] === 'string') {
      const st = this.entityLookup.resolve('staff', row['staffId']);
      if (st) return st;
    }
    return row.id;
  }

  protected initials(name: string): string {
    if (!name) return '??';
    const parts = name.trim().split(/\s+/);
    return parts.length > 1
      ? (parts[0][0] + parts[parts.length - 1][0]).toLocaleUpperCase('tr')
      : parts[0].slice(0, 2).toLocaleUpperCase('tr');
  }

  protected cellValue(row: BeautyRecord, column: WorkspaceColumn): string {
    const raw = this.resolve(row, column.key);
    const resolved = this.resolveColumnLabel(column.key, raw);
    const value = resolved ?? raw;

    if (column.key === 'documents') {
      const docs = row['documents'];
      if (Array.isArray(docs)) {
        return docs.length > 0 ? `📄 ${docs.length} Belge` : 'Belge Yok';
      }
      return 'Belge Yok';
    }

    if (column.key === 'sessionsProgress') {
      const remaining = Number(row['remainingSessions'] ?? 0);
      const total = Number(row['totalSessions'] ?? 0);
      const used = Number(row['usedSessions'] ?? (total - remaining));
      return `${used}/${total} Seans (${remaining} Kalan)`;
    }

    if (column.key === 'packageName') {
      return String(row['packageName'] || row['name'] || value || '—');
    }

    if (column.key === 'packageOrServiceName') {
      if (row['packageName']) return `📦 ${row['packageName']}`;
      if (row['serviceId']) {
        const resolved = this.entityLookup.resolve('services', row['serviceId']);
        if (resolved) return `✨ ${resolved}`;
      }
      return 'Münferit Seans';
    }

    if (column.key === 'sessionNumberDisplay') {
      const num = row['sessionNumber'] ?? 1;
      return `${num}. Seans`;
    }

    if (column.key === 'signatureMethod') {
      const method = String(value || '');
      const map: Record<string, string> = {
        digital_screen: '✍️ Dijital E-İmza',
        physical_scan: '📄 Islak İmzalı Belge',
        sms_otp: '📱 SMS Onay Kodu',
        email_verification: '✉️ E-Posta Onayı',
      };
      return map[method] || (method ? method : '✍️ Dijital E-İmza');
    }

    if (column.format === 'date') return this.date(value);
    if (column.format === 'currency') {
      return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(
        typeof value === 'number' ? value : Number(value) || 0,
      );
    }
    if (column.format === 'number') return String(value ?? '0');
    if (Array.isArray(value)) return value.join(', ');
    if (typeof value === 'boolean') return value ? 'Evet' : 'Hayir';
    return typeof value === 'string' || typeof value === 'number' ? String(value) : '—';
  }

  private resolveColumnLabel(key: string, value: unknown): string | undefined {
    if (value === undefined || value === null || value === '') return undefined;

    // 1. Check inferred entity from column key (e.g. customerId -> customers)
    const inferred = this.inferEntityFromColumn(key);
    if (inferred) {
      const resolved = this.entityLookup.resolve(inferred, value);
      if (resolved) return resolved;
    }

    // 2. Check field definition lookup if declared
    const field = this.definition.fields?.find((f) => f.key === key);
    if (field?.lookup) {
      if (this.entityLookup.isEntityResource(field.lookup)) {
        return this.entityLookup.resolve(field.lookup, value);
      }
      return this.definitions.resolveLabel(field.lookup as DefinitionCategoryKey, String(value));
    }

    return undefined;
  }

  private inferEntityFromColumn(colKey: string): string | undefined {
    const map: Record<string, string> = {
      customerId: 'customers',
      serviceId: 'services',
      staffId: 'staff',
      deviceId: 'devices',
      roomId: 'rooms',
      supplierId: 'suppliers',
      packageId: 'packages',
      productId: 'products',
      categoryId: 'service-categories',
    };
    return map[colKey];
  }

  protected statusValue(row: BeautyRecord, column: WorkspaceColumn): string {
    const value = this.resolve(row, column.key);
    return typeof value === 'string' ? value : 'active';
  }

  protected fieldId(field: WorkspaceField): string {
    return `workspace-${field.key}`;
  }

  private emptyDraft(): Draft {
    const available = this.branches.value() ?? this.branchService.branches();
    const defaultBranchId =
      this.branchFilter() || this.branchService.activeBranchId() || available[0]?.id || '';
    const value: Draft = defaultBranchId ? { branchId: defaultBranchId } : {};
    const now = new Date();
    const todayDate = now.toISOString().slice(0, 10);
    const localDatetime = new Date(now.getTime() - now.getTimezoneOffset() * 60_000)
      .toISOString()
      .slice(0, 16);

    for (const field of this.definition.fields ?? []) {
      if (field.type === 'date') {
        value[field.key] = todayDate;
      } else if (field.type === 'datetime-local') {
        value[field.key] = localDatetime;
      } else if (field.type === 'number') {
        value[field.key] = 0;
      } else if (field.type === 'select') {
        value[field.key] = this.optionsForField(field)[0]?.value ?? '';
      } else {
        value[field.key] = '';
      }
    }
    return value;
  }

  private normalizedData(values: Draft): Record<string, DraftValue> {
    const data: Record<string, DraftValue> = {};
    for (const field of this.definition.fields ?? []) {
      const value = values[field.key];
      if (value === '' || value === undefined) continue;
      if (field.type === 'datetime-local') {
        data[field.key] = new Date(String(value)).toISOString();
      } else {
        data[field.key] = value;
      }
    }
    return data;
  }

  private inputValue(field: WorkspaceField, value: DraftValue): DraftValue {
    if ((field.type !== 'datetime-local' && field.type !== 'date') || typeof value !== 'string')
      return value;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    if (field.type === 'date') return date.toISOString().slice(0, 10);
    return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
  }

  private resolve(row: BeautyRecord, path: string): unknown {
    return path.split('.').reduce<unknown>((value, key) => {
      if (!value || typeof value !== 'object' || Array.isArray(value)) return undefined;
      return (value as Record<string, unknown>)[key];
    }, row);
  }

  protected formatDate(value: unknown): string {
    if (typeof value !== 'string' || !value) return '—';
    const date = new Date(value);
    return Number.isNaN(date.getTime())
      ? value
      : new Intl.DateTimeFormat('tr-TR', { dateStyle: 'medium' }).format(date);
  }

  private date(value: unknown): string {
    if (typeof value !== 'string' || !value) return '—';
    const date = new Date(value);
    return Number.isNaN(date.getTime())
      ? value
      : new Intl.DateTimeFormat('tr-TR', { dateStyle: 'medium', timeStyle: 'short' }).format(date);
  }

  private metricLabel(key: string): string {
    const labels: Record<string, string> = {
      appointments: 'Randevu',
      customers: 'Musteri',
      revenue: 'Ciro',
      criticalStock: 'Kritik stok',
    };
    return labels[key] ?? key;
  }
}
