import { Component, inject, signal } from '@angular/core';
import { FormField, email, form, required, submit } from '@angular/forms/signals';
import { RouterLink } from '@angular/router';
import { Auth } from '../../../core/auth';

@Component({
  imports: [FormField, RouterLink],
  selector: 'app-login',
  styleUrl: './login.css',
  templateUrl: './login.html',
})
export class Login {
  private readonly auth = inject(Auth);
  protected readonly error = signal('');
  protected readonly loginModel = signal({ email: '', password: '' });
  protected readonly loginForm = form(this.loginModel, (path) => {
    required(path.email, { message: 'E-posta zorunludur.' });
    email(path.email, { message: 'Gecerli bir e-posta girin.' });
    required(path.password, { message: 'Sifre zorunludur.' });
  });
  protected login(): void {
    submit(this.loginForm, async () => {
      this.error.set('');
      try { await this.auth.login(this.loginModel().email, this.loginModel().password); }
      catch { this.error.set('Giris tamamlanamadi. Firebase yapilandirmasini kontrol edin.'); }
    });
  }
  protected demo(): void { this.auth.enterDemo('owner'); }
}
