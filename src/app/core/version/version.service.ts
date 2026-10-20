import { DOCUMENT } from '@angular/common';
import { DestroyRef, Service, computed, inject, signal } from '@angular/core';
import { SwUpdate } from '@angular/service-worker';
import { Auth } from '../auth';
import { BUILD_INFO, BuildInfo } from './build-info';
import { PRESERVED_STORAGE_KEYS, compareVersions } from './version-compare';

const CHECK_INTERVAL_MS = 5 * 60_000;

@Service()
export class VersionService {
  private readonly document = inject(DOCUMENT);
  private readonly sw = inject(SwUpdate, { optional: true });
  private readonly auth = inject(Auth);
  private readonly destroyRef = inject(DestroyRef);

  readonly current: BuildInfo = BUILD_INFO;
  readonly available = signal<BuildInfo | null>(null);
  readonly applying = signal(false);
  private readonly forced = signal(false);

  readonly manualOpen = signal(false);
  readonly isChecking = signal(false);
  readonly lastCheckedAt = signal<Date | null>(null);

  /** A newer release is deployed (or the API refused this build): the update dialog is shown. */
  readonly updateRequired = computed(() => this.forced() || this.available() !== null);

  /** Modal is visible if an update is required or if opened manually for release info. */
  readonly modalVisible = computed(() => this.updateRequired() || this.manualOpen());

  /** Release marked critical in release.json (only changes the wording of the dialog). */
  readonly critical = computed(() => {
    const next = this.available();
    if (this.forced()) return true;
    if (!next) return false;
    return (
      next.forceLogout ||
      (!!next.minVersion && compareVersions(this.current.version, next.minVersion) < 0)
    );
  });

  private started = false;

  start(): void {
    if (this.started || typeof window === 'undefined') return;
    this.started = true;

    if (this.sw?.isEnabled) {
      const sub = this.sw.versionUpdates.subscribe((event) => {
        if (event.type === 'VERSION_READY') void this.checkRemote();
      });
      this.destroyRef.onDestroy(() => sub.unsubscribe());
    }

    void this.check();
    const timer = window.setInterval(() => void this.check(), CHECK_INTERVAL_MS);
    const onVisible = () => {
      if (!this.document.hidden) void this.check();
    };
    this.document.addEventListener('visibilitychange', onVisible);
    this.destroyRef.onDestroy(() => {
      window.clearInterval(timer);
      this.document.removeEventListener('visibilitychange', onVisible);
    });
  }

  openModal(): void {
    this.manualOpen.set(true);
  }

  closeModal(): void {
    this.manualOpen.set(false);
    if (!this.updateRequired()) {
      this.available.set(null);
    }
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
    void this.checkRemote();
  }

  async applyUpdate(): Promise<void> {
    if (this.applying()) return;
    this.applying.set(true);
    try {
      await this.auth.signOutIfAuthenticated().catch(() => undefined);
      if (typeof caches !== 'undefined') {
        const keys = await caches.keys().catch(() => [] as string[]);
        await Promise.all(keys.map((key) => caches.delete(key).catch(() => false)));
      }
      this.clearStorage();
      this.clearCookies();
      if (this.sw?.isEnabled) {
        await this.sw.activateUpdate().catch(() => false);
      }
    } finally {
      const targetWindow = this.document.defaultView ?? window;
      targetWindow.location.replace('/login?updated=1');
    }
  }

  private async check(): Promise<void> {
    if (this.sw?.isEnabled) {
      await this.sw.checkForUpdate().catch(() => false);
    }
    await this.checkRemote();
  }

  private async checkRemote(): Promise<void> {
    const defaultView = this.document.defaultView ?? window;
    // Don't block local dev debugging
    if (
      defaultView.location.hostname === 'localhost' ||
      defaultView.location.hostname === '127.0.0.1'
    ) {
      return;
    }

    try {
      const response = await fetch(`/version.json?t=${Date.now()}`, { cache: 'no-store' });
      if (!response.ok) return;
      const remote = (await response.json()) as BuildInfo;

      if (remote.buildId && remote.buildId !== this.current.buildId) {
        this.available.set(remote);
      }
    } catch {
      // Offline or network error: will retry next interval
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
    } catch {
      // Ignore cookie errors
    }
  }
}
