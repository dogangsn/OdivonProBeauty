import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { SmsSettings } from './sms-settings';

describe('SmsSettings Component', () => {
  let fixture: ComponentFixture<SmsSettings>;
  let component: SmsSettings;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SmsSettings],
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

  it('edits SMS template and appends dynamic placeholders', () => {
    const tmpl = component['templates']()[0]!;
    component['openTemplateModal'](tmpl);

    expect(component['templateTitle']()).toBe(tmpl.title);
    component['insertPlaceholder']('uzman_adi');
    expect(component['templateContent']()).toContain('{{uzman_adi}}');

    component['saveTemplate']();
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
});
