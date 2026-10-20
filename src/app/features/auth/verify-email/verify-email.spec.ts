import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Auth } from '../../../core/auth';
import { Registration } from '../../../core/registration';
import { VerifyEmail } from './verify-email';

describe('VerifyEmail', () => {
  let registrationMock: {
    verifyEmail: ReturnType<typeof vi.fn>;
    resendVerification: ReturnType<typeof vi.fn>;
  };
  let authMock: { authenticated: ReturnType<typeof vi.fn>; isReadyAndAuthenticated: ReturnType<typeof vi.fn> };
  let routerMock: { navigate: ReturnType<typeof vi.fn>; navigateByUrl: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    registrationMock = {
      verifyEmail: vi.fn().mockResolvedValue({ success: true, email: 'test@example.com' }),
      resendVerification: vi.fn().mockResolvedValue({ success: true }),
    };
    authMock = {
      authenticated: vi.fn().mockReturnValue(false),
      isReadyAndAuthenticated: vi.fn().mockResolvedValue(false),
    };
    routerMock = {
      navigate: vi.fn().mockResolvedValue(true),
      navigateByUrl: vi.fn().mockResolvedValue(true),
    };

    await TestBed.configureTestingModule({
      imports: [VerifyEmail],
      providers: [
        { provide: Registration, useValue: registrationMock },
        { provide: Auth, useValue: authMock },
        { provide: Router, useValue: routerMock },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              queryParams: { email: 'owner@clinic.com' },
            },
          },
        },
      ],
    }).compileComponents();
  });

  it('should initialize with pending state and read email from query params', async () => {
    const fixture = TestBed.createComponent(VerifyEmail);
    const component = fixture.componentInstance;
    await component.ngOnInit();

    expect(component['state']()).toBe('pending');
    expect(component['email']()).toBe('owner@clinic.com');
  });

  it('should call resendVerification and activate cooldown', async () => {
    const fixture = TestBed.createComponent(VerifyEmail);
    const component = fixture.componentInstance;
    await component.ngOnInit();

    await component['resendLink']();
    expect(registrationMock.resendVerification).toHaveBeenCalledWith('owner@clinic.com');
    expect(component['resendSuccess']()).toBe(true);
    expect(component['resendCooldown']()).toBeGreaterThan(0);
  });
});
