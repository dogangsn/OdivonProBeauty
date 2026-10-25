import { Component, computed, effect, inject, resource, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
  OnlineBookingApi,
  PublicBookingAppointment,
  PublicBookingSlot,
  errorMessage,
} from '../../../core/booking/online-booking.service';

interface DayOption {
  value: string;
  weekday: string;
  day: string;
  month: string;
}

const ANY_STAFF = '';

/** Public "randevu linki" page: a guest picks service, specialist, day and time, then books. */
@Component({
  selector: 'app-public-booking',
  imports: [RouterLink],
  templateUrl: './public-booking.html',
  styleUrl: './public-booking.css',
})
export class PublicBooking {
  private readonly api = inject(OnlineBookingApi);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly params = toSignal(this.route.paramMap, { requireSync: true });
  private readonly query = toSignal(this.route.queryParamMap, { requireSync: true });

  protected readonly slug = computed(() => this.params().get('slug') ?? '');
  private readonly appointmentRef = computed(() => {
    const id = this.query().get('appointment');
    const token = this.query().get('token');
    return id && token ? { id, token } : null;
  });

  protected readonly serviceId = signal('');
  protected readonly staffId = signal(ANY_STAFF);
  protected readonly date = signal('');
  protected readonly time = signal('');
  protected readonly fullName = signal('');
  protected readonly phone = signal('');
  protected readonly email = signal('');
  protected readonly notes = signal('');
  protected readonly kvkk = signal(false);
  protected readonly submitting = signal(false);
  protected readonly cancelling = signal(false);
  protected readonly formError = signal('');
  protected readonly booked = signal<PublicBookingAppointment | null>(null);

  protected readonly info = resource({
    params: () => this.slug(),
    loader: ({ params }) => this.api.info(params),
  });
  protected readonly services = resource({
    params: () => (this.info.hasValue() ? this.slug() : undefined),
    loader: ({ params }) => this.api.services(params),
  });
  protected readonly staff = resource({
    params: () => (this.serviceId() ? { slug: this.slug(), serviceId: this.serviceId() } : undefined),
    loader: ({ params }) => this.api.staff(params.slug, params.serviceId),
  });
  protected readonly slots = resource({
    params: () =>
      this.serviceId() && this.date()
        ? {
            slug: this.slug(),
            serviceId: this.serviceId(),
            staffId: this.staffId() || undefined,
            date: this.date(),
          }
        : undefined,
    loader: ({ params }) =>
      this.api.slots(params.slug, params.date, params.serviceId, params.staffId),
  });
  protected readonly existing = resource({
    params: () => {
      const ref = this.appointmentRef();
      return ref ? { slug: this.slug(), ...ref } : undefined;
    },
    loader: ({ params }) => this.api.appointment(params.slug, params.id, params.token),
  });

  protected readonly appointment = computed(
    () => this.booked() ?? (this.existing.hasValue() ? this.existing.value() : null),
  );
  protected readonly selectedService = computed(() =>
    this.services.hasValue() ? this.services.value().find((item) => item.id === this.serviceId()) : undefined,
  );
  protected readonly selectedSlot = computed<PublicBookingSlot | undefined>(() =>
    this.slots.hasValue() ? this.slots.value().slots.find((item) => item.time === this.time()) : undefined,
  );
  protected readonly selectedStaffName = computed(() => {
    const list = this.staff.hasValue() ? this.staff.value() : [];
    const id = this.staffId() || this.selectedSlot()?.staffIds[0];
    return list.find((item) => item.id === id)?.name ?? '';
  });
  protected readonly days = computed<DayOption[]>(() => {
    if (!this.info.hasValue()) return [];
    const { workDays, maxDaysAhead } = this.info.value();
    const result: DayOption[] = [];
    const cursor = new Date();
    for (let i = 0; i <= Math.min(maxDaysAhead, 45) && result.length < 21; i++) {
      if (!workDays.length || workDays.includes(cursor.getDay())) {
        result.push({
          value: isoDate(cursor),
          weekday: i === 0 ? 'Bugün' : i === 1 ? 'Yarın' : format(cursor, { weekday: 'short' }),
          day: format(cursor, { day: 'numeric' }),
          month: format(cursor, { month: 'short' }),
        });
      }
      cursor.setDate(cursor.getDate() + 1);
    }
    return result;
  });
  protected readonly canSubmit = computed(
    () =>
      !!this.selectedSlot() &&
      this.fullName().trim().length >= 3 &&
      this.phone().replace(/\D/g, '').length >= 10 &&
      this.kvkk() &&
      !this.submitting(),
  );

  constructor() {
    // Preselect ?service= and ?staff= from a specialist-specific link.
    effect(() => {
      if (!this.services.hasValue() || this.serviceId()) return;
      const wanted = this.query().get('service');
      const list = this.services.value();
      if (wanted && list.some((item) => item.id === wanted)) this.serviceId.set(wanted);
      else if (list.length === 1) this.serviceId.set(list[0].id);
    });
    effect(() => {
      if (!this.staff.hasValue()) return;
      const wanted = this.query().get('staff');
      if (wanted && this.staffId() === ANY_STAFF && this.staff.value().some((item) => item.id === wanted)) {
        this.staffId.set(wanted);
      }
    });
    effect(() => {
      if (!this.date() && this.days().length) this.date.set(this.days()[0].value);
    });
  }

  protected chooseService(id: string): void {
    this.serviceId.set(id);
    this.staffId.set(ANY_STAFF);
    this.time.set('');
  }
  protected chooseStaff(id: string): void {
    this.staffId.set(id);
    this.time.set('');
  }
  protected chooseDate(value: string): void {
    if (!value) return;
    this.date.set(value);
    this.time.set('');
  }
  protected input(target: EventTarget | null): string {
    return (target as HTMLInputElement | null)?.value ?? '';
  }
  protected checked(target: EventTarget | null): boolean {
    return (target as HTMLInputElement | null)?.checked ?? false;
  }

  protected async submit(): Promise<void> {
    const slot = this.selectedSlot();
    if (!slot || !this.canSubmit()) return;
    this.submitting.set(true);
    this.formError.set('');
    try {
      const result = await this.api.book(this.slug(), {
        serviceId: this.serviceId(),
        staffId: this.staffId() || undefined,
        date: this.date(),
        time: slot.time,
        fullName: this.fullName().trim(),
        phone: this.phone().trim(),
        email: this.email().trim() || undefined,
        notes: this.notes().trim() || undefined,
        kvkkConsent: true,
      });
      this.booked.set(result);
      if (result.token) {
        // Keep the confirmation reachable (refresh, bookmark) and allow cancelling later.
        await this.router.navigate([], {
          relativeTo: this.route,
          queryParams: { appointment: result.id, token: result.token },
          replaceUrl: true,
        });
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      this.formError.set(errorMessage(error));
      this.time.set('');
      this.slots.reload();
    } finally {
      this.submitting.set(false);
    }
  }

  protected async cancelAppointment(): Promise<void> {
    const current = this.appointment();
    const ref = this.appointmentRef();
    const token = current?.token ?? ref?.token;
    if (!current || !token) return;
    if (!window.confirm('Randevunuzu iptal etmek istediğinize emin misiniz?')) return;
    this.cancelling.set(true);
    try {
      this.booked.set({ ...(await this.api.cancel(this.slug(), current.id, token)), token });
    } catch (error) {
      window.alert(errorMessage(error));
    } finally {
      this.cancelling.set(false);
    }
  }

  protected newBooking(): void {
    this.booked.set(null);
    this.time.set('');
    this.notes.set('');
    void this.router.navigate([], { relativeTo: this.route, queryParams: {}, replaceUrl: true });
  }

  protected errorText(error: unknown): string {
    return errorMessage(error);
  }
  protected price(value: number | null): string {
    return value === null
      ? ''
      : new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 }).format(value);
  }
  protected when(appointment: PublicBookingAppointment): string {
    const start = new Date(appointment.startAt);
    if (Number.isNaN(start.getTime())) return '';
    return new Intl.DateTimeFormat('tr-TR', {
      dateStyle: 'full',
      timeStyle: 'short',
      timeZone: appointment.timeZone || undefined,
    }).format(start);
  }
  protected statusLabel(status: string): string {
    return (
      {
        pending: 'Salon onayı bekleniyor',
        confirmed: 'Onaylandı',
        cancelled: 'İptal edildi',
        completed: 'Tamamlandı',
        'checked-in': 'Salonda',
        'in-progress': 'Devam ediyor',
        'no-show': 'Gelinmedi',
        rescheduled: 'Yeniden planlanacak',
      } as Record<string, string>
    )[status] ?? status;
  }
  protected mapsUrl(address: string, city: string): string {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${address} ${city}`.trim())}`;
  }
  protected telUrl(phone: string): string {
    return `tel:${phone.replace(/[^\d+]/g, '')}`;
  }
}

function isoDate(date: Date): string {
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 10);
}

function format(date: Date, options: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat('tr-TR', options).format(date);
}
