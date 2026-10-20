import { DOCUMENT } from '@angular/common';
import { Service, inject } from '@angular/core';
import { version } from '../../../package.json';
import { Auth } from './auth';

/** Released app version. Bump it in package.json (`npm version patch`) to ship a new version. */
export const APP_VERSION: string = version;

export const APP_VERSION_STORAGE_KEY = 'odivon.appVersion';

/**
 * Runs once on app start (also after the service worker reloads into a new build).
 * When the stored version differs from the running one, it clears cookies and
 * web storage and signs out the current user, so they start clean on the new version.
 */
@Service()
export class AppVersion {
  private readonly document = inject(DOCUMENT);
  private readonly auth = inject(Auth);

  async check(): Promise<void> {
    const storage = this.storage();
    if (!storage) return;

    if (this.read(storage) === APP_VERSION) return;

    this.clearCookies();
    this.clearStorage(storage);
    await this.auth.signOutIfAuthenticated();
    this.write(storage, APP_VERSION);
  }

  private storage(): Storage | null {
    try {
      return this.document.defaultView?.localStorage ?? null;
    } catch {
      return null;
    }
  }

  private read(storage: Storage): string | null {
    try {
      return storage.getItem(APP_VERSION_STORAGE_KEY);
    } catch {
      return null;
    }
  }

  private write(storage: Storage, value: string): void {
    try {
      storage.setItem(APP_VERSION_STORAGE_KEY, value);
    } catch {
      // Storage may be blocked (private mode); the check simply runs again next time.
    }
  }

  private clearStorage(storage: Storage): void {
    try {
      storage.clear();
      this.document.defaultView?.sessionStorage.clear();
    } catch {
      // Ignore blocked storage.
    }
  }

  private clearCookies(): void {
    const hostname = this.document.location?.hostname ?? '';
    const domainParts = hostname.split('.');
    const domains = [''];
    for (let i = 0; i < domainParts.length - 1; i++) {
      domains.push(`; domain=.${domainParts.slice(i).join('.')}`);
    }

    for (const cookie of this.document.cookie.split(';')) {
      const name = cookie.split('=')[0]?.trim();
      if (!name) continue;
      for (const domain of domains) {
        this.document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/${domain}`;
      }
    }
  }
}
