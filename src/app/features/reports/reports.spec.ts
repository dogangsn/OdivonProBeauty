import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiClient } from '../../core/api-client';
import { BranchService } from '../../core/branch.service';
import { Reports } from './reports';

describe('Reports', () => {
  let apiMock: Record<string, ReturnType<typeof vi.fn>>;
  let branchServiceMock: {
    ensureBranches: ReturnType<typeof vi.fn>;
    branches: ReturnType<typeof vi.fn>;
    activeBranchId: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    apiMock = {
      list: vi.fn().mockReturnValue(of({ success: true, data: [] })),
      request: vi.fn().mockReturnValue(of({ success: true, data: { revenue: 100000, appointments: 50 } })),
    };

    branchServiceMock = {
      ensureBranches: vi.fn().mockResolvedValue([]),
      branches: vi.fn().mockReturnValue([]),
      activeBranchId: vi.fn().mockReturnValue(''),
    };

    await TestBed.configureTestingModule({
      imports: [Reports],
      providers: [
        { provide: ApiClient, useValue: apiMock },
        { provide: BranchService, useValue: branchServiceMock },
      ],
    }).compileComponents();
  });

  it('should create the reports component successfully', () => {
    const fixture = TestBed.createComponent(Reports);
    const component = fixture.componentInstance;
    expect(component).toBeTruthy();
  });

  it('should initialize with financial tab and allow tab switching', () => {
    const fixture = TestBed.createComponent(Reports);
    const component = fixture.componentInstance;
    expect(component['activeTab']()).toBe('financial');

    component['setTab']('services');
    expect(component['activeTab']()).toBe('services');

    component['setTab']('staff');
    expect(component['activeTab']()).toBe('staff');

    component['setTab']('consultations');
    expect(component['activeTab']()).toBe('consultations');

    component['setTab']('cashier');
    expect(component['activeTab']()).toBe('cashier');
  });

  it('should switch period presets and compute period label correctly', () => {
    const fixture = TestBed.createComponent(Reports);
    const component = fixture.componentInstance;

    component['setPeriod']('today');
    expect(component['selectedPeriod']()).toBe('today');
    expect(component['periodLabel']()).toContain('Bugün');

    component['setPeriod']('year');
    expect(component['selectedPeriod']()).toBe('year');
    expect(component['periodLabel']()).toContain('2026');
  });

  it('should provide comprehensive financial metrics and breakdown arrays', () => {
    const fixture = TestBed.createComponent(Reports);
    const component = fixture.componentInstance;

    const summary = component['financialSummary']();
    expect(summary.totalRevenue).toBeGreaterThan(0);
    expect(summary.cardRevenue).toBeGreaterThan(0);
    expect(summary.growthPercent).toBe(18.4);

    expect(component['dailyRevenues']().length).toBeGreaterThan(0);
    expect(component['servicePerformances']().length).toBeGreaterThan(0);
    expect(component['staffPerformances']().length).toBeGreaterThan(0);
    expect(component['leadChannels']().length).toBeGreaterThan(0);
    expect(component['cashierTransactions']().length).toBeGreaterThan(0);
  });
});
