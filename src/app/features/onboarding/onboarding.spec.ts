import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiClient } from '../../core/api-client';
import { Auth } from '../../core/auth';
import { BranchService } from '../../core/branch.service';
import { DefinitionsService } from '../../core/definitions/definitions.service';
import { Onboarding } from './onboarding';

describe('Onboarding', () => {
  let apiMock: {
    request: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
  };
  let authMock: {
    currentUser: ReturnType<typeof vi.fn>;
  };
  let branchMock: {
    ensureBranches: ReturnType<typeof vi.fn>;
  };
  let defServiceMock: {
    syncRemote: ReturnType<typeof vi.fn>;
  };
  let routerMock: {
    navigateByUrl: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    apiMock = {
      request: vi.fn().mockReturnValue(of({ data: { branchId: 'br_123', tenantId: 't_123' } })),
      create: vi.fn().mockReturnValue(of({ data: { id: 'created_item' } })),
      update: vi.fn().mockReturnValue(of({ data: { id: 'updated_item' } })),
    };
    authMock = {
      currentUser: vi.fn().mockReturnValue({ email: 'owner@beauty.com', displayName: 'Ayşe Hanım' }),
    };
    branchMock = {
      ensureBranches: vi.fn().mockResolvedValue([{ id: 'br_123', name: 'Merkez Şube' }]),
    };
    defServiceMock = {
      syncRemote: vi.fn().mockResolvedValue(undefined),
    };
    routerMock = {
      navigateByUrl: vi.fn().mockResolvedValue(true),
    };

    await TestBed.configureTestingModule({
      imports: [Onboarding],
      providers: [
        { provide: ApiClient, useValue: apiMock },
        { provide: Auth, useValue: authMock },
        { provide: BranchService, useValue: branchMock },
        { provide: DefinitionsService, useValue: defServiceMock },
        { provide: Router, useValue: routerMock },
      ],
    }).compileComponents();
  });

  it('should initialize with step 1 and valid defaults', () => {
    const fixture = TestBed.createComponent(Onboarding);
    const component = fixture.componentInstance;
    component.ngOnInit();

    expect(component.currentStep()).toBe(1);
    expect(component.businessName()).toBeTruthy();
    expect(component.branchName()).toBeTruthy();
    expect(component.selectedDaysCount()).toBeGreaterThan(0);
    expect(component.selectedDefCount()).toBeGreaterThan(5);
  });

  it('should toggle days and apply presets', () => {
    const fixture = TestBed.createComponent(Onboarding);
    const component = fixture.componentInstance;

    component.setDaysPreset('weekdays');
    expect(component.selectedDaysCount()).toBe(5);

    component.setDaysPreset('all');
    expect(component.selectedDaysCount()).toBe(7);

    component.toggleDay(0); // Sunday
    expect(component.selectedDaysCount()).toBe(6);
  });

  it('should advance through steps and complete onboarding', async () => {
    const fixture = TestBed.createComponent(Onboarding);
    const component = fixture.componentInstance;
    component.ngOnInit();

    component.nextStep();
    expect(component.currentStep()).toBe(2);

    component.nextStep();
    expect(component.currentStep()).toBe(3);

    component.nextStep();
    expect(component.currentStep()).toBe(4);

    component.nextStep();
    expect(component.currentStep()).toBe(5);

    await component.completeOnboarding();
    expect(apiMock.request).toHaveBeenCalledWith(
      'POST',
      'beauty/onboarding',
      expect.objectContaining({
        businessName: component.businessName(),
        branchName: component.branchName(),
      }),
    );
    expect(routerMock.navigateByUrl).toHaveBeenCalledWith('/dashboard');
  });
});
