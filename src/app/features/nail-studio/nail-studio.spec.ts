import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { ApiClient } from '../../core/api-client';
import { BranchService } from '../../core/branch.service';
import { NailStudio } from './nail-studio';

describe('NailStudio Component', () => {
  let component: NailStudio;

  const mockApiClient = {
    list: () => of({ data: [] }),
    get: () => of({ data: {} }),
    create: () => of({ data: {} }),
    update: () => of({ data: {} }),
    remove: () => of({ data: { id: 'test' } }),
    request: () => of({ data: {} }),
  };

  const mockBranchService = {
    branches: () => [{ id: 'br-1', name: 'Kadıköy Şubesi' }],
    activeBranchId: () => 'br-1',
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NailStudio],
      providers: [
        provideRouter([]),
        { provide: ApiClient, useValue: mockApiClient },
        { provide: BranchService, useValue: mockBranchService },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(NailStudio);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should initialize with default customizer state', () => {
    expect(component).toBeTruthy();
    expect(component['activeTab']()).toBe('customizer');
    expect(component['selectedShape']()).toBe('almond');
    expect(component['selectedLength']()).toBe('medium');
    expect(component['selectedFinish']()).toBe('glossy');
    expect(component['totalPrice']()).toBeGreaterThan(0);
    expect(component['totalDurationMin']()).toBeGreaterThan(0);
  });

  it('should calculate total price and duration dynamically based on length, tier, and removal', () => {
    // Default Rubber Base (750 TL, 60 min) + Medium (+100 TL, +10 min) + Tier 1 (+150 TL, +15 min) = 1000 TL, 85 min
    expect(component['totalPrice']()).toBe(1000);
    expect(component['totalDurationMin']()).toBe(85);

    // Change length to XL (+450 TL, +30 min)
    component['selectLength']('extra-long');
    expect(component['totalPrice']()).toBe(1350);
    expect(component['totalDurationMin']()).toBe(105);

    // Change art tier to Tier 3 (+600 TL, +45 min)
    component['selectArtTier']('tier-3');
    expect(component['totalPrice']()).toBe(1800);
    expect(component['totalDurationMin']()).toBe(135);

    // Add safe removal (+250 TL, +25 min)
    component['toggleSafeRemoval']();
    expect(component['needsSafeRemoval']()).toBe(true);
    expect(component['totalPrice']()).toBe(2050);
    expect(component['totalDurationMin']()).toBe(160);
  });

  it('should switch tabs and update metrics', () => {
    component['setTab']('warranty');
    expect(component['activeTab']()).toBe('warranty');
    expect(component['activeWarrantiesCount']()).toBeGreaterThan(0);

    component['setTab']('hygiene');
    expect(component['activeTab']()).toBe('hygiene');
    expect(component['todayCycleCount']()).toBeGreaterThan(0);

    component['setTab']('health');
    expect(component['activeTab']()).toBe('health');
    expect(component['healthAssessments']().length).toBeGreaterThan(0);
  });

  it('should filter nail swatches by category', () => {
    const allCount = component['filteredSwatches']().length;
    component['selectedColorCategory'].set('red');
    const redCount = component['filteredSwatches']().length;
    expect(redCount).toBeLessThan(allCount);
    expect(redCount).toBeGreaterThan(0);
  });

  it('should register a warranty repair claim', () => {
    const initialWarranties = component['warranties']();
    const activeOne = initialWarranties.find((w) => w.status === 'active')!;
    expect(activeOne).toBeDefined();

    component['openRepairDialog'](activeOne);
    expect(component['showRepairModal']()).toBe(true);
    expect(component['selectedWarrantyForRepair']()?.id).toBe(activeOne.id);

    component['repairFinger'].set('left-index');
    component['repairNotes'].set('İşaret parmağında çatlak onarıldı');
    component['saveRepairClaim']();

    expect(component['showRepairModal']()).toBe(false);
    const updated = component['warranties']().find((w) => w.id === activeOne.id)!;
    expect(updated.status).toBe('claimed');
    expect(updated.damagedFinger).toBe('left-index');
  });

  it('should add a new autoclave sterilization cycle record', () => {
    const prevCount = component['sterilizations']().length;
    component['openSterilizationDialog']();
    expect(component['showSterilizationModal']()).toBe(true);

    component['newCyclePouchCount'].set(20);
    component['saveSterilizationCycle']();

    expect(component['showSterilizationModal']()).toBe(false);
    expect(component['sterilizations']().length).toBe(prevCount + 1);
    expect(component['sterilizations']()[0].instrumentCount).toBe(20);
  });
});
