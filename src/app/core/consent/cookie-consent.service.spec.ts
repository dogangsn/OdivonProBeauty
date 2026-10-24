import { TestBed } from '@angular/core/testing';
import { COOKIE_CONSENT_STORAGE_KEY, CookieConsentService } from './cookie-consent.service';
import { PRESERVED_STORAGE_KEYS } from '../version/version-compare';

describe('CookieConsentService', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.resetTestingModule();
  });

  it('shows the banner until the visitor decides', () => {
    const service = TestBed.inject(CookieConsentService);
    expect(service.visible()).toBe(true);
    expect(service.analyticsAllowed()).toBe(false);
    service.rejectAll();
    expect(service.visible()).toBe(false);
    expect(service.analyticsAllowed()).toBe(false);
  });

  it('remembers acceptance across reloads', () => {
    TestBed.inject(CookieConsentService).acceptAll();
    TestBed.resetTestingModule();
    const reloaded = TestBed.inject(CookieConsentService);
    expect(reloaded.decided()).toBe(true);
    expect(reloaded.analyticsAllowed()).toBe(true);
  });

  it('re-opens the banner for changing the choice', () => {
    const service = TestBed.inject(CookieConsentService);
    service.acceptAll();
    service.openSettings();
    expect(service.visible()).toBe(true);
    service.save(false);
    expect(service.visible()).toBe(false);
    expect(service.analyticsAllowed()).toBe(false);
  });

  it('ignores a corrupt stored value', () => {
    localStorage.setItem(COOKIE_CONSENT_STORAGE_KEY, '{not json');
    expect(TestBed.inject(CookieConsentService).decided()).toBe(false);
  });

  it('survives the forced app update purge', () => {
    expect(PRESERVED_STORAGE_KEYS).toContain(COOKIE_CONSENT_STORAGE_KEY);
  });
});
