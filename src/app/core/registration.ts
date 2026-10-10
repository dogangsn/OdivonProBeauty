import { HttpClient } from '@angular/common/http';
import { Service, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';
import { Auth } from './auth';

export interface BeautyRegistration {
  ownerName: string;
  businessName: string;
  branchName: string;
  email: string;
  phone: string;
  password: string;
}

@Service()
export class Registration {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(Auth);
  private readonly apiBaseUrl = environment.apiBaseUrl.replace(/\/$/, '');

  async createOwnerAccount(input: BeautyRegistration): Promise<void> {
    await firstValueFrom(
      this.http.post(`${this.apiBaseUrl}/identity/register`, {
        email: input.email.trim().toLowerCase(),
        password: input.password,
        tenantName: input.businessName.trim(),
        module: 'beauty',
        displayName: input.ownerName.trim(),
        phone: input.phone.trim() || undefined,
      }),
    );

    await this.auth.authenticate(input.email.trim().toLowerCase(), input.password);
    await this.auth.token(true);

    await firstValueFrom(
      this.http.post(`${this.apiBaseUrl}/beauty/onboarding`, {
        businessName: input.businessName.trim(),
        branchName: input.branchName.trim(),
        timezone: 'Europe/Istanbul',
      }),
    );

    await this.auth.openDashboard();
  }
}
