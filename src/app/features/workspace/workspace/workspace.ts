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
import { CustomerConsultation, CustomerProfile, calculateAge } from '../../../core/customer/customer.model';
import { DEMO_CUSTOMERS } from '../../../core/customer/customer-demo-data';
import { DEMO_CONSULTATIONS } from '../../../core/customer/consultation-demo-data';

type DraftValue = string | number | boolean;
type Draft = Record<string, DraftValue>;

@Component({
  imports: [
    PageHeader,
    SlideOver,
    StatusBadge,
    ServiceWizard,
    CustomerDetailModal,
    CustomerFormModal,
    DecimalPipe,
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
  protected readonly selectedCustomer = signal<CustomerProfile | null>(null);
  protected readonly customerDetailOpen = signal<boolean>(false);
  protected readonly customerDetailInitialTab = signal<DetailTab>('overview');
  protected readonly customerFormOpen = signal<boolean>(false);
  protected readonly seedingDemoCustomers = signal<boolean>(false);
  protected readonly seedingDemoConsultations = signal<boolean>(false);

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
  protected readonly rows = computed(() => {
    const query = this.search().trim().toLocaleLowerCase('tr');
    const status = this.statusFilter();
    return (this.remote.value() ?? []).filter((row) => {
      const matchesQuery = !query || JSON.stringify(row).toLocaleLowerCase('tr').includes(query);
      const matchesStatus = !status || row.status === status;
      return matchesQuery && matchesStatus;
    });
  });

  protected readonly hotLeadsCount = computed(() => {
    return this.rows().filter((r) => r['interestLevel'] === 'high').length;
  });
  protected readonly totalQuotedPrice = computed(() => {
    return this.rows().reduce((sum, r) => sum + (Number(r['quotedPrice']) || 0), 0);
  });
  protected readonly convertedConsultationCount = computed(() => {
    return this.rows().filter((r) => r.status === 'converted').length;
  });
  protected readonly complete = computed(() =>
    (this.definition.fields ?? [])
      .filter((field) => field.required)
      .every((field) => {
        const value = this.draft()[field.key];
        if (typeof value === 'number') {
          return Number.isFinite(value) && (field.min === undefined || value >= field.min);
        }
        return String(value ?? '').trim() !== '';
      }),
  );

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
  }

  protected updateFilter(target: 'branch' | 'status', event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    target === 'branch' ? this.branchFilter.set(value) : this.statusFilter.set(value);
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
    this.editingId.set(null);
    this.draft.set(this.emptyDraft());
    this.feedback.set('');
    this.drawerOpen.set(true);
  }

  protected openEdit(row: BeautyRecord): void {
    const next = this.emptyDraft();
    for (const field of this.definition.fields ?? []) {
      const value = row[field.key];
      if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
        next[field.key] = this.inputValue(field, value);
      }
    }
    if (typeof row.branchId === 'string') next['branchId'] = row.branchId;
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
