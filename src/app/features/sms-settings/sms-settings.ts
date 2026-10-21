import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  INITIAL_SMS_LOGS,
  INITIAL_SMS_PROVIDERS,
  INITIAL_SMS_STATS,
  INITIAL_SMS_TEMPLATES,
} from '../../core/sms/sms-demo-data';
import {
  SmsLog,
  SmsLogStatus,
  SmsProvider,
  SmsProviderId,
  SmsStats,
  SmsTemplate,
} from '../../core/sms/sms.model';

@Component({
  imports: [DatePipe, DecimalPipe, FormsModule],
  selector: 'app-sms-settings',
  styleUrl: './sms-settings.css',
  templateUrl: './sms-settings.html',
})
export class SmsSettings {
  readonly placeholderList = [
    'musteri_adi',
    'randevu_tarihi',
    'randevu_saati',
    'hizmet_adi',
    'uzman_adi',
    'sube_adi',
    'odeme_linki',
    'kalan_seans',
  ] as const;

  formatPlaceholder(token: string): string {
    return '+ {{' + token + '}}';
  }

  // Navigation tabs
  protected readonly activeTab = signal<'providers' | 'templates' | 'logs' | 'direct'>('providers');

  // Core state signals
  protected readonly providers = signal<SmsProvider[]>(INITIAL_SMS_PROVIDERS);
  protected readonly templates = signal<SmsTemplate[]>(INITIAL_SMS_TEMPLATES);
  protected readonly logs = signal<SmsLog[]>(INITIAL_SMS_LOGS);
  protected readonly stats = signal<SmsStats>(INITIAL_SMS_STATS);

  // Search & Filters for Logs
  protected readonly logSearchQuery = signal('');
  protected readonly logStatusFilter = signal<'all' | SmsLogStatus>('all');

  // Provider Config Modal
  protected readonly configModalOpen = signal(false);
  protected readonly selectedProvider = signal<SmsProvider | null>(null);
  protected readonly configOriginator = signal('');
  protected readonly configUsername = signal('');
  protected readonly configPassword = signal('');
  protected readonly configApiKey = signal('');
  protected readonly configApiSecret = signal('');
  protected readonly configAccountSid = signal('');
  protected readonly configAuthToken = signal('');
  protected readonly testingConnection = signal(false);
  protected readonly testConnectionSuccess = signal<boolean | null>(null);

  // Test SMS Modal
  protected readonly testSmsModalOpen = signal(false);
  protected readonly testSmsProvider = signal<SmsProvider | null>(null);
  protected readonly testSmsPhone = signal('+90 532 000 00 00');
  protected readonly testSmsMessage = signal('Bu bir OdivonPro Güzellik Merkezi test SMS mesajıdır.');
  protected readonly sendingTestSms = signal(false);
  protected readonly testSmsFeedback = signal<string | null>(null);

  // Template Editor Modal
  protected readonly templateModalOpen = signal(false);
  protected readonly selectedTemplate = signal<SmsTemplate | null>(null);
  protected readonly templateTitle = signal('');
  protected readonly templateContent = signal('');
  protected readonly templateAutoSend = signal(true);
  protected readonly templateTriggerEvent = signal('');
  protected readonly templateSenderTitle = signal('ODIVONPRO');

  // Direct Sender Form
  protected readonly directPhone = signal('');
  protected readonly directName = signal('');
  protected readonly directMessage = signal('');
  protected readonly directSelectedTemplateId = signal('');
  protected readonly directSending = signal(false);
  protected readonly directFeedback = signal<string | null>(null);

  // Computed: Default active provider
  protected readonly defaultProvider = computed(() => {
    return this.providers().find((p) => p.isDefault) ?? this.providers()[0];
  });

  // Computed: Filtered Logs
  protected readonly filteredLogs = computed(() => {
    const q = this.logSearchQuery().toLowerCase().trim();
    const st = this.logStatusFilter();

    return this.logs().filter((log) => {
      const matchQuery =
        !q ||
        log.recipientName.toLowerCase().includes(q) ||
        log.recipientPhone.toLowerCase().includes(q) ||
        log.messageContent.toLowerCase().includes(q);

      const matchStatus = st === 'all' || log.status === st;

      return matchQuery && matchStatus;
    });
  });

  // Computed character & SMS count helper
  protected readonly currentTemplateSmsCount = computed(() => {
    const len = this.templateContent().length;
    if (len === 0) return { chars: 0, smsCount: 1, remaining: 160 };
    const smsCount = Math.ceil(len / 160) || 1;
    const remaining = smsCount * 160 - len;
    return { chars: len, smsCount, remaining };
  });

  protected readonly directMessageSmsCount = computed(() => {
    const len = this.directMessage().length;
    if (len === 0) return { chars: 0, smsCount: 1, remaining: 160 };
    const smsCount = Math.ceil(len / 160) || 1;
    const remaining = smsCount * 160 - len;
    return { chars: len, smsCount, remaining };
  });

  // Tab switching
  protected setTab(tab: 'providers' | 'templates' | 'logs' | 'direct'): void {
    this.activeTab.set(tab);
  }

  // --- Provider Operations ---

  protected openConfigModal(provider: SmsProvider): void {
    this.selectedProvider.set(provider);
    this.configOriginator.set(provider.originator);
    this.configUsername.set(provider.credentials.username ?? '');
    this.configPassword.set(provider.credentials.password ?? '');
    this.configApiKey.set(provider.credentials.apiKey ?? '');
    this.configApiSecret.set(provider.credentials.apiSecret ?? '');
    this.configAccountSid.set(provider.credentials.accountSid ?? '');
    this.configAuthToken.set(provider.credentials.authToken ?? '');
    this.testConnectionSuccess.set(null);
    this.configModalOpen.set(true);
  }

  protected closeConfigModal(): void {
    this.configModalOpen.set(false);
    this.selectedProvider.set(null);
  }

  protected async testProviderConnection(): Promise<void> {
    const provider = this.selectedProvider();
    if (!provider) return;

    this.testingConnection.set(true);
    this.testConnectionSuccess.set(null);

    // Simulate API test ping
    await new Promise((r) => setTimeout(r, 800));

    this.testingConnection.set(false);
    this.testConnectionSuccess.set(true);

    // Update tested provider info
    this.providers.update((list) =>
      list.map((p) =>
        p.id === provider.id
          ? {
              ...p,
              lastTestedAt: new Date().toISOString(),
              lastTestStatus: 'success',
              balance: p.balance > 0 ? p.balance : 1500,
            }
          : p
      )
    );
  }

  protected saveProviderConfig(): void {
    const provider = this.selectedProvider();
    if (!provider) return;

    this.providers.update((list) =>
      list.map((p) =>
        p.id === provider.id
          ? {
              ...p,
              originator: this.configOriginator().trim() || p.originator,
              credentials: {
                username: this.configUsername().trim() || undefined,
                password: this.configPassword().trim() || undefined,
                apiKey: this.configApiKey().trim() || undefined,
                apiSecret: this.configApiSecret().trim() || undefined,
                accountSid: this.configAccountSid().trim() || undefined,
                authToken: this.configAuthToken().trim() || undefined,
              },
            }
          : p
      )
    );

    this.closeConfigModal();
  }

  protected setDefaultProvider(providerId: SmsProviderId): void {
    this.providers.update((list) =>
      list.map((p) => ({
        ...p,
        isDefault: p.id === providerId,
        isActive: p.id === providerId ? true : p.isActive,
      }))
    );
  }

  protected toggleProviderActive(provider: SmsProvider): void {
    if (provider.isDefault && provider.isActive) {
      return; // Cannot deactivate current default provider
    }

    this.providers.update((list) =>
      list.map((p) => (p.id === provider.id ? { ...p, isActive: !p.isActive } : p))
    );
  }

  // --- Test SMS Operations ---

  protected openTestSmsModal(provider: SmsProvider): void {
    this.testSmsProvider.set(provider);
    this.testSmsFeedback.set(null);
    this.testSmsModalOpen.set(true);
  }

  protected closeTestSmsModal(): void {
    this.testSmsModalOpen.set(false);
    this.testSmsProvider.set(null);
  }

  protected async sendTestSms(): Promise<void> {
    const provider = this.testSmsProvider();
    if (!provider) return;

    this.sendingTestSms.set(true);
    this.testSmsFeedback.set(null);

    await new Promise((r) => setTimeout(r, 700));

    this.sendingTestSms.set(false);
    this.testSmsFeedback.set(`${this.testSmsPhone()} numarasına test SMS’i başarıyla iletildi.`);

    // Decrement balance
    this.providers.update((list) =>
      list.map((p) => (p.id === provider.id ? { ...p, balance: Math.max(0, p.balance - 1) } : p))
    );

    // Add to delivery log
    const newLog: SmsLog = {
      id: `log-${Date.now()}`,
      recipientPhone: this.testSmsPhone(),
      recipientName: 'Test Alıcısı',
      messageContent: this.testSmsMessage(),
      providerName: provider.name,
      senderTitle: provider.originator,
      sentAt: new Date().toISOString(),
      status: 'delivered',
      smsCount: 1,
      templateTitle: 'Bağlantı Test Mesajı',
    };

    this.logs.update((l) => [newLog, ...l]);
    this.stats.update((st) => ({
      ...st,
      totalSentThisMonth: st.totalSentThisMonth + 1,
      totalCreditsRemaining: Math.max(0, st.totalCreditsRemaining - 1),
    }));
  }

  // --- Template Operations ---

  protected openTemplateModal(tmpl: SmsTemplate): void {
    this.selectedTemplate.set(tmpl);
    this.templateTitle.set(tmpl.title);
    this.templateContent.set(tmpl.content);
    this.templateAutoSend.set(tmpl.isAutoSend);
    this.templateTriggerEvent.set(tmpl.triggerEvent);
    this.templateSenderTitle.set(tmpl.defaultSenderTitle ?? 'ODIVONPRO');
    this.templateModalOpen.set(true);
  }

  protected closeTemplateModal(): void {
    this.templateModalOpen.set(false);
    this.selectedTemplate.set(null);
  }

  protected insertPlaceholder(token: string): void {
    this.templateContent.update((c) => c + ` {{${token}}}`);
  }

  protected saveTemplate(): void {
    const tmpl = this.selectedTemplate();
    if (!tmpl) return;

    this.templates.update((list) =>
      list.map((t) =>
        t.id === tmpl.id
          ? {
              ...t,
              title: this.templateTitle().trim() || t.title,
              content: this.templateContent().trim() || t.content,
              isAutoSend: this.templateAutoSend(),
              defaultSenderTitle: this.templateSenderTitle().trim() || 'ODIVONPRO',
            }
          : t
      )
    );

    this.closeTemplateModal();
  }

  protected toggleTemplateAutoSend(tmpl: SmsTemplate): void {
    this.templates.update((list) =>
      list.map((t) => (t.id === tmpl.id ? { ...t, isAutoSend: !t.isAutoSend } : t))
    );
  }

  // --- Direct SMS Operations ---

  protected onDirectTemplateChange(templateId: string): void {
    this.directSelectedTemplateId.set(templateId);
    const tmpl = this.templates().find((t) => t.id === templateId);
    if (tmpl) {
      let content = tmpl.content;
      if (this.directName()) {
        content = content.replace(/\{\{musteri_adi\}\}/g, this.directName());
      }
      this.directMessage.set(content);
    }
  }

  protected async sendDirectSms(): Promise<void> {
    if (!this.directPhone() || !this.directMessage()) return;

    this.directSending.set(true);
    this.directFeedback.set(null);

    await new Promise((r) => setTimeout(r, 600));

    const prov = this.defaultProvider();
    const smsCount = this.directMessageSmsCount().smsCount;

    // Add log
    const newLog: SmsLog = {
      id: `log-${Date.now()}`,
      recipientPhone: this.directPhone(),
      recipientName: this.directName().trim() || 'Doğrudan Alıcı',
      messageContent: this.directMessage().trim(),
      providerName: prov.name,
      senderTitle: prov.originator,
      sentAt: new Date().toISOString(),
      status: 'delivered',
      smsCount,
      templateTitle: 'Doğrudan Gönderim',
    };

    this.logs.update((l) => [newLog, ...l]);

    // Decrement provider balance
    this.providers.update((list) =>
      list.map((p) => (p.id === prov.id ? { ...p, balance: Math.max(0, p.balance - smsCount) } : p))
    );

    this.stats.update((st) => ({
      ...st,
      totalSentThisMonth: st.totalSentThisMonth + smsCount,
      totalCreditsRemaining: Math.max(0, st.totalCreditsRemaining - smsCount),
    }));

    this.directSending.set(false);
    this.directFeedback.set(
      `${this.directPhone()} numarasına ${smsCount} adet SMS başarıyla iletildi.`
    );

    // Reset inputs
    this.directPhone.set('');
    this.directName.set('');
    this.directMessage.set('');
  }
}
