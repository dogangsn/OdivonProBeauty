import { Service, inject } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Observable, firstValueFrom } from 'rxjs';
import { ApiClient } from '../api-client';
import { ApiSuccess } from '../beauty.model';
import { CreateSupportTicketInput, SupportTicket } from './support-ticket.model';

/** MainApi destek talebi uçları: oluşturma, takip numarasıyla sorgulama ve kişinin talepleri. */
@Service()
export class SupportTicketService {
  private readonly api = inject(ApiClient);

  async create(input: CreateSupportTicketInput): Promise<SupportTicket> {
    return this.call(() => this.api.request<SupportTicket>('POST', 'support/tickets', input));
  }

  async track(trackingNumber: string): Promise<SupportTicket> {
    const code = encodeURIComponent(trackingNumber.trim().toUpperCase());
    return this.call(() => this.api.request<SupportTicket>('GET', `support/tickets/track/${code}`));
  }

  async mine(email: string): Promise<SupportTicket[]> {
    if (!email.trim()) return [];
    const query = encodeURIComponent(email.trim().toLowerCase());
    return this.call(() =>
      this.api.request<SupportTicket[]>('GET', `support/tickets/my-tickets?email=${query}`),
    );
  }

  private async call<T>(run: () => Observable<ApiSuccess<T>>): Promise<T> {
    try {
      const response = await firstValueFrom(run());
      return response.data;
    } catch (error) {
      throw new Error(SupportTicketService.message(error));
    }
  }

  static message(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      const body = error.error as {
        message?: string | string[];
        error?: { message?: string };
      } | null;
      const message = body?.error?.message ?? body?.message;
      if (Array.isArray(message)) return message.join(', ');
      if (message) return message;
      if (error.status === 0) return 'Sunucuya ulaşılamadı. İnternet bağlantınızı kontrol edin.';
      if (error.status === 404) return 'Bu takip numarasına ait talep bulunamadı.';
    }
    return 'İşlem tamamlanamadı. Lütfen tekrar deneyin.';
  }
}
