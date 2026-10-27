import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ScreenLock } from './screen-lock';
import { ScreenLockService } from '../../../core/screen-lock/screen-lock.service';

describe('ScreenLock Component', () => {
  let fixture: ComponentFixture<ScreenLock>;
  let component: ScreenLock;
  let service: ScreenLockService;

  beforeEach(async () => {
    localStorage.clear();
    sessionStorage.clear();

    await TestBed.configureTestingModule({
      imports: [ScreenLock],
      providers: [ScreenLockService],
    }).compileComponents();

    service = TestBed.inject(ScreenLockService);
    fixture = TestBed.createComponent(ScreenLock);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should respond to Ctrl+L shortcut by calling lock()', () => {
    const lockSpy = vi.spyOn(service, 'lock');
    const event = new KeyboardEvent('keydown', { key: 'l', ctrlKey: true });
    window.dispatchEvent(event);
    expect(lockSpy).toHaveBeenCalled();
  });

  it('should append digits, delete, and clear entered PIN', () => {
    service.isLocked.set(true);
    (component as any).appendDigit('1');
    (component as any).appendDigit('2');
    expect((component as any).enteredPin()).toBe('12');

    (component as any).deleteDigit();
    expect((component as any).enteredPin()).toBe('1');

    (component as any).clearPin();
    expect((component as any).enteredPin()).toBe('');
  });

  it('should trigger unlock automatically when 4th digit is entered', async () => {
    await service.savePin('1234');
    service.lock();
    expect(service.isLocked()).toBe(true);

    const unlockSpy = vi.spyOn(service, 'unlock');
    (component as any).appendDigit('1');
    (component as any).appendDigit('2');
    (component as any).appendDigit('3');
    (component as any).appendDigit('4');

    expect(unlockSpy).toHaveBeenCalledWith('1234');
  });

  it('should reject mismatched PIN during setup', async () => {
    service.openSetup('initial');
    (component as any).newPinInput.set('1234');
    (component as any).confirmPinInput.set('5678');

    await (component as any).submitPinSetup();
    expect((component as any).setupError()).toContain('eşleşmiyor');
  });

  it('should save PIN successfully during setup', async () => {
    service.openSetup('initial');
    (component as any).newPinInput.set('9999');
    (component as any).confirmPinInput.set('9999');

    await (component as any).submitPinSetup();
    expect((component as any).setupError()).toBe('');
    expect(service.hasPin()).toBe(true);
    expect(service.isLocked()).toBe(true);
  });
});
