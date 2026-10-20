import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, signal } from '@angular/core';
import {
  FormField,
  email,
  form,
  minLength,
  required,
  submit,
  validate,
} from '@angular/forms/signals';
import { RouterLink } from '@angular/router';
import { Registration } from '../../../core/registration';
import { AuthBackdrop } from '../auth-backdrop/auth-backdrop';

@Component({
  imports: [AuthBackdrop, FormField, RouterLink],
  selector: 'app-register',
  styleUrl: './register.css',
  templateUrl: './register.html',
})
export class Register {
  private readonly registration = inject(Registration);

  protected readonly error = signal('');
  protected readonly isSubmitting = signal(false);
  protected readonly showPassword = signal(false);
  protected readonly registerModel = signal({
    ownerName: '',
    businessName: '',
    branchName: 'Merkez Şube',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    acceptedTerms: false,
  });

  protected readonly registerForm = form(this.registerModel, (path) => {
    required(path.ownerName, { message: 'Ad soyad zorunludur.' });
    minLength(path.ownerName, 2, { message: 'Ad soyad en az 2 karakter olmalıdır.' });
    required(path.businessName, { message: 'Merkez adı zorunludur.' });
    minLength(path.businessName, 2, { message: 'Merkez adı en az 2 karakter olmalıdır.' });
    required(path.branchName, { message: 'Şube adı zorunludur.' });
    required(path.email, { message: 'E-posta zorunludur.' });
    email(path.email, { message: 'Geçerli bir e-posta girin.' });
    required(path.password, { message: 'Şifre zorunludur.' });
    minLength(path.password, 8, { message: 'Şifre en az 8 karakter olmalıdır.' });
    required(path.confirmPassword, { message: 'Şifre tekrarı zorunludur.' });
    validate(path.confirmPassword, ({ value, valueOf }) =>
      value() === valueOf(path.password)
        ? undefined
        : { kind: 'passwordMismatch', message: 'Şifreler eşleşmiyor.' },
    );
    validate(path.acceptedTerms, ({ value }) =>
      value()
        ? undefined
        : { kind: 'termsRequired', message: 'KVKK ve kullanım koşullarını onaylayın.' },
    );
  });

  protected readonly passwordStrength = computed(() => {
    const password = this.registerModel().password;
    if (!password) return { level: 0, label: 'Güçlü bir şifre seçin' };
    const checks = [
      password.length >= 8,
      password.length >= 12,
      /[A-ZÇĞİÖŞÜ]/.test(password) && /[a-zçğıöşü]/.test(password),
      /\d/.test(password) && /[^\p{L}\d]/u.test(password),
    ];
    const level = Math.max(1, checks.filter(Boolean).length);
    const labels = ['', 'Zayıf şifre', 'Orta şifre', 'İyi şifre', 'Güçlü şifre'];
    return { level, label: labels[level] };
  });

  /** True when a field was touched and fails validation. */
  protected invalid(field: () => { touched(): boolean; invalid(): boolean }): boolean {
    const state = field();
    return state.touched() && state.invalid();
  }

  protected register(): void {
    submit(this.registerForm, async () => {
      this.error.set('');
      this.isSubmitting.set(true);
      const model = this.registerModel();
      try {
        await this.registration.createOwnerAccount(model);
      } catch (error: unknown) {
        this.error.set(this.errorMessage(error));
      } finally {
        this.isSubmitting.set(false);
      }
    });
  }

  private errorMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      const body = error.error as { message?: string; error?: { message?: string } } | undefined;
      if (error.status === 409) return 'Bu e-posta adresiyle daha önce hesap oluşturulmuş.';
      return (
        body?.message ??
        body?.error?.message ??
        'Hesap oluşturulamadı. Bilgileri kontrol edip tekrar deneyin.'
      );
    }
    return 'Hesap oluşturulamadı. Lütfen tekrar deneyin.';
  }
}
