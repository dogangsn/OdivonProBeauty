import { Component, computed, inject, resource, signal } from '@angular/core';
import { FormField, form, required, submit } from '@angular/forms/signals';
import { FullCalendarModule } from '@fullcalendar/angular';
import { CalendarOptions, EventInput } from 'fullcalendar';
import dayGridPlugin from 'fullcalendar/daygrid';
import interactionPlugin from 'fullcalendar/interaction';
import timeGridPlugin from 'fullcalendar/timegrid';
import breezyThemePlugin from 'fullcalendar/themes/breezy';
import { firstValueFrom } from 'rxjs';
import { ApiClient } from '../../../core/api-client';
import { BeautyRecord, BranchRecord } from '../../../core/beauty.model';
import { CustomerProfile } from '../../../core/customer/customer.model';
import { DefinitionsService } from '../../../core/definitions/definitions.service';
import { CustomerCombobox } from '../../../shared/components/customer-combobox/customer-combobox';
import { CustomerFormModal } from '../../../shared/components/customer-form-modal/customer-form-modal';
import {
  SearchableSelect,
  SearchableSelectOption,
} from '../../../shared/components/searchable-select/searchable-select';
import { PageHeader } from '../../../shared/page-header/page-header';
import { SlideOver } from '../../../shared/slide-over/slide-over';

interface AppointmentForm {
  branchId: string;
  customerId: string;
  staffId: string;
  serviceId: string;
  roomId: string;
  deviceId: string;
  startAt: string;
  endAt: string;
  notes: string;
}

@Component({
  imports: [
    CustomerCombobox,
    CustomerFormModal,
    FormField,
    FullCalendarModule,
    PageHeader,
    SearchableSelect,
    SlideOver,
  ],
  selector: 'app-calendar',
  styleUrl: './calendar.css',
  templateUrl: './calendar.html',
})
export class Calendar {
  private readonly api = inject(ApiClient);
  private readonly definitions = inject(DefinitionsService);
  protected readonly drawerOpen = signal(false);
  protected readonly saving = signal(false);
  protected readonly error = signal('');
  protected readonly branchId = signal('');
  protected readonly visibleRange = signal({
    from: new Date().toISOString(),
    to: new Date(Date.now() + 7 * 86_400_000).toISOString(),
  });
  protected readonly branches = this.lookup<BranchRecord>('branches', false);
  protected readonly customers = this.lookup('customers');
  protected readonly staff = this.lookup('staff');
  protected readonly services = this.lookup('services');
  protected readonly rooms = this.lookup('rooms', false);
  protected readonly devices = this.lookup('devices', false);

  // Customer creation modal & selection state
  protected readonly isCustomerModalOpen = signal(false);
  protected readonly newCustomerInitialData = signal<Partial<CustomerProfile> | null>(null);
  protected readonly selectedCustomerRecord = signal<BeautyRecord | null>(null);

  // Quick duration selection pills
  protected readonly durationPills = [15, 30, 45, 60, 90, 120] as const;

  protected readonly appointments = resource({
    params: () => ({ ...this.visibleRange(), branchId: this.branchId() }),
    loader: async ({ params }) => {
      const response = await firstValueFrom(
        this.api.list<BeautyRecord>('appointments', {
          from: params.from,
          to: params.to,
          branchId: params.branchId || undefined,
          limit: 200,
        }),
      );
      return response.data;
    },
  });

  protected readonly appointmentModel = signal<AppointmentForm>(this.emptyModel());
  protected readonly appointmentForm = form(this.appointmentModel, (path) => {
    required(path.branchId, { message: 'Şube zorunludur.' });
    required(path.customerId, { message: 'Müşteri seçimi zorunludur.' });
    required(path.staffId, { message: 'Uzman seçimi zorunludur.' });
    required(path.serviceId, { message: 'Hizmet seçimi zorunludur.' });
    required(path.startAt, { message: 'Başlangıç tarihi zorunludur.' });
    required(path.endAt, { message: 'Bitiş tarihi zorunludur.' });
  });

  protected readonly options = computed<CalendarOptions>(() => ({
    plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin, breezyThemePlugin],
    themeSystem: 'breezy',
    initialView: 'timeGridWeek',
    locale: 'tr',
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: 'dayGridMonth,timeGridWeek,timeGridDay',
    },
    allDaySlot: false,
    nowIndicator: true,
    expandRows: true,
    height: 760,
    stickyHeaderDates: true,
    slotDuration: '00:30:00',
    slotLabelInterval: '01:00:00',
    slotLabelFormat: { hour: '2-digit', minute: '2-digit', hour12: false },
    businessHours: { daysOfWeek: [1, 2, 3, 4, 5, 6], startTime: '09:00', endTime: '20:00' },
    selectable: true,
    slotMinTime: '08:00:00',
    slotMaxTime: '22:00:00',
    select: (arg) => this.openCreate(arg),
    datesSet: (arg) => this.changeRange(arg),
    events: this.calendarEvents(),
    buttonText: { today: 'Bugün', month: 'Ay', week: 'Hafta', day: 'Gün' },
  }));

  protected readonly appointmentStats = computed(() => {
    const rows = this.appointments.value() ?? [];
    return {
      total: rows.length,
      confirmed: rows.filter((item) => item.status === 'confirmed').length,
      waiting: rows.filter((item) => item.status === 'pending').length,
      completed: rows.filter((item) => item.status === 'completed').length,
    };
  });

  // Searchable select options for Hizmet (Services)
  protected readonly serviceOptions = computed<SearchableSelectOption[]>(() => {
    return (this.services.value() ?? []).map((s) => {
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

  // Searchable select options for Uzman (Staff)
  protected readonly staffOptions = computed<SearchableSelectOption[]>(() => {
    return (this.staff.value() ?? []).map((stf) => {
      const name = String(stf['fullName'] || stf['name'] || stf.id);
      const role = String(stf['role'] || '');
      const parts = name.split(/\s+/).filter(Boolean);
      const initials =
        parts.length >= 2
          ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
          : name.slice(0, 2).toUpperCase();
      return {
        value: stf.id,
        label: name,
        badge: role ? `[${role}]` : undefined,
        icon: 'badge',
        avatarText: initials,
        raw: stf,
      };
    });
  });

  // Searchable select options for Şube (Branches)
  protected readonly branchOptions = computed<SearchableSelectOption[]>(() => {
    return (this.branches.value() ?? []).map((b) => ({
      value: b.id,
      label: b.name,
      icon: 'store',
      raw: b,
    }));
  });

  // Searchable select options for Oda / Kabin (Rooms & Defined Cabins)
  protected readonly roomOptions = computed<SearchableSelectOption[]>(() => {
    const definedTypes = this.definitions.getActiveItems('room-types');
    const physicalRooms = this.rooms.value() ?? [];
    const activeBranchId = this.appointmentModel().branchId || this.branchId();

    const options: SearchableSelectOption[] = [];

    // 1. Physical rooms from /rooms (filtered by active branch if present)
    const filteredPhysical = physicalRooms.filter((r) => {
      if (!activeBranchId) return true;
      const bId = r['branchId'] || r['branch_id'];
      return !bId || bId === activeBranchId;
    });

    for (const r of filteredPhysical) {
      const typeCode = String(r['roomType'] || r['type'] || '');
      const typeName = typeCode ? this.definitions.resolveLabel('room-types', typeCode) : '';
      options.push({
        value: r.id,
        label: String(r['name'] || r['title'] || r.id),
        badge: typeName || undefined,
        icon: 'meeting_room',
        raw: r,
      });
    }

    // 2. Defined Cabin & Room Types from Tanımlar > Oda / Kabin Türleri
    for (const def of definedTypes) {
      const alreadyHas = options.some(
        (o) => o.label.toLowerCase() === def.name.toLowerCase() || o.value === def.code,
      );
      if (!alreadyHas) {
        options.push({
          value: def.code || def.id,
          label: def.name,
          badge: options.length > 0 ? 'Kabin Türü' : 'Tanımlı Kabin',
          icon: 'meeting_room',
          raw: def,
        });
      }
    }

    return options;
  });

  // Searchable select options for Cihaz (Devices)
  protected readonly deviceOptions = computed<SearchableSelectOption[]>(() => {
    const physicalDevices = this.devices.value() ?? [];
    const activeBranchId = this.appointmentModel().branchId || this.branchId();

    const filtered = physicalDevices.filter((d) => {
      if (!activeBranchId) return true;
      const bId = d['branchId'] || d['branch_id'];
      return !bId || bId === activeBranchId;
    });

    return filtered.map((d) => ({
      value: d.id,
      label: String(d['name'] || d.id),
      badge: d['brand'] ? String(d['brand']) : undefined,
      icon: 'precision_manufacturing',
      raw: d,
    }));
  });

  // Dynamic derivations for live preview summary in drawer
  protected readonly selectedService = computed(() => {
    const id = this.appointmentModel().serviceId;
    return this.services.value()?.find((s) => s.id === id);
  });

  protected readonly selectedStaff = computed(() => {
    const id = this.appointmentModel().staffId;
    return this.staff.value()?.find((s) => s.id === id);
  });

  protected readonly selectedBranch = computed(() => {
    const id = this.appointmentModel().branchId;
    return this.branches.value()?.find((b) => b.id === id);
  });

  protected readonly selectedRoomLabel = computed<string>(() => {
    const id = this.appointmentModel().roomId;
    if (!id) return '';
    const opt = this.roomOptions().find((o) => o.value === id);
    return opt ? opt.label : id;
  });

  protected readonly selectedDeviceLabel = computed<string>(() => {
    const id = this.appointmentModel().deviceId;
    if (!id) return '';
    const opt = this.deviceOptions().find((o) => o.value === id);
    return opt ? opt.label : id;
  });

  protected readonly selectedRoom = computed(() => {
    const id = this.appointmentModel().roomId;
    return this.rooms.value()?.find((r) => r.id === id);
  });

  protected readonly selectedDevice = computed(() => {
    const id = this.appointmentModel().deviceId;
    return this.devices.value()?.find((d) => d.id === id);
  });

  protected readonly currentDurationMinutes = computed<number>(() => {
    const start = this.appointmentModel().startAt;
    const end = this.appointmentModel().endAt;
    if (!start || !end) return 0;
    const s = new Date(start).getTime();
    const e = new Date(end).getTime();
    if (isNaN(s) || isNaN(e) || e <= s) return 0;
    return Math.round((e - s) / 60_000);
  });

  protected calendarEvents(): EventInput[] {
    return (this.appointments.value() ?? []).map((item) => ({
      id: item.id,
      title: `${this.lookupName(this.customers.value(), item['customerId'])} · ${this.lookupName(this.services.value(), Array.isArray(item['serviceIds']) ? item['serviceIds'][0] : '')}`,
      start: this.text(item['startAt']),
      end: this.text(item['endAt']),
      color: this.statusColor(this.text(item['status'])),
    }));
  }

  protected openCreate(selection?: { start: Date; end: Date }): void {
    const start = selection?.start ?? new Date();
    const end = selection?.end ?? new Date(start.getTime() + 60 * 60_000);
    this.appointmentModel.set({
      ...this.emptyModel(),
      branchId: this.branchId() || this.branches.value()?.[0]?.id || '',
      startAt: this.localDate(start),
      endAt: this.localDate(end),
    });
    this.selectedCustomerRecord.set(null);
    this.error.set('');
    this.drawerOpen.set(true);
  }

  protected changeBranch(event: Event): void {
    const newBranchId = (event.target as HTMLSelectElement).value;
    this.branchId.set(newBranchId);
    this.appointmentModel.update((m) => ({ ...m, branchId: newBranchId }));
  }

  protected closeDrawer(): void {
    this.drawerOpen.set(false);
    this.error.set('');
    this.selectedCustomerRecord.set(null);
  }

  // Handle Customer Selection from Combobox
  protected onCustomerChange(customerId: string): void {
    this.appointmentModel.update((m) => ({ ...m, customerId }));
    const found = this.customers.value()?.find((c) => c.id === customerId);
    if (found) {
      this.selectedCustomerRecord.set(found);
      if (found['preferredStaffId'] && !this.appointmentModel().staffId) {
        this.appointmentModel.update((m) => ({
          ...m,
          staffId: String(found['preferredStaffId']),
        }));
      }
    } else if (!customerId) {
      this.selectedCustomerRecord.set(null);
    }
  }

  protected onCustomerSelected(rec: BeautyRecord | null): void {
    this.selectedCustomerRecord.set(rec);
    if (rec && rec['preferredStaffId'] && !this.appointmentModel().staffId) {
      this.appointmentModel.update((m) => ({
        ...m,
        staffId: String(rec['preferredStaffId']),
      }));
    }
  }

  // Handle Service Selection with automatic duration calculation
  protected onServiceSelected(serviceId: string): void {
    this.appointmentModel.update((m) => ({ ...m, serviceId }));
    const service = this.services.value()?.find((s) => s.id === serviceId);
    if (service && typeof service['durationMin'] === 'number' && service['durationMin'] > 0) {
      this.setDuration(service['durationMin']);
    }
  }

  // Handle Staff Selection
  protected onStaffSelected(staffId: string): void {
    this.appointmentModel.update((m) => ({ ...m, staffId }));
  }

  // Handle Branch Selection in Drawer Form
  protected onBranchFormSelected(branchId: string): void {
    this.appointmentModel.update((m) => ({ ...m, branchId }));
  }

  // Handle Room Selection
  protected onRoomSelected(roomId: string): void {
    this.appointmentModel.update((m) => ({ ...m, roomId }));
  }

  // Handle Device Selection
  protected onDeviceSelected(deviceId: string): void {
    this.appointmentModel.update((m) => ({ ...m, deviceId }));
  }

  // Open Quick Customer Form Modal
  protected openNewCustomerModal(searchQuery?: string): void {
    const trimmed = (searchQuery || '').trim();
    const isDigits = /^\+?[0-9\s-]+$/.test(trimmed);
    this.newCustomerInitialData.set({
      fullName: isDigits ? '' : trimmed,
      phone: isDigits ? trimmed : '',
      branchId: this.appointmentModel().branchId || this.branchId(),
    });
    this.isCustomerModalOpen.set(true);
  }

  protected onCustomerCreated(customer: CustomerProfile): void {
    this.isCustomerModalOpen.set(false);
    this.appointmentModel.update((m) => ({ ...m, customerId: customer.id }));
    this.selectedCustomerRecord.set(customer);
    this.customers.reload();
  }

  // Recalculate endAt by adding minutes to startAt
  protected setDuration(minutes: number): void {
    const currentStart = this.appointmentModel().startAt;
    if (!currentStart) return;
    const startDate = new Date(currentStart);
    if (isNaN(startDate.getTime())) return;
    const endDate = new Date(startDate.getTime() + minutes * 60_000);
    this.appointmentModel.update((m) => ({ ...m, endAt: this.localDate(endDate) }));
  }

  // Recalculate endAt if startAt changes
  protected onStartChange(event: Event): void {
    const newStart = (event.target as HTMLInputElement).value;
    const currentDuration = this.currentDurationMinutes();
    const duration = currentDuration > 0 ? currentDuration : 60;
    this.appointmentModel.update((m) => ({ ...m, startAt: newStart }));
    this.setDuration(duration);
  }

  protected save(): void {
    submit(this.appointmentForm, async () => {
      this.saving.set(true);
      this.error.set('');
      const value = this.appointmentModel();
      try {
        await firstValueFrom(
          this.api.create<BeautyRecord>('appointments', {
            branchId: value.branchId,
            customerId: value.customerId,
            staffId: value.staffId,
            serviceIds: [value.serviceId],
            roomId: value.roomId || undefined,
            deviceId: value.deviceId || undefined,
            startAt: new Date(value.startAt).toISOString(),
            endAt: new Date(value.endAt).toISOString(),
            notes: value.notes,
            source: 'staff',
            idempotencyKey: crypto.randomUUID(),
          }),
        );
        this.closeDrawer();
        this.appointments.reload();
      } catch (error) {
        this.error.set(error instanceof Error ? error.message : 'Randevu oluşturulamadı.');
      } finally {
        this.saving.set(false);
      }
    });
  }

  protected name(item: BeautyRecord): string {
    return this.lookupName([item], item.id);
  }

  protected staffName(item: BeautyRecord): string {
    const name = String(item['fullName'] || item['name'] || item.id).trim();
    const role = String(item['role'] || '').trim();
    return role ? `${name} [${role}]` : name;
  }

  private lookup<T extends BeautyRecord = BeautyRecord>(resourceName: string, branchScoped = true) {
    return resource({
      params: () => (branchScoped ? this.branchId() : ''),
      loader: async ({ params }) =>
        (
          await firstValueFrom(
            this.api.list<T>(resourceName, { branchId: params || undefined, limit: 100 }),
          )
        ).data,
    });
  }

  private changeRange(arg: { start: Date; end: Date }): void {
    const range = { from: arg.start.toISOString(), to: arg.end.toISOString() };
    const current = this.visibleRange();
    if (current.from !== range.from || current.to !== range.to) this.visibleRange.set(range);
  }

  private lookupName(items: readonly BeautyRecord[] | undefined, id: unknown): string {
    const row = items?.find((item) => item.id === id);
    if (!row) return typeof id === 'string' && id ? id : 'Kayıt';
    const value = row['name'] ?? row['fullName'] ?? row['title'];
    return typeof value === 'string' ? value : row.id;
  }

  private emptyModel(): AppointmentForm {
    return {
      branchId: '',
      customerId: '',
      staffId: '',
      serviceId: '',
      roomId: '',
      deviceId: '',
      startAt: '',
      endAt: '',
      notes: '',
    };
  }

  private localDate(date: Date): string {
    const offset = date.getTimezoneOffset() * 60_000;
    return new Date(date.getTime() - offset).toISOString().slice(0, 16);
  }

  private text(value: unknown): string {
    return typeof value === 'string' ? value : '';
  }

  private statusColor(status: string): string {
    return (
      (
        {
          confirmed: '#4f46e5',
          pending: '#d97706',
          'checked-in': '#0891b2',
          completed: '#059669',
          cancelled: '#e11d48',
        } as Record<string, string>
      )[status] ?? '#64748b'
    );
  }
}
