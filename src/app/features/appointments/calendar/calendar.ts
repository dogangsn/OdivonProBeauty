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
  imports: [FormField, FullCalendarModule, PageHeader, SlideOver],
  selector: 'app-calendar',
  styleUrl: './calendar.css',
  templateUrl: './calendar.html',
})
export class Calendar {
  private readonly api = inject(ApiClient);
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
  protected readonly rooms = this.lookup('rooms');
  protected readonly devices = this.lookup('devices');
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
    required(path.customerId);
    required(path.staffId);
    required(path.serviceId);
    required(path.startAt);
    required(path.endAt);
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
    buttonText: { today: 'Bugun', month: 'Ay', week: 'Hafta', day: 'Gun' },
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
    this.error.set('');
    this.drawerOpen.set(true);
  }
  protected changeBranch(event: Event): void {
    this.branchId.set((event.target as HTMLSelectElement).value);
  }
  protected closeDrawer(): void {
    this.drawerOpen.set(false);
    this.error.set('');
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
