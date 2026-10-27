import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { ScreenLockService, hashPin } from './screen-lock.service';

describe('ScreenLockService', () => {
  let service: ScreenLockService;

  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();

    TestBed.configureTestingModule({
      providers: [ScreenLockService],
    });

    service = TestBed.inject(ScreenLockService);
  });

  it('should create the service and have initial unlocked state', () => {
    expect(service).toBeTruthy();
    expect(service.hasPin()).toBe(false);
    expect(service.isLocked()).toBe(false);
  });

  it('should open setup modal when lock() is called and no PIN exists', () => {
    service.lock();
    expect(service.isSetupModalOpen()).toBe(true);
    expect(service.setupMode()).toBe('initial');
    expect(service.isLocked()).toBe(false);
  });

  it('should reject invalid PIN formats during savePin', async () => {
    const shortPin = await service.savePin('12');
    expect(shortPin).toBe(false);

    const nonDigit = await service.savePin('abcd');
    expect(nonDigit).toBe(false);

    expect(service.hasPin()).toBe(false);
  });

  it('should save a valid 4-digit PIN and lock screen', async () => {
    service.openSetup('initial');
    const success = await service.savePin('1234');
    expect(success).toBe(true);
    expect(service.hasPin()).toBe(true);
    expect(service.isLocked()).toBe(true);
  });

  it('should correctly unlock with right PIN and reject wrong PIN', async () => {
    await service.savePin('9876');
    service.lock();
    expect(service.isLocked()).toBe(true);

    // Wrong PIN
    const wrong = await service.unlock('1111');
    expect(wrong).toBe(false);
    expect(service.isLocked()).toBe(true);
    expect(service.failedAttempts()).toBe(1);

    // Correct PIN
    const correct = await service.unlock('9876');
    expect(correct).toBe(true);
    expect(service.isLocked()).toBe(false);
    expect(service.failedAttempts()).toBe(0);
  });

  it('should change PIN when old PIN is verified', async () => {
    await service.savePin('1234');

    const invalidOld = await service.changePin('9999', '5678');
    expect(invalidOld.success).toBe(false);

    const success = await service.changePin('1234', '5678');
    expect(success.success).toBe(true);

    service.lock();
    const unlockWithNew = await service.unlock('5678');
    expect(unlockWithNew).toBe(true);
  });

  it('should enforce lockout after 5 consecutive failed attempts', async () => {
    await service.savePin('4321');
    service.lock();

    for (let i = 0; i < 5; i++) {
      await service.unlock('0000');
    }

    expect(service.failedAttempts()).toBe(5);
    expect(service.lockoutRemainingSeconds()).toBeGreaterThan(0);

    // Immediate attempt should fail even if correct during lockout
    const blocked = await service.unlock('4321');
    expect(blocked).toBe(false);
  });
});
