import { Component, inject, signal } from '@angular/core';
import { FormField, email, form, required, submit } from '@angular/forms/signals';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Auth } from '../../../core/auth';
import { LoginShowcase } from '../login-showcase/login-showcase';

@Component({
  imports: [FormField, LoginShowcase, RouterLink],
  selector: 'app-login',
  styleUrl: './login.css',
  templateUrl: './login.html',
})
export class Login {
  private readonly auth = inject(Auth);
  private readonly route = inject(ActivatedRoute);
  protected readonly error = signal('');
  protected readonly notice = signal('');
  protected readonly isSubmitting = signal(false);
  protected readonly showPassword = signal(false);
  protected readonly pointer = signal({ x: 50, y: 0 });

  constructor() {
    if (this.route.snapshot.queryParamMap.get('updated') === '1') {
      this.notice.set(
        'Sistem başarıyla yeni sürüme güncellendi. Güvenliğiniz için çerezler ve önbellek temizlendi, lütfen tekrar oturum açın.',
      );
    }
  }
  protected readonly loginModel = signal({ email: '', password: '' });
  protected readonly loginForm = form(this.loginModel, (path) => {
    required(path.email, { message: 'E-posta zorunludur.' });
    email(path.email, { message: 'Geçerli bir e-posta girin.' });
    required(path.password, { message: 'Şifre zorunludur.' });
  });
  protected login(): void {
    submit(this.loginForm, async () => {
      this.error.set('');
      this.isSubmitting.set(true);
      try {
        await this.auth.login(this.loginModel().email, this.loginModel().password);
      } catch {
        this.error.set('E-posta veya şifre hatalı. Bilgilerinizi kontrol edip tekrar deneyin.');
      } finally {
        this.isSubmitting.set(false);
      }
    });
  }

  protected trackPointer(event: PointerEvent): void {
    const target = event.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    this.pointer.set({
      x: Math.round(((event.clientX - rect.left) / rect.width) * 100),
      y: Math.round(((event.clientY - rect.top) / rect.height) * 100),
    });
  }

  protected resetPointer(): void {
    this.pointer.set({ x: 50, y: 0 });
  }

  protected async resetPassword(): Promise<void> {
    const emailAddress = this.loginModel().email.trim();
    this.error.set('');
    this.notice.set('');
    if (!emailAddress) {
      this.error.set('Şifre yenileme bağlantısı için önce e-posta adresinizi girin.');
      return;
    }
    try {
      await this.auth.resetPassword(emailAddress);
      this.notice.set('Şifre yenileme bağlantısı e-posta adresinize gönderildi.');
    } catch {
      this.error.set('Şifre yenileme isteği tamamlanamadı. E-posta adresinizi kontrol edin.');
    }
  }
}
