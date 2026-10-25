import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { environment } from '../../../environments/environment';
import { SupportTicketService } from './support-ticket.service';

describe('SupportTicketService', () => {
  const root = environment.apiBaseUrl.replace(/\/$/, '');
  let service: SupportTicketService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(SupportTicketService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('posts a new ticket and returns the created record', async () => {
    const promise = service.create({
      category: 'technical_support',
      subject: 'SMS gitmiyor',
      description: 'Hatırlatma SMS leri gitmiyor.',
      fullName: 'Ayşe Yılmaz',
      email: 'ayse@example.com',
    });
    const req = http.expectOne(`${root}/support/tickets`);
    expect(req.request.method).toBe('POST');
    req.flush({ success: true, data: { id: 'TK-2026-111111', trackingNumber: 'TK-2026-111111' } });
    expect((await promise).trackingNumber).toBe('TK-2026-111111');
  });

  it('tracks a ticket by upper-cased tracking number', async () => {
    const promise = service.track(' tk-2026-111111 ');
    const req = http.expectOne(`${root}/support/tickets/track/TK-2026-111111`);
    req.flush({ success: true, data: { id: 'TK-2026-111111', status: 'pending' } });
    expect((await promise).id).toBe('TK-2026-111111');
  });

  it('lists my tickets by email', async () => {
    const promise = service.mine('Ayse@Example.com');
    const req = http.expectOne(`${root}/support/tickets/my-tickets?email=ayse%40example.com`);
    req.flush({ success: true, data: [] });
    expect(await promise).toEqual([]);
  });

  it('surfaces the API error message', async () => {
    const promise = service.track('TK-0');
    http
      .expectOne(`${root}/support/tickets/track/TK-0`)
      .flush(
        { success: false, error: { message: 'Belirtilen takip numarasına ait talep bulunamadı.' } },
        { status: 404, statusText: 'Not Found' },
      );
    await expect(promise).rejects.toThrow('Belirtilen takip numarasına ait talep bulunamadı.');
  });
});
