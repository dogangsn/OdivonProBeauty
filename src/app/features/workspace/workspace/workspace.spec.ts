import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { of } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiClient } from '../../../core/api-client';
import { BranchService } from '../../../core/branch.service';
import { DefinitionsService } from '../../../core/definitions/definitions.service';
import { EntityLookupService } from '../../../core/entity-lookup.service';
import { Workspace } from './workspace';
import { WORKSPACES } from '../../../core/workspace-definitions';

describe('Workspace', () => {
  let apiMock: Record<string, ReturnType<typeof vi.fn>>;
  let branchServiceMock: {
    ensureBranches: ReturnType<typeof vi.fn>;
    branches: ReturnType<typeof vi.fn>;
    activeBranchId: ReturnType<typeof vi.fn>;
  };
  let routerMock: { navigate: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    apiMock = {
      list: vi.fn().mockReturnValue(of({ ok: true, data: [] })),
      request: vi.fn().mockReturnValue(of({ ok: true, data: {} })),
      create: vi.fn().mockReturnValue(of({ ok: true, data: {} })),
      update: vi.fn().mockReturnValue(of({ ok: true, data: {} })),
      remove: vi.fn().mockReturnValue(of({ ok: true, data: {} })),
    };

    branchServiceMock = {
      ensureBranches: vi.fn().mockResolvedValue([]),
      branches: vi.fn().mockReturnValue([]),
      activeBranchId: vi.fn().mockReturnValue(''),
    };

    routerMock = {
      navigate: vi.fn().mockResolvedValue(true),
    };

    await TestBed.configureTestingModule({
      imports: [Workspace],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              data: { definition: WORKSPACES['payments'] },
              queryParamMap: { get: () => null },
            },
          },
        },
        { provide: Router, useValue: routerMock },
        { provide: ApiClient, useValue: apiMock },
        { provide: BranchService, useValue: branchServiceMock },
        DefinitionsService,
        EntityLookupService,
      ],
    }).compileComponents();
  });

  it('should create the workspace component', () => {
    const fixture = TestBed.createComponent(Workspace);
    const component = fixture.componentInstance;
    expect(component).toBeTruthy();
  });

  it('should resolve options for lookup fields dynamically', () => {
    const fixture = TestBed.createComponent(Workspace);
    const component = fixture.componentInstance;
    const methodField = WORKSPACES['payments'].fields?.find((f) => f.key === 'method');
    expect(methodField).toBeDefined();
    if (methodField) {
      const options = (component as any).optionsForField(methodField);
      expect(options.length).toBeGreaterThan(0);
      expect(options.some((o: any) => o.value === 'cash' || o.value === 'card')).toBe(true);
    }
  });

  it('should open and close service wizard', () => {
    const fixture = TestBed.createComponent(Workspace);
    const component = fixture.componentInstance;
    expect((component as any).wizardOpen()).toBe(false);
    (component as any).openWizard();
    expect((component as any).wizardOpen()).toBe(true);
    (component as any).closeWizard();
    expect((component as any).wizardOpen()).toBe(false);
  });

  it('should initialize waitlist smart defaults when creating new waitlist record', () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [Workspace],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              data: { definition: WORKSPACES['waitlist'] },
              queryParamMap: { get: () => null },
            },
          },
        },
        { provide: Router, useValue: routerMock },
        { provide: ApiClient, useValue: apiMock },
        { provide: BranchService, useValue: branchServiceMock },
        DefinitionsService,
        EntityLookupService,
      ],
    });

    const fixture = TestBed.createComponent(Workspace);
    const component = fixture.componentInstance as any;
    expect(component.isWaitlistWorkspace()).toBe(true);

    component.openCreate();
    expect(component.drawerOpen()).toBe(true);
    expect(component.draft()['priority']).toBe('normal');
    expect(component.draft()['status']).toBe('pending');
    expect(component.draft()['timeSlot']).toBe('any');
    expect(component.draft()['preferredFrom']).toBeTruthy();
    expect(component.draft()['preferredTo']).toBeTruthy();

    // Test quick priority selection
    component.setWaitlistPriority('urgent');
    expect(component.draft()['priority']).toBe('urgent');

    // Test time slot selection
    component.setWaitlistTimeSlot('morning');
    expect(component.draft()['timeSlot']).toBe('morning');

    // Test quick date selection
    component.setWaitlistQuickDate('tomorrow');
    expect(component.draft()['preferredFrom']).toBeTruthy();
  });

  it('should paginate rows correctly', () => {
    const fixture = TestBed.createComponent(Workspace);
    const component = fixture.componentInstance as any;

    expect(component.page()).toBe(1);
    expect(component.pageSize()).toBe(10);

    // Mock 25 records
    const mockRows = Array.from({ length: 25 }, (_, i) => ({
      id: `item_${i + 1}`,
      name: `Müşteri ${i + 1}`,
    }));
    vi.spyOn(component, 'rows').mockReturnValue(mockRows);

    expect(component.totalRows()).toBe(25);
    expect(component.totalPages()).toBe(3);
    expect(component.paginatedRows().length).toBe(10);
    expect(component.paginatedRows()[0].id).toBe('item_1');

    // Go to next page
    component.nextPage();
    expect(component.page()).toBe(2);
    expect(component.paginatedRows().length).toBe(10);
    expect(component.paginatedRows()[0].id).toBe('item_11');

    // Page 3 (last 5 items)
    component.nextPage();
    expect(component.page()).toBe(3);
    expect(component.paginatedRows().length).toBe(5);

    // Change page size to 25
    component.onPageSizeChange({ target: { value: '25' } } as any);
    expect(component.pageSize()).toBe(25);
    expect(component.page()).toBe(1);
    expect(component.paginatedRows().length).toBe(25);
  });

  it('should initialize consultation smart defaults and open drawer without opening customerFormModal', () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [Workspace],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              data: { definition: WORKSPACES['consultations'] },
              queryParamMap: { get: () => null },
            },
          },
        },
        { provide: Router, useValue: routerMock },
        { provide: ApiClient, useValue: apiMock },
        { provide: BranchService, useValue: branchServiceMock },
        DefinitionsService,
        EntityLookupService,
      ],
    });

    const fixture = TestBed.createComponent(Workspace);
    const component = fixture.componentInstance as any;
    expect(component.isConsultationWorkspace()).toBe(true);

    component.openCreate();
    // CRITICAL: drawerOpen must be true, customerFormOpen must remain false!
    expect(component.drawerOpen()).toBe(true);
    expect(component.customerFormOpen()).toBe(false);

    // Verify smart defaults
    expect(component.draft()['serviceCategory']).toBe('Lazer Epilasyon');
    expect(component.draft()['interestLevel']).toBe('high');
    expect(component.draft()['channel']).toBe('Yüz Yüze');
    expect(component.draft()['status']).toBe('inquiry');
    expect(component.draft()['targetSessionsCount']).toBe(8);
    expect(component.draft()['consultationDate']).toBeTruthy();
    expect(component.draft()['nextFollowUpDate']).toBeTruthy();

    // Verify quick follow-up date setter
    component.setConsultationFollowUpQuickDays(7);
    expect(component.draft()['nextFollowUpDate']).toBeTruthy();

    // Verify customer selection auto-fills name, phone, email
    component.onConsultationCustomerSelected({
      id: 'cust_test_1',
      fullName: 'Deneme Aday',
      phone: '05551112233',
      email: 'aday@test.com',
    } as any);
    expect(component.draft()['customerId']).toBe('cust_test_1');
    expect(component.draft()['customerName']).toBe('Deneme Aday');
    expect(component.draft()['phone']).toBe('05551112233');
    expect(component.draft()['email']).toBe('aday@test.com');

    // Verify row edit opens drawer with editingId
    component.openEdit({
      id: 'cns_999',
      customerName: 'Kayıtlı Aday',
      phone: '05559998877',
      serviceCategory: 'Medikal Cilt Bakımı',
      inquiredSession: 'Hydrafacial',
      quotedPrice: 1500,
      targetSessionsCount: 5,
    } as any);
    expect(component.editingId()).toBe('cns_999');
    expect(component.drawerOpen()).toBe(true);
    expect(component.draft()['customerName']).toBe('Kayıtlı Aday');
    expect(component.draft()['serviceCategory']).toBe('Medikal Cilt Bakımı');
    expect(component.draft()['quotedPrice']).toBe(1500);
  });

  it('should initialize health workspace smart defaults, customer selection, and document management', () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [Workspace],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              data: { definition: WORKSPACES['health'] },
              queryParamMap: { get: () => null },
            },
          },
        },
        { provide: Router, useValue: routerMock },
        { provide: ApiClient, useValue: apiMock },
        { provide: BranchService, useValue: branchServiceMock },
        DefinitionsService,
        EntityLookupService,
      ],
    });

    const fixture = TestBed.createComponent(Workspace);
    const component = fixture.componentInstance as any;
    expect(component.isHealthWorkspace()).toBe(true);

    component.openCreate();
    expect(component.drawerOpen()).toBe(true);
    expect(component.draft()['contraindicationRisk']).toBe('low');
    expect(component.draft()['skinType']).toBe('normal');
    expect(component.draft()['fitzpatrick']).toBe('tip-3');
    expect(component.draft()['isPregnant']).toBe(false);
    expect(component.healthDocuments().length).toBe(0);

    // Customer selection auto-fills and loads customer health profile
    component.onHealthCustomerSelected({
      id: 'cust_health_1',
      fullName: 'Selin Karaca',
      phone: '05443332211',
      health: {
        skinType: 'hassas',
        fitzpatrick: 'tip-2',
        allergies: 'Lateks',
        chronicDiseases: 'Tiroid',
        isPregnant: true,
      },
    } as any);
    expect(component.draft()['customerId']).toBe('cust_health_1');
    expect(component.draft()['customerName']).toBe('Selin Karaca');
    expect(component.draft()['skinType']).toBe('hassas');
    expect(component.draft()['fitzpatrick']).toBe('tip-2');
    expect(component.draft()['allergies']).toBe('Lateks');
    expect(component.draft()['chronicConditions']).toBe('Tiroid');
    expect(component.draft()['isPregnant']).toBe(true);

    // Document management test
    const dummyDoc = {
      id: 'doc_1',
      name: 'anamnez.pdf',
      type: 'anamnesis',
      fileType: 'application/pdf',
      size: 1024 * 500,
      dataUrl: 'data:application/pdf;base64,JVBERi0x',
      uploadedAt: new Date().toISOString(),
    };
    component.healthDocuments.set([dummyDoc]);
    expect(component.healthDocuments().length).toBe(1);

    component.previewHealthDocument(dummyDoc);
    expect(component.previewingDocument()).toEqual(dummyDoc);
    component.closeDocumentPreview();
    expect(component.previewingDocument()).toBeNull();

    // Document cell formatting test
    const cellValueDoc = component.cellValue(
      { id: 'h_1', documents: [dummyDoc, { ...dummyDoc, id: 'doc_2' }] },
      { key: 'documents', label: 'Ekli Belgeler' },
    );
    expect(cellValueDoc).toBe('📄 2 Belge');

    const cellValueEmptyDoc = component.cellValue(
      { id: 'h_2', documents: [] },
      { key: 'documents', label: 'Ekli Belgeler' },
    );
    expect(cellValueEmptyDoc).toBe('Belge Yok');

    // Remove document test
    component.removeHealthDocument('doc_1');
    expect(component.healthDocuments().length).toBe(0);

    // Edit existing health record
    component.openEdit({
      id: 'h_999',
      customerId: 'cust_health_1',
      contraindicationRisk: 'high',
      skinType: 'karma',
      fitzpatrick: 'tip-4',
      isRoaccutane: true,
      hasImplant: true,
      documents: [dummyDoc],
    } as any);
    expect(component.editingId()).toBe('h_999');
    expect(component.draft()['contraindicationRisk']).toBe('high');
    expect(component.draft()['skinType']).toBe('karma');
    expect(component.draft()['isRoaccutane']).toBe(true);
    expect(component.draft()['hasImplant']).toBe(true);
    expect(component.healthDocuments().length).toBe(1);
  });

  it('should manage consent and KVKK workspace with templates, customer combobox, signatures and verification', () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [Workspace],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              data: { definition: WORKSPACES['consents'] },
              queryParamMap: { get: () => null },
            },
          },
        },
        { provide: Router, useValue: routerMock },
        { provide: ApiClient, useValue: apiMock },
        { provide: BranchService, useValue: branchServiceMock },
        DefinitionsService,
        EntityLookupService,
      ],
    });

    const fixture = TestBed.createComponent(Workspace);
    const component = fixture.componentInstance as any;
    expect(component.isConsentWorkspace()).toBe(true);

    // Test smart defaults on openCreate
    component.openCreate();
    expect(component.drawerOpen()).toBe(true);
    expect(component.draft()['consentType']).toBe('kvkk-explicit-consent');
    expect(component.draft()['signatureMethod']).toBe('digital_screen');
    expect(component.draft()['status']).toBe('signed');
    expect(component.draft()['documentVersion']).toBe('v2.4 (2026)');
    expect(component.draft()['confirmOralExplanation']).toBe(true);
    expect(component.draft()['confirmTruthfulness']).toBe(true);
    expect(component.draft()['confirmReadAndAgreed']).toBe(true);
    expect(component.complete()).toBe(false); // requires customerId

    // Test customer selection
    component.onConsentCustomerSelected({
      id: 'cust_consent_100',
      fullName: 'Derya Özkan',
      phone: '+90 532 999 88 77',
      identityNumber: '12345678901',
    });
    expect(component.draft()['customerId']).toBe('cust_consent_100');
    expect(component.draft()['customerName']).toBe('Derya Özkan');
    expect(component.draft()['phone']).toBe('+90 532 999 88 77');
    expect(component.draft()['identityNumber']).toBe('12345678901');
    expect(component.complete()).toBe(true);

    // Test consent type template switching
    component.onConsentTypeChange('laser-consent');
    expect(component.draft()['consentType']).toBe('laser-consent');
    expect(component.draft()['documentVersion']).toBe('v3.1 (2026)');
    expect(component.selectedConsentTemplate().code).toBe('laser-consent');

    // Test template expanded accordion toggle
    expect(component.templateExpanded()).toBe(false);
    component.toggleTemplateExpanded();
    expect(component.templateExpanded()).toBe(true);
    component.toggleTemplateExpanded();
    expect(component.templateExpanded()).toBe(false);

    // Test signature data url
    component.signatureDataUrl.set('data:image/png;base64,mockSignature');
    expect(component.signatureDataUrl()).toBe('data:image/png;base64,mockSignature');
    component.clearSignature();
    expect(component.signatureDataUrl()).toBe('');

    // Test scanned document
    const mockScan = {
      id: 'scan_1',
      name: 'onam-imzali.pdf',
      type: 'consent_scan',
      fileType: 'application/pdf',
      size: 1024 * 300,
      dataUrl: 'data:application/pdf;base64,mockPdf',
      uploadedAt: new Date().toISOString(),
    };
    component.scannedConsentDoc.set(mockScan);
    expect(component.scannedConsentDoc()).toEqual(mockScan);
    component.removeScannedConsentDoc();
    expect(component.scannedConsentDoc()).toBeNull();

    // Test SMS verification flow
    component.sendConsentSmsCode();
    expect(component.smsCodeSent()).toBe(true);
    expect(component.smsInputCode()).toBe('482915');
    component.verifyConsentSmsCode();
    expect(component.smsVerified()).toBe(true);
    expect(component.draft()['status']).toBe('signed');

    // Test signatureMethod column formatter
    expect(
      component.cellValue(
        { id: 'cs_1', signatureMethod: 'digital_screen' },
        { key: 'signatureMethod', label: 'İmza Türü' },
      ),
    ).toBe('✍️ Dijital E-İmza');

    expect(
      component.cellValue(
        { id: 'cs_2', signatureMethod: 'physical_scan' },
        { key: 'signatureMethod', label: 'İmza Türü' },
      ),
    ).toBe('📄 Islak İmzalı Belge');

    expect(
      component.cellValue(
        { id: 'cs_3', signatureMethod: 'sms_otp' },
        { key: 'signatureMethod', label: 'İmza Türü' },
      ),
    ).toBe('📱 SMS Onay Kodu');

    // Test openEdit with existing consent record
    component.openEdit({
      id: 'cs_edit_555',
      customerId: 'cust_consent_100',
      customerName: 'Derya Özkan',
      consentType: 'photo-consent',
      signatureMethod: 'physical_scan',
      documentVersion: 'v1.8 (2026)',
      status: 'signed',
      signatureImage: 'data:image/png;base64,existingSign',
      scannedDocument: mockScan,
      notes: 'Danışan yüzünün kapatılması şartıyla izin verdi.',
    } as any);

    expect(component.editingId()).toBe('cs_edit_555');
    expect(component.draft()['consentType']).toBe('photo-consent');
    expect(component.draft()['signatureMethod']).toBe('physical_scan');
    expect(component.signatureDataUrl()).toBe('data:image/png;base64,existingSign');
    expect(component.scannedConsentDoc()).toEqual(mockScan);
    expect(component.draft()['notes']).toBe('Danışan yüzünün kapatılması şartıyla izin verdi.');
  });

  it('should initialize package sales defaults, apply presets, and calculate unit prices', () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [Workspace],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              data: { definition: WORKSPACES['packages'] },
              queryParamMap: { get: () => null },
            },
          },
        },
        { provide: Router, useValue: routerMock },
        { provide: ApiClient, useValue: apiMock },
        { provide: BranchService, useValue: branchServiceMock },
        DefinitionsService,
        EntityLookupService,
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(Workspace);
    const component = fixture.componentInstance as any;

    expect(component.isPackageWorkspace()).toBe(true);

    // Open Create
    component.openCreate();
    expect(component.drawerOpen()).toBe(true);
    expect(component.draft()['totalSessions']).toBe(6);
    expect(component.draft()['remainingSessions']).toBe(6);
    expect(component.draft()['sessionIntervalDays']).toBe(21);
    expect(component.draft()['paymentStatus']).toBe('paid');
    expect(component.selectedPackagePresetId()).toBe('');

    // Customer Selection
    component.onPackageCustomerSelected({
      id: 'cust_pkg_1',
      fullName: 'Seda Erdem',
      phone: '0533 111 22 33',
    });
    expect(component.draft()['customerId']).toBe('cust_pkg_1');
    expect(component.draft()['customerName']).toBe('Seda Erdem');
    expect(component.draft()['phone']).toBe('0533 111 22 33');

    // Apply Predefined Package Preset
    const laserPreset = component.packagePresets[0]; // Buz Lazer 8 Seans
    component.applyPackagePreset(laserPreset);
    expect(component.selectedPackagePresetId()).toBe(laserPreset.id);
    expect(component.draft()['packageName']).toBe(laserPreset.name);
    expect(component.draft()['totalSessions']).toBe(laserPreset.totalSessions);
    expect(component.draft()['remainingSessions']).toBe(laserPreset.totalSessions);
    expect(component.draft()['price']).toBe(laserPreset.price);
    expect(component.draft()['paidAmount']).toBe(laserPreset.price);
    expect(component.draft()['sessionIntervalDays']).toBe(laserPreset.sessionIntervalDays);

    // Unit price and remaining debt calculations
    expect(component.computePackageUnitPrice()).toBe(Math.round(laserPreset.price / laserPreset.totalSessions));
    expect(component.computePackageRemainingDebt()).toBe(0);

    // Partial Payment test
    component.onPackagePaidAmountChange(4000);
    expect(component.draft()['paidAmount']).toBe(4000);
    expect(component.draft()['paymentStatus']).toBe('partial');
    expect(component.computePackageRemainingDebt()).toBe(laserPreset.price - 4000);

    // Quick Expiry buttons
    const todayStr = component.todayIso;
    component.setDraftValue('startDate', todayStr);
    component.onPackageQuickExpiry(3);
    const expDate = new Date(todayStr);
    expDate.setMonth(expDate.getMonth() + 3);
    const expDateStr = `${expDate.getFullYear()}-${String(expDate.getMonth() + 1).padStart(2, '0')}-${String(expDate.getDate()).padStart(2, '0')}`;
    expect(component.draft()['expiresAt']).toBe(expDateStr);

    // sessionsProgress formatter
    expect(
      component.cellValue(
        { id: 'pkg_1', totalSessions: 8, remainingSessions: 6, usedSessions: 2 },
        { key: 'sessionsProgress', label: 'Seans Durumu' },
      ),
    ).toBe('2/8 Seans (6 Kalan)');

    // packageName formatter
    expect(
      component.cellValue(
        { id: 'pkg_1', packageName: 'Buz Lazer Epilasyon' },
        { key: 'packageName', label: 'Paket Adı' },
      ),
    ).toBe('Buz Lazer Epilasyon');

    // Test openEdit
    component.openEdit({
      id: 'pkg_edit_99',
      customerId: 'cust_pkg_1',
      customerName: 'Seda Erdem',
      packageName: 'Hydrafacial & Derin Cilt Bakımı',
      totalSessions: 6,
      remainingSessions: 4,
      usedSessions: 2,
      price: 7500,
      paidAmount: 7500,
      paymentStatus: 'paid',
      status: 'active',
      startDate: '2026-03-01',
      expiresAt: '2026-09-01',
    });
    expect(component.editingId()).toBe('pkg_edit_99');
    expect(component.draft()['packageName']).toBe('Hydrafacial & Derin Cilt Bakımı');
    expect(component.draft()['remainingSessions']).toBe(4);
    expect(component.draft()['price']).toBe(7500);
    expect(component.selectedPackagePresetId()).toBe('hydrafacial-medikal-cilt-6');
  });

  it('should initialize sessions workspace with clinical protocol defaults, customer package selection, parameter controls, and formatters', async () => {
    await TestBed.resetTestingModule();

    await TestBed.configureTestingModule({
      imports: [Workspace],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              data: { definition: WORKSPACES['sessions'] },
              queryParamMap: { get: () => null },
            },
          },
        },
        { provide: Router, useValue: routerMock },
        { provide: ApiClient, useValue: apiMock },
        { provide: BranchService, useValue: branchServiceMock },
        DefinitionsService,
        EntityLookupService,
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(Workspace);
    const component = fixture.componentInstance as any;

    expect(component.isSessionWorkspace()).toBe(true);

    // Open Create Modal
    component.openCreate();
    expect(component.drawerOpen()).toBe(true);
    expect(component.draft()['sessionNumber']).toBe(1);
    expect(component.draft()['bodyZone']).toBe('Tüm Vücut');
    expect(component.draft()['energyJcm2']).toBe(18);
    expect(component.draft()['durationMin']).toBe(30);
    expect(component.draft()['shotCount']).toBe(2500);
    expect(component.draft()['frequencyHz']).toBe(10);
    expect(component.draft()['coolingApplied']).toBe(true);
    expect(component.draft()['reaction']).toBe('normal');
    expect(component.draft()['status']).toBe('completed');
    expect(component.draft()['nextSessionDate']).toBeTruthy();

    // Danışan Seçimi
    const mockCustomer = {
      id: 'cust_ses_1',
      fullName: 'Deniz Kaya',
      phone: '0544 333 22 11',
      packages: [
        {
          id: 'pkg_ses_10',
          packageName: 'Buz Lazer Epilasyon (Tüm Vücut)',
          totalSessions: 8,
          completedSessions: 2,
          remainingSessions: 6,
          startDate: '2026-02-01',
          status: 'active',
          sessions: [],
        },
      ],
    };

    component.onSessionCustomerSelected(mockCustomer);
    expect(component.draft()['customerId']).toBe('cust_ses_1');
    expect(component.draft()['customerName']).toBe('Deniz Kaya');
    expect(component.draft()['phone']).toBe('0544 333 22 11');

    // Paket Seçimi ve Seans Sıra No Hesabı (completedSessions + 1 = 3)
    component.onSessionPackageSelect('pkg_ses_10');
    expect(component.draft()['customerPackageId']).toBe('pkg_ses_10');
    expect(component.draft()['packageName']).toBe('Buz Lazer Epilasyon (Tüm Vücut)');
    expect(component.draft()['sessionNumber']).toBe(3);

    // Uygulama Bölgesi Seçimi
    component.onSessionBodyZoneSelect('Tüm Bacak');
    expect(component.draft()['bodyZone']).toBe('Tüm Bacak');

    // Enerji Ayarlama Butonları (-0.5J, +1J)
    component.adjustSessionEnergy(1);
    expect(component.draft()['energyJcm2']).toBe(19);
    component.adjustSessionEnergy(-0.5);
    expect(component.draft()['energyJcm2']).toBe(18.5);

    // Atım Sayısı Hızlı Butonları (+500 atım)
    component.adjustSessionShots(500);
    expect(component.draft()['shotCount']).toBe(3000);

    // İşlem Süresi Butonları (+15 dk)
    component.adjustSessionDuration(15);
    expect(component.draft()['durationMin']).toBe(45);

    // Sonraki Randevu Hızlı Butonu (+21 Gün)
    component.onSessionQuickNextDate(21);
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + 21);
    const y = targetDate.getFullYear();
    const m = String(targetDate.getMonth() + 1).padStart(2, '0');
    const d = String(targetDate.getDate()).padStart(2, '0');
    expect(component.draft()['nextSessionDate']).toBe(`${y}-${m}-${d}`);

    // Tablo Formatlayıcıları: packageOrServiceName ve sessionNumberDisplay
    expect(
      component.cellValue(
        { id: 'ses_1', customerPackageId: 'pkg_1', packageName: 'Buz Lazer Epilasyon' },
        { key: 'packageOrServiceName', label: 'Paket / Hizmet' },
      ),
    ).toBe('📦 Buz Lazer Epilasyon');

    expect(
      component.cellValue(
        { id: 'ses_2' },
        { key: 'packageOrServiceName', label: 'Paket / Hizmet' },
      ),
    ).toBe('Münferit Seans');

    expect(
      component.cellValue(
        { id: 'ses_1', sessionNumber: 4 },
        { key: 'sessionNumberDisplay', label: 'Seans No' },
      ),
    ).toBe('4. Seans');

    // openEdit Test
    component.openEdit({
      id: 'ses_edit_123',
      customerId: 'cust_ses_1',
      customerName: 'Deniz Kaya',
      customerPackageId: 'pkg_ses_10',
      packageName: 'Buz Lazer Epilasyon (Tüm Vücut)',
      sessionNumber: 3,
      performedAt: '2026-10-28T14:30',
      deviceId: 'dev_soprano_1',
      staffId: 'stf_elif_1',
      staffName: 'Elif Yılmaz',
      roomId: 'room_1',
      bodyZone: 'Tüm Vücut',
      energyJcm2: 19.5,
      shotCount: 3200,
      durationMin: 40,
      frequencyHz: 10,
      coolingApplied: true,
      reaction: 'mild_erythema',
      status: 'completed',
      notes: 'Hafif kızarıklık oluştu, soğuk jel uygulandı.',
    });

    expect(component.editingId()).toBe('ses_edit_123');
    expect(component.draft()['sessionNumber']).toBe(3);
    expect(component.draft()['energyJcm2']).toBe(19.5);
    expect(component.draft()['shotCount']).toBe(3200);
    expect(component.draft()['reaction']).toBe('mild_erythema');
    expect(component.draft()['coolingApplied']).toBe(true);
    expect(component.draft()['notes']).toBe('Hafif kızarıklık oluştu, soğuk jel uygulandı.');
  });
});
