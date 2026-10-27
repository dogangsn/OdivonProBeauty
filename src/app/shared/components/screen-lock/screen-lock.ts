import { Component, computed, inject, signal } from '@angular/core';
import { Auth } from '../../../core/auth';
import { BranchService } from '../../../core/branch.service';
import { ScreenLockService } from '../../../core/screen-lock/screen-lock.service';

@Component({
  host: {
    '(window:keydown)': 'onGlobalKeyDown($event)',
  },
  imports: [],
  selector: 'app-screen-lock',
  styleUrl: './screen-lock.css',
  templateUrl: './screen-lock.html',
})
export class ScreenLock {
  protected readonly screenLock = inject(ScreenLockService);
  protected readonly auth = inject(Auth, { optional: true });
  protected readonly branchService = inject(BranchService, { optional: true });

  // Currently typed PIN digits (0 to 4 digits)
  protected readonly enteredPin = signal<string>('');
  protected readonly isVerifying = signal<boolean>(false);
  protected readonly isShaking = signal<boolean>(false);

  // Setup / Change PIN inputs
  protected readonly currentPinInput = signal<string>('');
  protected readonly newPinInput = signal<string>('');
  protected readonly confirmPinInput = signal<string>('');
  protected readonly setupError = signal<string>('');
  protected readonly isSaving = signal<boolean>(false);

  // User Profile information
  protected readonly userName = computed(() => {
    return this.auth?.currentUser()?.displayName || 'Salon Yöneticisi';
  });

  protected readonly userRole = computed(() => {
    const role = this.auth?.role();
    if (!role) return 'Yönetici';
    switch (role) {
      case 'owner':
        return 'Kurucu & Yönetici';
      case 'manager':
        return 'Şube Müdürü';
      case 'receptionist':
        return 'Danışma & Randevu';
      case 'specialist':
        return 'Uzman Estetisyen';
      default:
        return role;
    }
  });

  protected readonly userInitials = computed(() => {
    const name = this.userName().trim();
    if (!name) return 'OP';
    const parts = name.split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  });

  protected readonly branchName = computed(() => {
    return this.branchService?.currentBranch()?.name || 'Merkez Şube';
  });

  /**
   * Handle physical keyboard navigation
   */
  protected onGlobalKeyDown(event: KeyboardEvent): void {
    // Global hotkey: Ctrl+L or Alt+L locks screen
    if ((event.ctrlKey || event.altKey) && (event.key === 'l' || event.key === 'L')) {
      event.preventDefault();
      this.screenLock.lock();
      return;
    }

    // Only process keypad shortcuts when screen is locked and setup modal is closed
    if (!this.screenLock.isLocked() || this.screenLock.isSetupModalOpen()) {
      return;
    }

    if (/^[0-9]$/.test(event.key)) {
      event.preventDefault();
      this.appendDigit(event.key);
    } else if (event.key === 'Backspace') {
      event.preventDefault();
      this.deleteDigit();
    } else if (event.key === 'Escape' || event.key === 'Delete') {
      event.preventDefault();
      this.clearPin();
    }
  }

  /**
   * Numeric keypad digit press
   */
  protected appendDigit(digit: string): void {
    if (
      this.screenLock.lockoutRemainingSeconds() > 0 ||
      this.isVerifying() ||
      this.enteredPin().length >= 4
    ) {
      return;
    }

    const next = this.enteredPin() + digit;
    this.enteredPin.set(next);

    if (next.length === 4) {
      void this.attemptUnlock(next);
    }
  }

  /**
   * Delete last typed digit
   */
  protected deleteDigit(): void {
    if (this.isVerifying()) return;
    const current = this.enteredPin();
    if (current.length > 0) {
      this.enteredPin.set(current.slice(0, -1));
    }
  }

  /**
   * Reset all digits
   */
  protected clearPin(): void {
    if (this.isVerifying()) return;
    this.enteredPin.set('');
  }

  /**
   * Verify entered PIN
   */
  private async attemptUnlock(pin: string): Promise<void> {
    this.isVerifying.set(true);
    const success = await this.screenLock.unlock(pin);
    this.isVerifying.set(false);

    if (success) {
      this.enteredPin.set('');
      this.isShaking.set(false);
    } else {
      this.isShaking.set(true);
      setTimeout(() => {
        this.enteredPin.set('');
        this.isShaking.set(false);
      }, 500);
    }
  }

  /**
   * Emergency / switch user logout
   */
  protected async onLogout(): Promise<void> {
    this.screenLock.forceUnlock();
    this.enteredPin.set('');
    if (this.auth) {
      await this.auth.logout();
    }
  }

  /**
   * Open change PIN dialog
   */
  protected openChangePinModal(): void {
    this.currentPinInput.set('');
    this.newPinInput.set('');
    this.confirmPinInput.set('');
    this.setupError.set('');
    this.screenLock.openSetup('change');
  }

  /**
   * Save initial PIN or change existing PIN
   */
  protected async submitPinSetup(): Promise<void> {
    this.setupError.set('');
    const mode = this.screenLock.setupMode();
    const newPin = this.newPinInput().trim();
    const confirmPin = this.confirmPinInput().trim();

    if (!/^\d{4}$/.test(newPin)) {
      this.setupError.set('Yeni PIN tam olarak 4 haneli rakamlardan oluşmalıdır.');
      return;
    }

    if (newPin !== confirmPin) {
      this.setupError.set('Girdiğiniz PIN kodları birbiriyle eşleşmiyor.');
      return;
    }

    this.isSaving.set(true);
    try {
      if (mode === 'initial') {
        const ok = await this.screenLock.savePin(newPin);
        if (!ok) {
          this.setupError.set('PIN kaydedilemedi.');
        }
      } else {
        const currentPin = this.currentPinInput().trim();
        const res = await this.screenLock.changePin(currentPin, newPin);
        if (!res.success) {
          this.setupError.set(res.error || 'PIN değiştirilemedi.');
        } else {
          this.screenLock.closeSetup();
        }
      }
    } finally {
      this.isSaving.set(false);
    }
  }
}
