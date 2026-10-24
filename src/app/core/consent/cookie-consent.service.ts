import { DOCUMENT } from '@angular/common';
import { Service, computed, inject, signal } from '@angular/core';

export const COOKIE_CONSENT_STORAGE_KEY = 'odivon:cookie_consent';
/** Bump when the cookie categories change, so everyone is asked again. */
const CONSENT_VERSION = 1;

export interface CookieConsent {
  version: number;
  analytics: boolean;
  decidedAt: string;
}

/**
 * Keeps the visitor's cookie choice. Essential storage (sign-in session,
 * language, theme) is always allowed; analytics only after opt-in.
 */
@Service()
export class CookieConsentService {
  private readonly document = inject(DOCUMENT);
  private readonly state = signal<CookieConsent | null>(this.read());
  private readonly settingsOpen = signal(false);

  readonly consent = this.state.asReadonly();
  readonly decided = computed(() => this.state() !== null);
  readonly analyticsAllowed = computed(() => this.state()?.analytics === true);
  /** Whether the banner should be shown. */
  readonly visible = computed(() => !this.decided() || this.settingsOpen());

  acceptAll(): void {
    this.save(true);
  }

  rejectAll(): void {
    this.save(false);
  }

  save(analytics: boolean): void {
    const value: CookieConsent = {
      version: CONSENT_VERSION,
      analytics,
      decidedAt: new Date().toISOString(),
    };
    this.state.set(value);
    this.settingsOpen.set(false);
    try {
      this.document.defaultView?.localStorage.setItem(
        COOKIE_CONSENT_STORAGE_KEY,
        JSON.stringify(value),
      );
    } catch {
      // Storage blocked: the choice holds for this visit only.
    }
  }

  /** Re-opens the banner so the visitor can change their choice. */
  openSettings(): void {
    this.settingsOpen.set(true);
  }

  closeSettings(): void {
    this.settingsOpen.set(false);
  }

  private read(): CookieConsent | null {
    try {
      const raw = this.document.defaultView?.localStorage.getItem(COOKIE_CONSENT_STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as Partial<CookieConsent>;
      if (parsed.version !== CONSENT_VERSION || typeof parsed.analytics !== 'boolean') return null;
      return parsed as CookieConsent;
    } catch {
      return null;
    }
  }
}
