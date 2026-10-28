import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiClient } from '../../core/api-client';
import { BranchService } from '../../core/branch.service';
import { EntityLookupService } from '../../core/entity-lookup.service';
import { SmsService } from '../../core/sms/sms.service';
import { SmsSettings } from './sms-settings';

describe('SmsSettings Component', () => {
  let fixture: ComponentFixture<SmsSettings>;
  let component: SmsSettings;
  let apiMock: Record<string, ReturnType<typeof vi.fn>>;
  let branchServiceMock: {
    ensureBranches: ReturnType<typeof vi.fn>;
    branches: ReturnType<typeof vi.fn>;
    activeBranchId: ReturnType<typeof vi.fn>;
    currentBranch: ReturnType<typeof vi.fn>;
  };
  let entityLookupMock: {
    ensure: ReturnType<typeof vi.fn>;
    getRecords: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    localStorage.clear();

    apiMock = {
      list: vi.fn().mockReturnValue(of({ success: true, data: [] })),
      get: vi.fn().mockReturnValue(of({ success: true, data: {} })),
      create: vi.fn().mockReturnValue(of({ success: true, data: { id: 'doc_seeded_1' } })),
      update: vi.fn().mockReturnValue(of({ success: true, data: { id: 'doc_updated_1' } })),
      remove: vi.fn().mockReturnValue(of({ success: true, data: { id: 'doc_removed_1' } })),
      request: vi.fn().mockReturnValue(of({ success: true, data: {} })),
    };

    branchServiceMock = {
      ensureBranches: vi.fn().mockResolvedValue([]),
      branches: vi.fn().mockReturnValue([]),
      activeBranchId: vi.fn().mockReturnValue('branch_center_1'),
      currentBranch: vi.fn().mockReturnValue({ id: 'branch_center_1', name: 'Merkez Şube' }),
    };

    entityLookupMock = {
      ensure: vi.fn().mockResolvedValue([]),
      getRecords: vi.fn().mockReturnValue([
        { id: 'cust_1', fullName: 'Ayşe Kaya', phone: '+90 532 111 22 33' },
        { id: 'cust_2', fullName: 'Fatma Demir', phone: '+90 533 444 55 66' },
      ]),
    };

    await TestBed.configureTestingModule({
      imports: [SmsSettings],
      providers: [
        SmsService,
        { provide: ApiClient, useValue: apiMock },
        { provide: BranchService, useValue: branchServiceMock },
        { provide: EntityLookupService, useValue: entityLookupMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SmsSettings);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('initializes with popular SMS providers (Netgsm, İleti Merkezi, Mutlucell, VatanSMS, Twilio)', () => {
    expect(component['providers']().length).toBeGreaterThanOrEqual(5);
    const providerNames = component['providers']().map((p) => p.name);
    expect(providerNames).toContain('Netgsm');
    expect(providerNames).toContain('İleti Merkezi');
    expect(providerNames).toContain('Mutlucell');
    expect(providerNames).toContain('VatanSMS');
    expect(providerNames).toContain('Twilio Global');
  });

  it('identifies the active default provider correctly', () => {
    const def = component['defaultProvider']();
    expect(def).toBeDefined();
    expect(def.isDefault).toBe(true);
    expect(def.originator).toBeTruthy();
  });

  it('allows changing the default provider', () => {
    component['setDefaultProvider']('iletimerkezi');
    expect(component['defaultProvider']().id).toBe('iletimerkezi');
    expect(component['defaultProvider']().isDefault).toBe(true);
  });

  it('simulates testing provider connection successfully', async () => {
    const netgsm = component['providers']().find((p) => p.id === 'netgsm')!;
    component['selectedProvider'].set(netgsm);

    await component['testProviderConnection']();

    expect(component['testConnectionSuccess']()).toBe(true);
    const updated = component['providers']().find((p) => p.id === 'netgsm')!;
    expect(updated.lastTestStatus).toBe('success');
    expect(updated.lastTestedAt).toBeTruthy();
  });

  it('sends test SMS and registers log with decreased balance', async () => {
    const netgsm = component['providers']().find((p) => p.id === 'netgsm')!;
    const initialBalance = netgsm.balance;
    const initialLogCount = component['logs']().length;

    component['testSmsProvider'].set(netgsm);
    component['testSmsPhone'].set('+90 532 999 00 11');
    component['testSmsMessage'].set('Test doğrulama mesajı');

    await component['sendTestSms']();

    expect(component['testSmsFeedback']()).toContain('başarıyla iletildi');
    expect(component['logs']().length).toBe(initialLogCount + 1);
    expect(component['logs']()[0]?.recipientPhone).toBe('+90 532 999 00 11');

    const updatedNetgsm = component['providers']().find((p) => p.id === 'netgsm')!;
    expect(updatedNetgsm.balance).toBe(initialBalance - 1);
  });

  it('edits SMS template and appends dynamic placeholders', async () => {
    const tmpl = component['templates']()[0]!;
    component['openTemplateModal'](tmpl);

    expect(component['templateTitle']()).toBe(tmpl.title);
    component['insertPlaceholder']('uzman_adi');
    expect(component['templateContent']()).toContain('{{uzman_adi}}');

    await component['saveTemplate']();
    expect(component['templateModalOpen']()).toBe(false);
  });

  it('filters delivery logs based on query and status', () => {
    component['logSearchQuery'].set('Selin');
    const filtered = component['filteredLogs']();
    expect(filtered.every((l) => l.recipientName.includes('Selin'))).toBe(true);

    component['logSearchQuery'].set('');
    component['logStatusFilter'].set('delivered');
    expect(component['filteredLogs']().every((l) => l.status === 'delivered')).toBe(true);
  });

  it('sends direct SMS and updates delivery statistics', async () => {
    const initialSent = component['stats']().totalSentThisMonth;
    component['directPhone'].set('+90 533 111 22 33');
    component['directName'].set('Hande Erçel');
    component['directMessage'].set('Randevunuz yarın saat 15:00 için onaylanmıştır.');

    await component['sendDirectSms']();

    expect(component['directFeedback']()).toContain('başarıyla iletildi');
    expect(component['stats']().totalSentThisMonth).toBe(initialSent + 1);
  });

  it('selects customer from list and populates direct recipient information', () => {
    component['onDirectCustomerChange']('cust_1');
    expect(component['directCustomerId']()).toBe('cust_1');
    expect(component['directName']()).toBe('Ayşe Kaya');
    expect(component['directPhone']()).toBe('+90 532 111 22 33');

    component['clearSelectedCustomer']();
    expect(component['directCustomerId']()).toBe('');
    expect(component['directName']()).toBe('');
    expect(component['directPhone']()).toBe('');
  });

  it('triggers remote data sync successfully', async () => {
    await component['refreshData']();
    expect(apiMock['list']).toHaveBeenCalled();
  });
});
