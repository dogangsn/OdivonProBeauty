import { Service, computed, inject, signal } from '@angular/core';
import { Auth } from '../auth';

const PIN_STORAGE_KEY = 'odivon_screen_lock_pin_hash';
const LOCKED_STORAGE_KEY = 'odivon_screen_locked';

/**
 * Computes a secure SHA-256 hash with an application salt for a 4-digit PIN.
 */
export async function hashPin(pin: string): Promise<string> {
  const enc = new TextEncoder();
  const data = enc.encode(`odivon_pro_beauty_lock_salt_#${pin.trim()}#_2026`);
  const buffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

@Service()
export class ScreenLockService {
  private readonly auth = inject(Auth, { optional: true });

  // Has the user configured a PIN code?
  readonly hasPin = signal<boolean>(this.checkHasPin());

  // Is the application screen currently locked?
  readonly isLocked = signal<boolean>(this.checkIsLocked());

  // Is the PIN setup / change modal open?
  readonly isSetupModalOpen = signal<boolean>(false);

  // Mode for setup modal: 'initial' | 'change'
  readonly setupMode = signal<'initial' | 'change'>('initial');

  // Consecutive failed PIN unlock attempts
  readonly failedAttempts = signal<number>(0);

  // Temporary lockout timestamp after excessive failed attempts (rate limiting)
  readonly lockoutUntil = signal<number | null>(null);

  // Dynamic feedback message for wrong PIN or status
  readonly feedback = signal<string>('');

  // Lockout countdown timer signal in seconds
  readonly lockoutRemainingSeconds = computed(() => {
    const until = this.lockoutUntil();
    if (!until) return 0;
    const diff = Math.ceil((until - Date.now()) / 1000);
    return diff > 0 ? diff : 0;
  });

  private checkHasPin(): boolean {
    if (typeof localStorage === 'undefined') return false;
    return Boolean(localStorage.getItem(PIN_STORAGE_KEY));
  }

  private checkIsLocked(): boolean {
    if (typeof sessionStorage === 'undefined') return false;
    return sessionStorage.getItem(LOCKED_STORAGE_KEY) === 'true';
  }

  /**
   * Lock the screen. If no PIN is set yet, opens the setup modal.
   */
  lock(): void {
    if (!this.hasPin()) {
      this.openSetup('initial');
      return;
    }
    this.isLocked.set(true);
    this.feedback.set('');
    try {
      sessionStorage.setItem(LOCKED_STORAGE_KEY, 'true');
    } catch {
      // Ignore storage errors in restricted contexts
    }
  }

  /**
   * Attempt to unlock the screen with a 4-digit PIN.
   */
  async unlock(pin: string): Promise<boolean> {
    if (this.lockoutRemainingSeconds() > 0) {
      this.feedback.set(
        `Çok fazla hatalı deneme yapıldı. Lütfen ${this.lockoutRemainingSeconds()} saniye bekleyin.`,
      );
      return false;
    }

    if (pin.length !== 4 || !/^\d{4}$/.test(pin)) {
      this.feedback.set('Lütfen 4 haneli rakam girin.');
      return false;
    }

    const storedHash = localStorage.getItem(PIN_STORAGE_KEY);
    if (!storedHash) {
      // Fallback if PIN was cleared
      this.forceUnlock();
      return true;
    }

    const inputHash = await hashPin(pin);
    if (inputHash === storedHash) {
      this.forceUnlock();
      return true;
    }

    // Failed attempt
    const attempts = this.failedAttempts() + 1;
    this.failedAttempts.set(attempts);

    if (attempts >= 5) {
      const lockUntil = Date.now() + 30 * 1000; // 30 sec penalty
      this.lockoutUntil.set(lockUntil);
      this.feedback.set('5 kez hatalı PIN girildi. Sistem 30 saniye kilitlendi.');
    } else {
      const remaining = 5 - attempts;
      this.feedback.set(`Hatalı PIN! (${remaining} deneme hakkı kaldı)`);
    }

    return false;
  }

  /**
   * Set or update the 4-digit PIN.
   */
  async savePin(newPin: string): Promise<boolean> {
    if (newPin.length !== 4 || !/^\d{4}$/.test(newPin)) {
      this.feedback.set('PIN kodu tam olarak 4 haneli rakamlardan oluşmalıdır.');
      return false;
    }

    const hash = await hashPin(newPin);
    try {
      localStorage.setItem(PIN_STORAGE_KEY, hash);
      this.hasPin.set(true);
      this.isSetupModalOpen.set(false);
      this.feedback.set('');
      // If we were configuring initial PIN, immediately lock as intended
      if (this.setupMode() === 'initial') {
        this.lock();
      }
      return true;
    } catch (err) {
      console.error('Failed to store screen lock PIN:', err);
      this.feedback.set('PIN kaydedilirken bir hata oluştu.');
      return false;
    }
  }

  /**
   * Verify old PIN and change to new PIN.
   */
  async changePin(oldPin: string, newPin: string): Promise<{ success: boolean; error?: string }> {
    const storedHash = localStorage.getItem(PIN_STORAGE_KEY);
    if (storedHash) {
      const oldHash = await hashPin(oldPin);
      if (oldHash !== storedHash) {
        return { success: false, error: 'Mevcut PIN kodunuz hatalı.' };
      }
    }

    if (newPin.length !== 4 || !/^\d{4}$/.test(newPin)) {
      return { success: false, error: 'Yeni PIN tam olarak 4 haneli rakamlardan oluşmalıdır.' };
    }

    const saved = await this.savePin(newPin);
    return { success: saved, error: saved ? undefined : 'Yeni PIN kaydedilemedi.' };
  }

  /**
   * Open the PIN setup modal.
   */
  openSetup(mode: 'initial' | 'change' = 'initial'): void {
    this.setupMode.set(mode);
    this.feedback.set('');
    this.isSetupModalOpen.set(true);
  }

  /**
   * Close the PIN setup modal.
   */
  closeSetup(): void {
    this.isSetupModalOpen.set(false);
    this.feedback.set('');
  }

  /**
   * Unlocks the screen without PIN (e.g. after logout or direct authorization).
   */
  forceUnlock(): void {
    this.isLocked.set(false);
    this.failedAttempts.set(0);
    this.lockoutUntil.set(null);
    this.feedback.set('');
    try {
      sessionStorage.removeItem(LOCKED_STORAGE_KEY);
    } catch {
      // Ignore
    }
  }

  /**
   * Removes existing PIN.
   */
  removePin(): void {
    try {
      localStorage.removeItem(PIN_STORAGE_KEY);
      this.hasPin.set(false);
      this.forceUnlock();
    } catch {
      // Ignore
    }
  }
}
