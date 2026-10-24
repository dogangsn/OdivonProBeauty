import { DOCUMENT } from '@angular/common';
import { Service, effect, inject, isDevMode } from '@angular/core';
import { getApp, getApps, initializeApp } from 'firebase/app';
import type { Analytics } from 'firebase/analytics';
import { environment } from '../../../environments/environment';
import { CookieConsentService } from './cookie-consent.service';

/**
 * Google Analytics 4 through Firebase Analytics (measurement id comes from
 * `environment.firebase.measurementId`). The SDK is downloaded and started only
 * after the visitor accepts analytics cookies, and is switched off again if they
 * withdraw consent. Page views on route changes are tracked by GA4 enhanced
 * measurement ("page changes based on browser history events").
 */
@Service()
export class AnalyticsService {
  private readonly consent = inject(CookieConsentService);
  private readonly document = inject(DOCUMENT);
  private analytics: Analytics | null = null;
  private loading: Promise<void> | null = null;

  constructor() {
    effect(() => {
      const allowed = this.consent.analyticsAllowed();
      if (allowed) {
        void this.enable();
      } else if (this.consent.decided()) {
        void this.disable();
      }
    });
  }

  private get measurementId(): string {
    return (environment.firebase as { measurementId?: string }).measurementId ?? '';
  }

  private enable(): Promise<void> {
    if (isDevMode() || !this.measurementId) return Promise.resolve();
    if (this.analytics) {
      return import('firebase/analytics').then(({ setAnalyticsCollectionEnabled }) =>
        setAnalyticsCollectionEnabled(this.analytics!, true),
      );
    }
    this.loading ??= (async () => {
      try {
        const { initializeAnalytics, isSupported } = await import('firebase/analytics');
        if (!(await isSupported())) return;
        const app = getApps().length ? getApp() : initializeApp(environment.firebase);
        this.analytics = initializeAnalytics(app, {
          config: { anonymize_ip: true, cookie_flags: 'SameSite=Lax;Secure' },
        });
      } catch {
        // Blocked by an ad blocker or offline: the app keeps working without analytics.
      } finally {
        this.loading = null;
      }
    })();
    return this.loading;
  }

  private async disable(): Promise<void> {
    if (this.analytics) {
      const { setAnalyticsCollectionEnabled } = await import('firebase/analytics');
      setAnalyticsCollectionEnabled(this.analytics, false);
    }
    this.deleteGaCookies();
  }

  private deleteGaCookies(): void {
    try {
      const host = this.document.location?.hostname ?? '';
      const parts = host.split('.');
      const domains = ['', host, parts.length > 1 ? `.${parts.slice(-2).join('.')}` : ''];
      for (const cookie of this.document.cookie ? this.document.cookie.split(';') : []) {
        const name = cookie.split('=')[0]?.trim();
        if (!name || !(name === '_ga' || name.startsWith('_ga_') || name === '_gid')) continue;
        for (const domain of domains) {
          const domainAttr = domain ? `; domain=${domain}` : '';
          this.document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/${domainAttr}`;
        }
      }
    } catch {
      // Cookies blocked.
    }
  }
}
