import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Service, inject } from '@angular/core';
import { Observable, firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiSuccess } from '../beauty.model';

export interface BookingLink {
  branchId: string;
  slug: string | null;
  enabled: boolean;
}

export interface PublicBookingInfo {
  businessName: string;
  logoUrl: string | null;
  branchName: string;
  phone: string;
  address: string;
  city: string;
  district: string;
  workDays: number[];
  workDayStart: string;
  workDayEnd: string;
  timeZone: string;
  maxDaysAhead: number;
}

export interface PublicBookingService {
  id: string;
  name: string;
  description: string;
  durationMin: number;
  price: number | null;
  categoryId: string;
}

export interface PublicBookingStaff {
  id: string;
  name: string;
}

export interface PublicBookingSlot {
  time: string;
  startAt: string;
  endAt: string;
  staffIds: string[];
}

export interface PublicBookingSlots {
  date: string;
  timeZone: string;
  durationMin: number;
  slots: PublicBookingSlot[];
}

export interface PublicBookingRequest {
  serviceId: string;
  staffId?: string;
  date: string;
  time: string;
  fullName: string;
  phone: string;
  email?: string;
  notes?: string;
  kvkkConsent: boolean;
}

export interface PublicBookingAppointment {
  id: string;
  token?: string;
  businessName: string;
  branchName: string;
  branchPhone: string;
  serviceName: string;
  staffName: string;
  customerName: string;
  startAt: string;
  endAt: string;
  timeZone: string;
  status: string;
  canCancel: boolean;
}

/** Shareable online booking link ("randevu linki"): salon settings + the public booking API. */
@Service()
export class OnlineBookingApi {
  private readonly http = inject(HttpClient);
  private readonly root = environment.apiBaseUrl.replace(/\/$/, '');

  /** Public page URL customers open, e.g. https://beauty.odivon.com/book/lumiere-1a2b3c. */
  static publicUrl(slug: string, origin: string, staffId?: string): string {
    const base = `${origin.replace(/\/$/, '')}/book/${encodeURIComponent(slug)}`;
    return staffId ? `${base}?staff=${encodeURIComponent(staffId)}` : base;
  }

  getLink(branchId: string) {
    return this.call<BookingLink>(
      this.http.get<ApiSuccess<BookingLink>>(`${this.root}/beauty/booking-link`, {
        params: new HttpParams().set('branchId', branchId),
      }),
    );
  }

  saveLink(body: { branchId: string; enabled?: boolean; slug?: string; regenerate?: boolean }) {
    return this.call<BookingLink>(
      this.http.post<ApiSuccess<BookingLink>>(`${this.root}/beauty/booking-link`, body),
    );
  }

  info(slug: string) {
    return this.call<PublicBookingInfo>(this.http.get<ApiSuccess<PublicBookingInfo>>(this.url(slug, 'info')));
  }

  services(slug: string) {
    return this.call<PublicBookingService[]>(
      this.http.get<ApiSuccess<PublicBookingService[]>>(this.url(slug, 'services')),
    );
  }

  staff(slug: string, serviceId: string) {
    return this.call<PublicBookingStaff[]>(
      this.http.get<ApiSuccess<PublicBookingStaff[]>>(this.url(slug, 'staff'), {
        params: new HttpParams().set('serviceId', serviceId),
      }),
    );
  }

  slots(slug: string, date: string, serviceId: string, staffId?: string) {
    let params = new HttpParams().set('date', date).set('serviceId', serviceId);
    if (staffId) params = params.set('staffId', staffId);
    return this.call<PublicBookingSlots>(
      this.http.get<ApiSuccess<PublicBookingSlots>>(this.url(slug, 'slots'), { params }),
    );
  }

  book(slug: string, body: PublicBookingRequest) {
    return this.call<PublicBookingAppointment>(
      this.http.post<ApiSuccess<PublicBookingAppointment>>(this.url(slug, 'appointments'), body),
    );
  }

  appointment(slug: string, id: string, token: string) {
    return this.call<PublicBookingAppointment>(
      this.http.get<ApiSuccess<PublicBookingAppointment>>(
        this.url(slug, `appointments/${encodeURIComponent(id)}`),
        { params: new HttpParams().set('token', token) },
      ),
    );
  }

  cancel(slug: string, id: string, token: string) {
    return this.call<PublicBookingAppointment>(
      this.http.patch<ApiSuccess<PublicBookingAppointment>>(
        this.url(slug, `appointments/${encodeURIComponent(id)}/cancel`),
        {},
        { params: new HttpParams().set('token', token) },
      ),
    );
  }

  private url(slug: string, path: string): string {
    return `${this.root}/beauty/public/booking/${encodeURIComponent(slug)}/${path}`;
  }

  private async call<T>(request: Observable<ApiSuccess<T>>): Promise<T> {
    try {
      return (await firstValueFrom(request)).data;
    } catch (error) {
      throw new Error(errorMessage(error));
    }
  }
}

export function errorMessage(error: unknown): string {
  if (error instanceof HttpErrorResponse) {
    const body = error.error as { error?: { message?: string }; message?: string } | null;
    const message = body?.error?.message ?? body?.message;
    if (message) return message;
    if (error.status === 0) return 'Sunucuya ulaşılamadı. İnternet bağlantınızı kontrol edin.';
    if (error.status === 404) return 'Randevu sayfası bulunamadı.';
    if (error.status === 429) return 'Çok fazla deneme yapıldı. Lütfen biraz sonra tekrar deneyin.';
  }
  return error instanceof Error ? error.message : 'İşlem tamamlanamadı.';
}
