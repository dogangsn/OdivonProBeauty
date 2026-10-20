import { TestBed } from '@angular/core/testing';
import { APP_VERSION, APP_VERSION_STORAGE_KEY, AppVersion } from './app-version';
import { Auth } from './auth';

describe('AppVersion', () => {
  let signOutIfAuthenticated: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    signOutIfAuthenticated = vi.fn().mockResolvedValue(undefined);
    TestBed.configureTestingModule({
      providers: [{ provide: Auth, useValue: { signOutIfAuthenticated } }],
    });
  });

  it('does nothing when the stored version matches', async () => {
    localStorage.setItem(APP_VERSION_STORAGE_KEY, APP_VERSION);
    localStorage.setItem('keep', '1');

    await TestBed.inject(AppVersion).check();

    expect(localStorage.getItem('keep')).toBe('1');
    expect(signOutIfAuthenticated).not.toHaveBeenCalled();
  });

  it('clears storage and cookies and signs out on a new version', async () => {
    localStorage.setItem(APP_VERSION_STORAGE_KEY, '0.0.0-old');
    localStorage.setItem('stale', '1');
    sessionStorage.setItem('stale', '1');
    document.cookie = 'stale=1; path=/';

    await TestBed.inject(AppVersion).check();

    expect(localStorage.getItem('stale')).toBeNull();
    expect(sessionStorage.getItem('stale')).toBeNull();
    expect(document.cookie).not.toContain('stale=1');
    expect(signOutIfAuthenticated).toHaveBeenCalledOnce();
    expect(localStorage.getItem(APP_VERSION_STORAGE_KEY)).toBe(APP_VERSION);
  });

  it('treats a first visit as a new version', async () => {
    await TestBed.inject(AppVersion).check();

    expect(signOutIfAuthenticated).toHaveBeenCalledOnce();
    expect(localStorage.getItem(APP_VERSION_STORAGE_KEY)).toBe(APP_VERSION);
  });
});
