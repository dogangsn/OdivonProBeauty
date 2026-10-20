import { DOCUMENT } from '@angular/common';
import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Auth } from '../../../core/auth';
import { Registration } from '../../../core/registration';
import { AuthBackdrop } from '../auth-backdrop/auth-backdrop';

type VerificationState = 'loading' | 'pending' | 'success' | 'error';

@Component({
  imports: [AuthBackdrop, RouterLink],
  selector: 'app-verify-email',
  styleUrl: './verify-email.css',
  templateUrl: './verify-email.html',
})
export class VerifyEmail implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly registration = inject(Registration);
  private readonly auth = inject(Auth);
  private readonly document = inject(DOCUMENT);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly state = signal<VerificationState>('loading');
  protected readonly email = signal<string>('');
  protected readonly tokenInput = signal<string>('');
  protected readonly errorMessage = signal<string>('');
  protected readonly resending = signal<boolean>(false);
  protected readonly resendSuccess = signal<boolean>(false);
  protected readonly resendCooldown = signal<number>(0);

  protected readonly isAuthenticated = computed(() => this.auth.authenticated());
  private cooldownInterval?: ReturnType<typeof setInterval>;

  constructor() {
    this.destroyRef.onDestroy(() => {
      if (this.cooldownInterval) clearInterval(this.cooldownInterval);
    });
  }

  async ngOnInit(): Promise<void> {
    const params = this.route.snapshot.queryParams;
    const token = (params['token'] || '').trim();
    const emailParam = (params['email'] || '').trim();

    if (emailParam) {
      this.email.set(emailParam);
    } else {
      // Check session storage if email was remembered from registration
      try {
        const stored = this.document.defaultView?.sessionStorage.getItem('odivon_registered_email');
        if (stored) this.email.set(stored);
      } catch {
        // Ignore storage errors
      }
    }

    if (token) {
      await this.verifyToken(token);
    } else {
      this.state.set('pending');
    }
  }

  protected async verifyToken(tokenToVerify: string): Promise<void> {
    const cleanToken = tokenToVerify.trim();
    if (!cleanToken) {
      this.errorMessage.set('Lütfen geçerli bir doğrulama kodu girin.');
      return;
    }

    this.state.set('loading');
    this.errorMessage.set('');

    try {
      const response = await this.registration.verifyEmail(cleanToken);
      if (response.email) {
        this.email.set(response.email);
      }
      this.state.set('success');
    } catch (err: unknown) {
      this.state.set('error');
      const errObj = err as { error?: { message?: string }; message?: string };
      this.errorMessage.set(
        errObj?.error?.message ??
          errObj?.message ??
          'Doğrulama bağlantısı geçersiz veya süresi dolmuş. Lütfen yeni bir bağlantı talep edin.',
      );
    }
  }

  protected async resendLink(): Promise<void> {
    const targetEmail = this.email().trim();
    if (!targetEmail || this.resending() || this.resendCooldown() > 0) return;

    this.resending.set(true);
    this.resendSuccess.set(false);
    this.errorMessage.set('');

    try {
      await this.registration.resendVerification(targetEmail);
      this.resendSuccess.set(true);
      this.startCooldown(60);
    } catch {
      this.errorMessage.set('Doğrulama e-postası şu anda gönderilemedi. Lütfen biraz sonra tekrar deneyin.');
    } finally {
      this.resending.set(false);
    }
  }

  protected onTokenManualSubmit(event: Event): void {
    event.preventDefault();
    const token = this.tokenInput().trim();
    if (token) {
      void this.verifyToken(token);
    }
  }

  protected updateTokenInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.tokenInput.set(target.value);
  }

  protected updateEmailInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.email.set(target.value);
  }

  protected async proceedToWizardOrLogin(): Promise<void> {
    if (await this.auth.isReadyAndAuthenticated()) {
      await this.router.navigateByUrl('/onboarding');
    } else {
      await this.router.navigate(['/login'], {
        queryParams: {
          email: this.email(),
          verified: '1',
          returnUrl: '/onboarding',
        },
      });
    }
  }

  private startCooldown(seconds: number): void {
    this.resendCooldown.set(seconds);
    if (this.cooldownInterval) clearInterval(this.cooldownInterval);
    this.cooldownInterval = setInterval(() => {
      this.resendCooldown.update((v) => {
        if (v <= 1) {
          if (this.cooldownInterval) clearInterval(this.cooldownInterval);
          return 0;
        }
        return v - 1;
      });
    }, 1000);
  }
}
