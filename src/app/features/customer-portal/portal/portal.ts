import { RouterLink } from '@angular/router';
import { Component, computed, inject, resource, signal } from '@angular/core';
import { ConfirmationResult, RecaptchaVerifier } from 'firebase/auth';
import { firstValueFrom } from 'rxjs';
import { ApiClient } from '../../../core/api-client';
import { Auth } from '../../../core/auth';
import { BeautyRecord } from '../../../core/beauty.model';
import { Loader } from '../../../shared/loader/loader';

@Component({
  imports: [Loader, RouterLink],
  selector: 'app-portal',
  styleUrl: './portal.css',
  templateUrl: './portal.html',
})
export class Portal {
  private readonly api = inject(ApiClient);
  protected readonly auth = inject(Auth);
  private confirmation: ConfirmationResult | null = null;
  private verifier: RecaptchaVerifier | null = null;
  protected readonly phone = signal('');
  protected readonly code = signal('');
  protected readonly codeSent = signal(false);
  protected readonly busy = signal(false);
  protected readonly error = signal('');
  protected readonly signedIn = computed(() => this.auth.currentUser() !== null);
  protected readonly records = resource({
    params: () => this.auth.currentUser()?.uid ?? '',
    loader: async ({ params }) => {
      if (!params) return { appointments: [], packages: [] };
      const [appointments, packages] = await Promise.all([
        firstValueFrom(this.api.list<BeautyRecord>('appointments', { limit: 100 })),
        firstValueFrom(this.api.list<BeautyRecord>('customer-packages', { limit: 100 })),
      ]);
      return {
        appointments: appointments.data.filter(
          (item) => item['accountUid'] === params || item['userId'] === params,
        ),
        packages: packages.data.filter(
          (item) => item['accountUid'] === params || item['userId'] === params,
        ),
      };
    },
  });
  protected async sendCode(): Promise<void> {
    if (!this.phone().trim()) {
      this.error.set('Telefon numaranızı ülke koduyla girin.');
      return;
    }
    this.busy.set(true);
    this.error.set('');
    try {
      this.verifier ??= this.auth.createRecaptcha('recaptcha-container');
      this.confirmation = await this.auth.requestPhoneCode(this.phone().trim(), this.verifier);
      this.codeSent.set(true);
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'Doğrulama kodu gönderilemedi.');
      this.verifier?.clear();
      this.verifier = null;
    } finally {
      this.busy.set(false);
    }
  }
  protected async verifyCode(): Promise<void> {
    if (!this.confirmation || !this.code().trim()) return;
    this.busy.set(true);
    this.error.set('');
    try {
      await this.confirmation.confirm(this.code().trim());
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'Kod doğrulanamadı.');
    } finally {
      this.busy.set(false);
    }
  }
  protected updatePhone(event: Event): void {
    this.phone.set((event.target as HTMLInputElement).value);
  }
  protected updateCode(event: Event): void {
    this.code.set((event.target as HTMLInputElement).value);
  }
  protected title(item: BeautyRecord): string {
    const value = item['name'] ?? item['serviceName'] ?? item['title'];
    return typeof value === 'string' ? value : item.id;
  }
  protected date(item: BeautyRecord): string {
    const value = item['startAt'] ?? item['nextSessionDueAt'];
    if (typeof value !== 'string') return 'Tarih belirtilmedi';
    const date = new Date(value);
    return Number.isNaN(date.getTime())
      ? 'Tarih belirtilmedi'
      : new Intl.DateTimeFormat('tr-TR', { dateStyle: 'long', timeStyle: 'short' }).format(date);
  }
}
