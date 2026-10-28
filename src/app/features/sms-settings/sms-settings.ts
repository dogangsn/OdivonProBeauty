import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { EntityLookupService } from '../../core/entity-lookup.service';
import { SmsService } from '../../core/sms/sms.service';
import {
  SmsLogStatus,
  SmsProvider,
  SmsProviderId,
  SmsTemplate,
} from '../../core/sms/sms.model';
import { PageHeader } from '../../shared/page-header/page-header';

@Component({
  imports: [DatePipe, DecimalPipe, FormsModule, PageHeader],
  selector: 'app-sms-settings',
  styleUrl: './sms-settings.css',
  templateUrl: './sms-settings.html',
})
export class SmsSettings implements OnInit {
  private readonly smsService = inject(SmsService);
  private readonly entityLookup = inject(EntityLookupService);

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

  // Sync & Loading State from SmsService
  protected readonly loading = this.smsService.loading;
  protected readonly isSyncing = this.smsService.isSyncing;
  protected readonly lastSyncedAt = this.smsService.lastSyncedAt;

  // Real data signals from SmsService
  protected readonly providers = this.smsService.providers;
  protected readonly templates = this.smsService.templates;
  protected readonly logs = this.smsService.logs;
  protected readonly stats = this.smsService.stats;
  protected readonly defaultProvider = this.smsService.defaultProvider;

  // Registered customers for Direct SMS selector
  protected readonly registeredCustomers = computed(() => {
    return this.entityLookup.getRecords('customers');
  });

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
  protected readonly directCustomerId = signal('');
  protected readonly directPhone = signal('');
  protected readonly directName = signal('');
  protected readonly directMessage = signal('');
  protected readonly directSelectedTemplateId = signal('');
  protected readonly directSending = signal(false);
  protected readonly directFeedback = signal<string | null>(null);

  ngOnInit(): void {
    void this.entityLookup.ensure('customers');
  }

  // Refresh data from MainApi
  protected async refreshData(): Promise<void> {
    await this.smsService.syncRemote();
  }

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

    const success = await this.smsService.testProviderConnection(provider.id);

    this.testingConnection.set(false);
    this.testConnectionSuccess.set(success);
  }

  protected async saveProviderConfig(): Promise<void> {
    const provider = this.selectedProvider();
    if (!provider) return;

    await this.smsService.saveProviderConfig(provider.id, {
      originator: this.configOriginator().trim() || provider.originator,
      credentials: {
        username: this.configUsername().trim() || undefined,
        password: this.configPassword().trim() || undefined,
        apiKey: this.configApiKey().trim() || undefined,
        apiSecret: this.configApiSecret().trim() || undefined,
        accountSid: this.configAccountSid().trim() || undefined,
        authToken: this.configAuthToken().trim() || undefined,
      },
    });

    this.closeConfigModal();
  }

  protected setDefaultProvider(providerId: SmsProviderId): void {
    void this.smsService.setDefaultProvider(providerId);
  }

  protected toggleProviderActive(provider: SmsProvider): void {
    void this.smsService.toggleProviderActive(provider.id);
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

    try {
      await this.smsService.sendTestSms(
        provider.id,
        this.testSmsPhone(),
        this.testSmsMessage(),
      );
      this.testSmsFeedback.set(
        `${this.testSmsPhone()} numarasına test SMS’i başarıyla iletildi.`,
      );
    } catch {
      this.testSmsFeedback.set('SMS iletilirken bir hata oluştu.');
    } finally {
      this.sendingTestSms.set(false);
    }
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

  protected async saveTemplate(): Promise<void> {
    const tmpl = this.selectedTemplate();
    if (!tmpl) return;

    await this.smsService.saveTemplate(tmpl.id, {
      title: this.templateTitle().trim() || tmpl.title,
      content: this.templateContent().trim() || tmpl.content,
      isAutoSend: this.templateAutoSend(),
      defaultSenderTitle: this.templateSenderTitle().trim() || 'ODIVONPRO',
    });

    this.closeTemplateModal();
  }

  protected toggleTemplateAutoSend(tmpl: SmsTemplate): void {
    void this.smsService.toggleTemplateAutoSend(tmpl.id);
  }

  // --- Direct SMS Operations ---

  protected onDirectCustomerChange(customerId: string): void {
    this.directCustomerId.set(customerId);
    if (!customerId) return;

    const customers = this.registeredCustomers();
    const cust = customers.find((c) => c.id === customerId);
    if (cust) {
      const name = (cust['fullName'] as string) || (cust['name'] as string) || '';
      const phone = (cust['phone'] as string) || '';
      this.directName.set(name);
      this.directPhone.set(phone);

      // If a template is currently selected, re-interpolate with customer name
      if (this.directSelectedTemplateId()) {
        const tmpl = this.templates().find((t) => t.id === this.directSelectedTemplateId());
        if (tmpl) {
          let content = tmpl.content;
          if (name) {
            content = content.replace(/\{\{musteri_adi\}\}/g, name);
          }
          this.directMessage.set(content);
        }
      }
    }
  }

  protected clearSelectedCustomer(): void {
    this.directCustomerId.set('');
    this.directName.set('');
    this.directPhone.set('');
  }

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

    const smsCount = this.directMessageSmsCount().smsCount;
    const phone = this.directPhone();

    try {
      await this.smsService.sendDirectSms({
        phone: this.directPhone(),
        name: this.directName().trim() || 'Doğrudan Alıcı',
        message: this.directMessage().trim(),
        templateKey: this.directSelectedTemplateId() || undefined,
        customerId: this.directCustomerId() || undefined,
        smsCount,
      });

      this.directFeedback.set(
        `${phone} numarasına ${smsCount} adet SMS başarıyla iletildi.`,
      );

      // Reset form
      this.directPhone.set('');
      this.directName.set('');
      this.directCustomerId.set('');
      this.directMessage.set('');
    } catch {
      this.directFeedback.set('SMS gönderimi sırasında bir hata oluştu.');
    } finally {
      this.directSending.set(false);
    }
  }
}
