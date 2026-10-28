import { DOCUMENT } from '@angular/common';
import { Service, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ApiClient } from '../api-client';
import { BeautyRecord } from '../beauty.model';
import { BranchService } from '../branch.service';
import {
  INITIAL_SMS_LOGS,
  INITIAL_SMS_PROVIDERS,
  INITIAL_SMS_TEMPLATES,
} from './sms-demo-data';
import {
  SmsLog,
  SmsLogStatus,
  SmsProvider,
  SmsProviderId,
  SmsStats,
  SmsTemplate,
} from './sms.model';

const STORAGE_KEY_PROVIDERS = 'odivon:sms:providers';
const STORAGE_KEY_TEMPLATES = 'odivon:sms:templates';
const STORAGE_KEY_LOGS = 'odivon:sms:logs';

@Service()
export class SmsService {
  private readonly api = inject(ApiClient);
  private readonly branchService = inject(BranchService);
  private readonly document = inject(DOCUMENT);

  // Core State Signals
  readonly loading = signal<boolean>(false);
  readonly isSyncing = signal<boolean>(false);
  readonly lastSyncedAt = signal<string | null>(null);

  readonly providers = signal<SmsProvider[]>(INITIAL_SMS_PROVIDERS);
  readonly templates = signal<SmsTemplate[]>(INITIAL_SMS_TEMPLATES);
  readonly logs = signal<SmsLog[]>(INITIAL_SMS_LOGS);

  // Derived: Default Provider
  readonly defaultProvider = computed<SmsProvider>(() => {
    return this.providers().find((p) => p.isDefault) ?? this.providers()[0];
  });

  // Derived: Dynamic KPI Statistics
  readonly stats = computed<SmsStats>(() => {
    const logsList = this.logs();
    const providersList = this.providers();

    const now = new Date();
    const curYear = now.getFullYear();
    const curMonth = now.getMonth();

    const sentThisMonth = logsList.filter((l) => {
      if (!l.sentAt) return false;
      const d = new Date(l.sentAt);
      return !isNaN(d.getTime()) && d.getFullYear() === curYear && d.getMonth() === curMonth;
    }).length;

    const deliveredCount = logsList.filter((l) => l.status === 'delivered').length;
    const deliveredRate =
      logsList.length > 0 ? Math.round((deliveredCount / logsList.length) * 100) : 98;

    const totalCredits = providersList.reduce((sum, p) => sum + (p.balance || 0), 0);
    const activeCount = providersList.filter((p) => p.isActive).length;

    return {
      totalSentThisMonth: sentThisMonth || logsList.length,
      deliveredRate,
      totalCreditsRemaining: totalCredits,
      activeProvidersCount: activeCount,
    };
  });

  constructor() {
    this.restoreFromLocal();
    void this.syncRemote();
  }

  // --- Local Storage Persistence ---

  private saveToLocal<T>(key: string, data: T): void {
    try {
      const storage = this.document.defaultView?.localStorage;
      if (storage) {
        storage.setItem(key, JSON.stringify(data));
      }
    } catch {
      // Ignore quota or disabled local storage errors
    }
  }

  private restoreFromLocal(): void {
    try {
      const storage = this.document.defaultView?.localStorage;
      if (!storage) return;

      const rawProv = storage.getItem(STORAGE_KEY_PROVIDERS);
      if (rawProv) {
        const parsed = JSON.parse(rawProv) as SmsProvider[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          this.providers.set(parsed);
        }
      }

      const rawTmpl = storage.getItem(STORAGE_KEY_TEMPLATES);
      if (rawTmpl) {
        const parsed = JSON.parse(rawTmpl) as SmsTemplate[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          this.templates.set(parsed);
        }
      }

      const rawLogs = storage.getItem(STORAGE_KEY_LOGS);
      if (rawLogs) {
        const parsed = JSON.parse(rawLogs) as SmsLog[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          this.logs.set(parsed);
        }
      }
    } catch {
      // Ignore bad json
    }
  }

  // --- Remote Synchronization with MainApi ---

  async syncRemote(): Promise<void> {
    this.loading.set(true);
    this.isSyncing.set(true);

    try {
      const [providersRes, templatesRes, logsRes] = await Promise.all([
        firstValueFrom(this.api.list<BeautyRecord>('sms-providers', { limit: 100 })).catch(
          () => null,
        ),
        firstValueFrom(this.api.list<BeautyRecord>('sms-templates', { limit: 100 })).catch(
          () => null,
        ),
        firstValueFrom(this.api.list<BeautyRecord>('sms-logs', { limit: 100 })).catch(
          () => null,
        ),
      ]);

      // 1. Providers
      const remoteProv = providersRes?.data ?? [];
      if (remoteProv.length === 0) {
        await this.seedInitialProviders();
      } else {
        this.reconcileProviders(remoteProv);
      }

      // 2. Templates
      const remoteTmpl = templatesRes?.data ?? [];
      if (remoteTmpl.length === 0) {
        await this.seedInitialTemplates();
      } else {
        this.reconcileTemplates(remoteTmpl);
      }

      // 3. Logs
      const remoteLogs = logsRes?.data ?? [];
      if (remoteLogs.length > 0) {
        this.reconcileLogs(remoteLogs);
      }

      this.lastSyncedAt.set(new Date().toISOString());
    } catch (err) {
      console.warn('MainApi SMS senkronizasyonu gerçekleştirilemedi:', err);
    } finally {
      this.loading.set(false);
      this.isSyncing.set(false);
    }
  }

  // --- Seeding Initial Records to MainApi ---

  private async seedInitialProviders(): Promise<void> {
    const seededList: SmsProvider[] = [];
    for (const prov of INITIAL_SMS_PROVIDERS) {
      try {
        const payload: Record<string, unknown> = {
          providerId: prov.id,
          providerName: prov.name,
          isActive: prov.isActive,
          isDefault: prov.isDefault,
          originator: prov.originator,
          balance: prov.balance,
          tagline: prov.tagline,
          badge: prov.badge ?? null,
          username: prov.credentials.username ?? null,
          password: prov.credentials.password ?? null,
          apiKey: prov.credentials.apiKey ?? null,
          apiSecret: prov.credentials.apiSecret ?? null,
          accountSid: prov.credentials.accountSid ?? null,
          authToken: prov.credentials.authToken ?? null,
          lastTestedAt: prov.lastTestedAt ?? null,
          lastTestStatus: prov.lastTestStatus ?? null,
        };

        const res = await firstValueFrom(
          this.api.create<BeautyRecord>('sms-providers', { data: payload }),
        ).catch(() => null);

        seededList.push({
          ...prov,
          firestoreDocId: res?.data?.id ?? undefined,
        });
      } catch {
        seededList.push(prov);
      }
    }

    if (seededList.length > 0) {
      this.providers.set(seededList);
      this.saveToLocal(STORAGE_KEY_PROVIDERS, seededList);
    }
  }

  private async seedInitialTemplates(): Promise<void> {
    const seededList: SmsTemplate[] = [];
    for (const tmpl of INITIAL_SMS_TEMPLATES) {
      try {
        const payload: Record<string, unknown> = {
          templateKey: tmpl.key,
          title: tmpl.title,
          content: tmpl.content,
          isAutoSend: tmpl.isAutoSend,
          triggerEvent: tmpl.triggerEvent,
          timingHours: tmpl.timingHours ?? null,
          defaultSenderTitle: tmpl.defaultSenderTitle ?? 'ODIVONPRO',
          category: tmpl.category,
          description: tmpl.description,
        };

        const res = await firstValueFrom(
          this.api.create<BeautyRecord>('sms-templates', { data: payload }),
        ).catch(() => null);

        seededList.push({
          ...tmpl,
          firestoreDocId: res?.data?.id ?? undefined,
        });
      } catch {
        seededList.push(tmpl);
      }
    }

    if (seededList.length > 0) {
      this.templates.set(seededList);
      this.saveToLocal(STORAGE_KEY_TEMPLATES, seededList);
    }
  }

  // --- Reconciliation Helpers ---

  private reconcileProviders(remoteList: BeautyRecord[]): void {
    const currentList = this.providers();
    const updated: SmsProvider[] = [];

    for (const row of remoteList) {
      const pId = (row['providerId'] as SmsProviderId) || (row.id as SmsProviderId);
      const defaultMeta = INITIAL_SMS_PROVIDERS.find((p) => p.id === pId);
      const existing = currentList.find((p) => p.id === pId);

      const prov: SmsProvider = {
        id: pId,
        firestoreDocId: row.id,
        name: (row['providerName'] as string) || (row['name'] as string) || defaultMeta?.name || 'SMS Sağlayıcı',
        tagline: (row['tagline'] as string) || defaultMeta?.tagline || '',
        badge: (row['badge'] as string) || defaultMeta?.badge,
        originator: (row['originator'] as string) || defaultMeta?.originator || 'ODIVONPRO',
        isActive: typeof row['isActive'] === 'boolean' ? row['isActive'] : existing?.isActive ?? true,
        isDefault: typeof row['isDefault'] === 'boolean' ? row['isDefault'] : existing?.isDefault ?? false,
        balance: typeof row['balance'] === 'number' ? row['balance'] : defaultMeta?.balance ?? 1500,
        lastTestedAt: (row['lastTestedAt'] as string) || existing?.lastTestedAt,
        lastTestStatus: (row['lastTestStatus'] as 'success' | 'failed' | 'untested') || existing?.lastTestStatus,
        credentials: {
          username: (row['username'] as string) || existing?.credentials.username,
          password: (row['password'] as string) || existing?.credentials.password,
          apiKey: (row['apiKey'] as string) || existing?.credentials.apiKey,
          apiSecret: (row['apiSecret'] as string) || existing?.credentials.apiSecret,
          accountSid: (row['accountSid'] as string) || existing?.credentials.accountSid,
          authToken: (row['authToken'] as string) || existing?.credentials.authToken,
        },
      };

      updated.push(prov);
    }

    // Ensure any standard providers not in remote are preserved
    for (const initP of INITIAL_SMS_PROVIDERS) {
      if (!updated.some((p) => p.id === initP.id)) {
        updated.push(initP);
      }
    }

    this.providers.set(updated);
    this.saveToLocal(STORAGE_KEY_PROVIDERS, updated);
  }

  private reconcileTemplates(remoteList: BeautyRecord[]): void {
    const currentList = this.templates();
    const updated: SmsTemplate[] = [];

    for (const row of remoteList) {
      const tKey = (row['templateKey'] as string) || (row['key'] as string) || row.id;
      const defaultMeta = INITIAL_SMS_TEMPLATES.find((t) => t.key === tKey);
      const existing = currentList.find((t) => t.key === tKey);

      const tmpl: SmsTemplate = {
        id: (row['id'] as string) || existing?.id || tKey,
        firestoreDocId: row.id,
        key: tKey,
        title: (row['title'] as string) || defaultMeta?.title || 'Şablon',
        description: (row['description'] as string) || defaultMeta?.description || '',
        category: (row['category'] as SmsTemplate['category']) || defaultMeta?.category || 'appointment',
        content: (row['content'] as string) || defaultMeta?.content || '',
        isAutoSend: typeof row['isAutoSend'] === 'boolean' ? row['isAutoSend'] : defaultMeta?.isAutoSend ?? true,
        triggerEvent: (row['triggerEvent'] as string) || defaultMeta?.triggerEvent || '',
        timingHours: typeof row['timingHours'] === 'number' ? row['timingHours'] : defaultMeta?.timingHours,
        defaultSenderTitle: (row['defaultSenderTitle'] as string) || defaultMeta?.defaultSenderTitle || 'ODIVONPRO',
      };

      updated.push(tmpl);
    }

    for (const initT of INITIAL_SMS_TEMPLATES) {
      if (!updated.some((t) => t.key === initT.key)) {
        updated.push(initT);
      }
    }

    this.templates.set(updated);
    this.saveToLocal(STORAGE_KEY_TEMPLATES, updated);
  }

  private reconcileLogs(remoteList: BeautyRecord[]): void {
    const updated: SmsLog[] = remoteList.map((row) => ({
      id: row.id,
      firestoreDocId: row.id,
      recipientPhone: (row['recipientPhone'] as string) || '',
      recipientName: (row['recipientName'] as string) || 'Alıcı',
      messageContent: (row['messageContent'] as string) || '',
      providerId: (row['providerId'] as string) || '',
      providerName: (row['providerName'] as string) || 'SMS Sağlayıcı',
      senderTitle: (row['senderTitle'] as string) || 'ODIVONPRO',
      sentAt: (row['sentAt'] as string) || (row['createdAt'] as string) || new Date().toISOString(),
      status: (row['status'] as SmsLogStatus) || 'delivered',
      smsCount: typeof row['smsCount'] === 'number' ? row['smsCount'] : 1,
      templateTitle: (row['templateTitle'] as string) || undefined,
      templateKey: (row['templateKey'] as string) || undefined,
      branchId: (row['branchId'] as string) || undefined,
      customerId: (row['customerId'] as string) || undefined,
      appointmentId: (row['appointmentId'] as string) || undefined,
    }));

    this.logs.set(updated);
    this.saveToLocal(STORAGE_KEY_LOGS, updated);
  }

  // --- CRUD Operations for Providers ---

  async saveProviderConfig(
    providerId: SmsProviderId,
    config: {
      originator: string;
      credentials: SmsProvider['credentials'];
    },
  ): Promise<void> {
    let targetDocId: string | undefined;

    this.providers.update((list) =>
      list.map((p) => {
        if (p.id === providerId) {
          targetDocId = p.firestoreDocId;
          return {
            ...p,
            originator: config.originator || p.originator,
            credentials: { ...config.credentials },
          };
        }
        return p;
      }),
    );

    this.saveToLocal(STORAGE_KEY_PROVIDERS, this.providers());

    const prov = this.providers().find((p) => p.id === providerId);
    if (!prov) return;

    const payload: Record<string, unknown> = {
      providerId: prov.id,
      providerName: prov.name,
      isActive: prov.isActive,
      isDefault: prov.isDefault,
      originator: prov.originator,
      balance: prov.balance,
      username: prov.credentials.username ?? null,
      password: prov.credentials.password ?? null,
      apiKey: prov.credentials.apiKey ?? null,
      apiSecret: prov.credentials.apiSecret ?? null,
      accountSid: prov.credentials.accountSid ?? null,
      authToken: prov.credentials.authToken ?? null,
    };

    if (targetDocId) {
      await firstValueFrom(
        this.api.update('sms-providers', targetDocId, { data: payload }),
      ).catch(() => null);
    } else {
      const res = await firstValueFrom(
        this.api.create<BeautyRecord>('sms-providers', { data: payload }),
      ).catch(() => null);
      if (res?.data?.id) {
        this.providers.update((list) =>
          list.map((p) => (p.id === providerId ? { ...p, firestoreDocId: res.data.id } : p)),
        );
        this.saveToLocal(STORAGE_KEY_PROVIDERS, this.providers());
      }
    }
  }

  async testProviderConnection(providerId: SmsProviderId): Promise<boolean> {
    const prov = this.providers().find((p) => p.id === providerId);
    if (!prov) return false;

    // Simulate verification ping
    await new Promise((r) => setTimeout(r, 600));

    const now = new Date().toISOString();
    const newBalance = prov.balance > 0 ? prov.balance : 1500;

    this.providers.update((list) =>
      list.map((p) =>
        p.id === providerId
          ? {
              ...p,
              lastTestedAt: now,
              lastTestStatus: 'success',
              balance: newBalance,
            }
          : p,
      ),
    );

    this.saveToLocal(STORAGE_KEY_PROVIDERS, this.providers());

    const updated = this.providers().find((p) => p.id === providerId);
    if (updated?.firestoreDocId) {
      await firstValueFrom(
        this.api.update('sms-providers', updated.firestoreDocId, {
          data: {
            lastTestedAt: now,
            lastTestStatus: 'success',
            balance: newBalance,
          },
        }),
      ).catch(() => null);
    }

    return true;
  }

  async setDefaultProvider(providerId: SmsProviderId): Promise<void> {
    this.providers.update((list) =>
      list.map((p) => ({
        ...p,
        isDefault: p.id === providerId,
        isActive: p.id === providerId ? true : p.isActive,
      })),
    );

    this.saveToLocal(STORAGE_KEY_PROVIDERS, this.providers());

    // Update backend for providers
    for (const p of this.providers()) {
      if (p.firestoreDocId) {
        void firstValueFrom(
          this.api.update('sms-providers', p.firestoreDocId, {
            data: {
              isDefault: p.isDefault,
              isActive: p.isActive,
            },
          }),
        ).catch(() => null);
      }
    }
  }

  async toggleProviderActive(providerId: SmsProviderId): Promise<void> {
    const prov = this.providers().find((p) => p.id === providerId);
    if (!prov) return;
    if (prov.isDefault && prov.isActive) return; // Cannot disable active default

    const newActiveState = !prov.isActive;
    this.providers.update((list) =>
      list.map((p) => (p.id === providerId ? { ...p, isActive: newActiveState } : p)),
    );

    this.saveToLocal(STORAGE_KEY_PROVIDERS, this.providers());

    if (prov.firestoreDocId) {
      await firstValueFrom(
        this.api.update('sms-providers', prov.firestoreDocId, {
          data: { isActive: newActiveState },
        }),
      ).catch(() => null);
    }
  }

  // --- Test & Direct SMS Sending ---

  async sendTestSms(
    providerId: SmsProviderId,
    phone: string,
    message: string,
  ): Promise<SmsLog> {
    const provider = this.providers().find((p) => p.id === providerId);
    if (!provider) throw new Error('SMS Sağlayıcı bulunamadı.');

    await new Promise((r) => setTimeout(r, 600));

    // Decrement balance
    const updatedBalance = Math.max(0, provider.balance - 1);
    this.providers.update((list) =>
      list.map((p) => (p.id === providerId ? { ...p, balance: updatedBalance } : p)),
    );
    this.saveToLocal(STORAGE_KEY_PROVIDERS, this.providers());

    // Update provider balance on backend
    if (provider.firestoreDocId) {
      void firstValueFrom(
        this.api.update('sms-providers', provider.firestoreDocId, {
          data: { balance: updatedBalance },
        }),
      ).catch(() => null);
    }

    // Create log
    const branchId =
      this.branchService.activeBranchId() || this.branchService.currentBranch()?.id || undefined;
    const now = new Date().toISOString();

    const logData: Record<string, unknown> = {
      recipientPhone: phone,
      recipientName: 'Test Alıcısı',
      messageContent: message,
      providerId: provider.id,
      providerName: provider.name,
      senderTitle: provider.originator,
      status: 'delivered',
      smsCount: 1,
      templateTitle: 'Bağlantı Test Mesajı',
      sentAt: now,
    };

    let docId = `log_${Date.now()}`;
    try {
      const res = await firstValueFrom(
        this.api.create<BeautyRecord>('sms-logs', { data: logData, branchId }),
      ).catch(() => null);
      if (res?.data?.id) {
        docId = res.data.id;
      }
    } catch {
      // Local fallback
    }

    const newLog: SmsLog = {
      id: docId,
      firestoreDocId: docId,
      recipientPhone: phone,
      recipientName: 'Test Alıcısı',
      messageContent: message,
      providerId: provider.id,
      providerName: provider.name,
      senderTitle: provider.originator,
      sentAt: now,
      status: 'delivered',
      smsCount: 1,
      templateTitle: 'Bağlantı Test Mesajı',
      branchId,
    };

    this.logs.update((l) => [newLog, ...l]);
    this.saveToLocal(STORAGE_KEY_LOGS, this.logs());

    return newLog;
  }

  async sendDirectSms(options: {
    phone: string;
    name?: string;
    message: string;
    templateKey?: string;
    customerId?: string;
    smsCount: number;
  }): Promise<SmsLog> {
    const prov = this.defaultProvider();
    await new Promise((r) => setTimeout(r, 500));

    const updatedBalance = Math.max(0, prov.balance - options.smsCount);
    this.providers.update((list) =>
      list.map((p) => (p.id === prov.id ? { ...p, balance: updatedBalance } : p)),
    );
    this.saveToLocal(STORAGE_KEY_PROVIDERS, this.providers());

    if (prov.firestoreDocId) {
      void firstValueFrom(
        this.api.update('sms-providers', prov.firestoreDocId, {
          data: { balance: updatedBalance },
        }),
      ).catch(() => null);
    }

    const branchId =
      this.branchService.activeBranchId() || this.branchService.currentBranch()?.id || undefined;
    const now = new Date().toISOString();

    const logData: Record<string, unknown> = {
      recipientPhone: options.phone.trim(),
      recipientName: options.name?.trim() || 'Doğrudan Alıcı',
      messageContent: options.message.trim(),
      providerId: prov.id,
      providerName: prov.name,
      senderTitle: prov.originator,
      status: 'delivered',
      smsCount: options.smsCount,
      templateTitle: 'Doğrudan Gönderim',
      templateKey: options.templateKey ?? 'dogrudan-gonderim',
      customerId: options.customerId ?? null,
      sentAt: now,
    };

    let docId = `log_${Date.now()}`;
    try {
      const res = await firstValueFrom(
        this.api.create<BeautyRecord>('sms-logs', { data: logData, branchId }),
      ).catch(() => null);
      if (res?.data?.id) {
        docId = res.data.id;
      }
    } catch {
      // Local fallback
    }

    const newLog: SmsLog = {
      id: docId,
      firestoreDocId: docId,
      recipientPhone: options.phone.trim(),
      recipientName: options.name?.trim() || 'Doğrudan Alıcı',
      messageContent: options.message.trim(),
      providerId: prov.id,
      providerName: prov.name,
      senderTitle: prov.originator,
      sentAt: now,
      status: 'delivered',
      smsCount: options.smsCount,
      templateTitle: 'Doğrudan Gönderim',
      templateKey: options.templateKey,
      customerId: options.customerId,
      branchId,
    };

    this.logs.update((l) => [newLog, ...l]);
    this.saveToLocal(STORAGE_KEY_LOGS, this.logs());

    return newLog;
  }

  // --- Template Operations ---

  async saveTemplate(
    templateId: string,
    updates: {
      title: string;
      content: string;
      isAutoSend: boolean;
      defaultSenderTitle: string;
    },
  ): Promise<void> {
    let targetDocId: string | undefined;

    this.templates.update((list) =>
      list.map((t) => {
        if (t.id === templateId || t.key === templateId) {
          targetDocId = t.firestoreDocId;
          return {
            ...t,
            title: updates.title.trim() || t.title,
            content: updates.content.trim() || t.content,
            isAutoSend: updates.isAutoSend,
            defaultSenderTitle: updates.defaultSenderTitle.trim() || 'ODIVONPRO',
          };
        }
        return t;
      }),
    );

    this.saveToLocal(STORAGE_KEY_TEMPLATES, this.templates());

    const tmpl = this.templates().find((t) => t.id === templateId || t.key === templateId);
    if (!tmpl) return;

    const payload: Record<string, unknown> = {
      templateKey: tmpl.key,
      title: tmpl.title,
      content: tmpl.content,
      isAutoSend: tmpl.isAutoSend,
      triggerEvent: tmpl.triggerEvent,
      timingHours: tmpl.timingHours ?? null,
      defaultSenderTitle: tmpl.defaultSenderTitle ?? 'ODIVONPRO',
      category: tmpl.category,
      description: tmpl.description,
    };

    if (targetDocId) {
      await firstValueFrom(
        this.api.update('sms-templates', targetDocId, { data: payload }),
      ).catch(() => null);
    } else {
      const res = await firstValueFrom(
        this.api.create<BeautyRecord>('sms-templates', { data: payload }),
      ).catch(() => null);
      if (res?.data?.id) {
        this.templates.update((list) =>
          list.map((t) => (t.id === templateId ? { ...t, firestoreDocId: res.data.id } : t)),
        );
        this.saveToLocal(STORAGE_KEY_TEMPLATES, this.templates());
      }
    }
  }

  async toggleTemplateAutoSend(templateId: string): Promise<void> {
    const tmpl = this.templates().find((t) => t.id === templateId || t.key === templateId);
    if (!tmpl) return;

    const newAutoSend = !tmpl.isAutoSend;
    this.templates.update((list) =>
      list.map((t) => (t.id === tmpl.id ? { ...t, isAutoSend: newAutoSend } : t)),
    );

    this.saveToLocal(STORAGE_KEY_TEMPLATES, this.templates());

    if (tmpl.firestoreDocId) {
      await firstValueFrom(
        this.api.update('sms-templates', tmpl.firestoreDocId, {
          data: { isAutoSend: newAutoSend },
        }),
      ).catch(() => null);
    }
  }
}
