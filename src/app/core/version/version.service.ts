import { DOCUMENT } from '@angular/common';
import { DestroyRef, Service, computed, inject, isDevMode, signal } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { SwUpdate } from '@angular/service-worker';
import { filter } from 'rxjs';
import { Auth } from '../auth';
import { BUILD_INFO, BuildInfo } from './build-info';
import { PRESERVED_STORAGE_KEYS, compareVersions } from './version-compare';

const CHECK_INTERVAL_MS = 10_000;
const ROUTE_CHECK_THROTTLE_MS = 5_000;
const AUTO_UPDATE_SECONDS = 45;

@Service()
export class VersionService {
  private readonly document = inject(DOCUMENT);
  private readonly sw = inject(SwUpdate, { optional: true });
  private readonly router = inject(Router, { optional: true });
  private readonly auth = inject(Auth);
  private readonly destroyRef = inject(DestroyRef);

  readonly current: BuildInfo = BUILD_INFO;
  readonly available = signal<BuildInfo | null>(null);
  readonly applying = signal(false);
  private readonly forced = signal(false);

  readonly manualOpen = signal(false);
  readonly isChecking = signal(false);
  readonly lastCheckedAt = signal<Date | null>(null);
  readonly countdown = signal<number | null>(null);
  private lastRouteCheckTime = 0;
  private countdownTimer: number | null = null;

  /** A newer release is deployed (or the API refused this build): the update dialog is shown. */
  readonly updateRequired = computed(() => this.forced() || this.available() !== null);

  /** Modal is visible if an update is required or if opened manually for release info. */
  readonly modalVisible = computed(() => this.updateRequired() || this.manualOpen());

  /** Every release is critical/mandatory to guarantee schema, security & data integrity. */
  readonly critical = computed(() => true);

  private started = false;

  start(): void {
    if (this.started || typeof window === 'undefined') return;
    this.started = true;

    // React immediately if ServiceWorker detects or finishes preparing a new release
    if (this.sw?.isEnabled) {
      const sub = this.sw.versionUpdates.subscribe(async (event) => {
        console.info('[VersionService] ServiceWorker event:', event.type);
        if (event.type === 'VERSION_DETECTED' || event.type === 'VERSION_READY') {
          await this.checkRemote();
          if (!this.available()) {
            this.forced.set(true);
            this.startCountdown();
          }
        }
      });
      this.destroyRef.onDestroy(() => sub.unsubscribe());
    }

    void this.check();
    const timer = window.setInterval(() => void this.check(), CHECK_INTERVAL_MS);

    const onVisible = () => {
      if (!this.document.hidden) void this.check();
    };
    this.document.addEventListener('visibilitychange', onVisible);

    const defaultView = this.document.defaultView ?? window;
    defaultView.addEventListener('focus', onVisible);

    if (this.router) {
      const navSub = this.router.events
        .pipe(filter((e) => e instanceof NavigationEnd))
        .subscribe(() => {
          const now = Date.now();
          if (now - this.lastRouteCheckTime > ROUTE_CHECK_THROTTLE_MS) {
            this.lastRouteCheckTime = now;
            void this.check();
          }
        });
      this.destroyRef.onDestroy(() => navSub.unsubscribe());
    }

    this.destroyRef.onDestroy(() => {
      window.clearInterval(timer);
      this.stopCountdown();
      this.document.removeEventListener('visibilitychange', onVisible);
      defaultView.removeEventListener('focus', onVisible);
    });
  }

  openModal(): void {
    this.manualOpen.set(true);
  }

  closeModal(): void {
    if (this.updateRequired()) {
      // Mandatory update cannot be closed!
      return;
    }
    this.manualOpen.set(false);
    this.available.set(null);
  }

  async checkNow(): Promise<void> {
    if (this.isChecking()) return;
    this.isChecking.set(true);
    try {
      await this.check();
      this.lastCheckedAt.set(new Date());
    } finally {
      this.isChecking.set(false);
    }
  }

  forceUpdate(): void {
    this.forced.set(true);
    this.startCountdown();
    void this.checkRemote();
  }

  async applyUpdate(): Promise<void> {
    if (this.applying()) return;
    this.applying.set(true);
    this.stopCountdown();

    const doPurgeAndRedirect = async () => {
      // Drop the service worker first, so the reload below is served from the network
      // and always lands on the latest deployed build in one step, however many
      // releases were published since this tab loaded.
      await this.unregisterServiceWorkers();

      try {
        await this.auth.signOutIfAuthenticated().catch(() => undefined);
      } catch {
        // Ignore auth error
      }

      try {
        if (typeof caches !== 'undefined') {
          const keys = await caches.keys().catch(() => [] as string[]);
          await Promise.all(keys.map((key) => caches.delete(key).catch(() => false)));
        }
      } catch {
        // Ignore cache error
      }

      this.clearStorage();
      this.clearCookies();
      await this.clearIndexedDb();
    };

    // Guarantee that redirect runs within 2.5 seconds max even if any step stalls
    await Promise.race([doPurgeAndRedirect(), new Promise((resolve) => setTimeout(resolve, 2500))]);

    const targetWindow = this.document.defaultView ?? window;
    targetWindow.location.replace('/login?updated=1');
  }

  private startCountdown(): void {
    if (this.countdownTimer !== null || this.countdown() !== null) return;
    this.countdown.set(AUTO_UPDATE_SECONDS);
    this.countdownTimer = window.setInterval(() => {
      const current = this.countdown();
      if (current === null || current <= 1) {
        this.stopCountdown();
        void this.applyUpdate();
      } else {
        this.countdown.set(current - 1);
      }
    }, 1000);
  }

  private stopCountdown(): void {
    if (this.countdownTimer !== null) {
      window.clearInterval(this.countdownTimer);
      this.countdownTimer = null;
    }
  }

  private async check(): Promise<void> {
    if (this.sw?.isEnabled) {
      await this.sw.checkForUpdate().catch(() => false);
    }
    await this.checkRemote();
  }

  private async checkRemote(): Promise<void> {
    if (isDevMode()) return;
    try {
      const response = await fetch(`/version.json?t=${Date.now()}`, { cache: 'no-store' });
      if (!response.ok) return;
      const remote = (await response.json()) as BuildInfo;

      if (remote.buildId && remote.buildId !== this.current.buildId) {
        console.info(
          `[VersionService] Yeni sürüm algılandı: ${remote.buildId} (Mevcut: ${this.current.buildId})`,
        );
        this.available.set(remote);
        this.startCountdown();
      }
    } catch {
      // Offline or network error: will retry next interval
    }
  }

  private async unregisterServiceWorkers(): Promise<void> {
    try {
      const container = (this.document.defaultView ?? window).navigator.serviceWorker;
      if (!container) return;
      const registrations = await container.getRegistrations();
      await Promise.all(registrations.map((r) => r.unregister().catch(() => false)));
    } catch {
      // Service workers unsupported or blocked
    }
  }

  private clearStorage(): void {
    try {
      const storage = this.document.defaultView?.localStorage;
      if (!storage) return;
      const kept = PRESERVED_STORAGE_KEYS.map((key) => [key, storage.getItem(key)] as const);
      storage.clear();
      for (const [key, value] of kept) {
        if (value !== null) storage.setItem(key, value);
      }
      this.document.defaultView?.sessionStorage.clear();
    } catch {
      // Private mode or blocked storage
    }
  }

  private clearCookies(): void {
    try {
      const hostname = this.document.location?.hostname ?? '';
      const parts = hostname.split('.');
      const domainSuffixes = [''];
      for (let i = 0; i < parts.length; i++) {
        const d = parts.slice(i).join('.');
        domainSuffixes.push(d);
        domainSuffixes.push(`.${d}`);
      }

      const cookies = this.document.cookie ? this.document.cookie.split(';') : [];
      for (const cookie of cookies) {
        const name = cookie.split('=')[0]?.trim();
        if (!name) continue;
        for (const dom of domainSuffixes) {
          const domStr = dom ? `; domain=${dom}` : '';
          this.document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/${domStr}`;
          this.document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=${domStr}`;
        }
      }
    } catch {
      // Ignore cookie errors
    }
  }

  private async clearIndexedDb(): Promise<void> {
    try {
      const defaultView = this.document.defaultView ?? window;
      if (typeof defaultView.indexedDB !== 'undefined' && defaultView.indexedDB.databases) {
        const dbs = await defaultView.indexedDB.databases();
        for (const db of dbs) {
          if (db.name && (db.name.includes('firebase') || db.name.includes('firestore'))) {
            defaultView.indexedDB.deleteDatabase(db.name);
          }
        }
      }
    } catch {
      // Ignore indexedDB error
    }
  }
}
