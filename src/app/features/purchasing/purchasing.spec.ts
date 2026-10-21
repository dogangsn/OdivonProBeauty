import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import Swal from 'sweetalert2';
import { Purchasing } from './purchasing';
import { buildApprovalSteps } from '../../core/purchasing/purchasing.model';

describe('Purchasing Component & Workflow Rules', () => {
  beforeEach(async () => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });

    vi.spyOn(Swal, 'fire').mockResolvedValue({
      isConfirmed: true,
      isDenied: false,
      isDismissed: false,
      value: true,
    } as never);

    await TestBed.configureTestingModule({
      imports: [Purchasing],
    }).compileComponents();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('initializes with default requisitions, orders and kpis', () => {
    const fixture = TestBed.createComponent(Purchasing);
    const component = fixture.componentInstance;
    expect(component).toBeTruthy();
    expect(component.activeTab()).toBe('requisitions');
    expect(component.requisitions().length).toBeGreaterThan(0);
    expect(component.purchaseOrders().length).toBeGreaterThan(0);
    expect(component.suppliers().length).toBeGreaterThan(0);
    expect(component.totalPendingApprovalsCount()).toBeGreaterThan(0);
  });

  it('switches between tabs properly', () => {
    const fixture = TestBed.createComponent(Purchasing);
    const component = fixture.componentInstance;

    component.setActiveTab('approvals');
    expect(component.activeTab()).toBe('approvals');

    component.setActiveTab('orders');
    expect(component.activeTab()).toBe('orders');

    component.setActiveTab('goods-receipts');
    expect(component.activeTab()).toBe('goods-receipts');

    component.setActiveTab('suppliers');
    expect(component.activeTab()).toBe('suppliers');
  });

  it('calculates approval step thresholds accurately according to company governance', () => {
    // Under 10,000 -> 1 level (Şube Müdürü)
    const smallSteps = buildApprovalSteps(4500);
    expect(smallSteps.length).toBe(1);
    expect(smallSteps[0].roleName).toBe('Şube Müdürü');

    // 10,000 to 50,000 -> 2 levels (Şube Müdürü + Satın Alma Müdürü)
    const midSteps = buildApprovalSteps(24000);
    expect(midSteps.length).toBe(2);
    expect(midSteps[1].roleName).toContain('Satın Alma');

    // 50,000 and above -> 3 levels (Şube Müdürü + Satın Alma Müdürü + Genel Müdür)
    const largeSteps = buildApprovalSteps(75000);
    expect(largeSteps.length).toBe(3);
    expect(largeSteps[2].roleName).toContain('Genel Müdür');
  });

  it('approves requisition step-by-step through the multi-level workflow', () => {
    const fixture = TestBed.createComponent(Purchasing);
    const component = fixture.componentInstance;

    // Find pending requisition req-001 (Level 2 pending)
    const target = component.requisitions().find((r) => r.id === 'req-001');
    expect(target).toBeDefined();
    if (!target) return;

    component.approveRequisition(target);

    const updated = component.requisitions().find((r) => r.id === 'req-001');
    expect(updated?.status).toBe('approved');
    expect(updated?.approvalFlow[1].status).toBe('approved');
  });

  it('rejects requisition with reason and updates status to rejected', () => {
    const fixture = TestBed.createComponent(Purchasing);
    const component = fixture.componentInstance;

    component.openRejectModal('req', 'req-002', 'TAL-2026-0042');
    component.rejectReasonInput.set('Mevcut stok yeterli, aciliyet bulunmamaktadır.');
    component.confirmReject();

    const rejected = component.requisitions().find((r) => r.id === 'req-002');
    expect(rejected?.status).toBe('rejected');
    expect(rejected?.rejectReason).toBe('Mevcut stok yeterli, aciliyet bulunmamaktadır.');
  });

  it('converts approved requisition to purchase order', () => {
    const fixture = TestBed.createComponent(Purchasing);
    const component = fixture.componentInstance;

    const initialOrderCount = component.purchaseOrders().length;
    const approvedReq = component.requisitions().find((r) => r.status === 'approved');
    expect(approvedReq).toBeDefined();
    if (!approvedReq) return;

    component.startConvertToPurchaseOrder(approvedReq);
    expect(component.isNewOrderModalOpen()).toBe(true);

    component.savePurchaseOrder();

    expect(component.purchaseOrders().length).toBe(initialOrderCount + 1);
    const convertedReq = component.requisitions().find((r) => r.id === approvedReq.id);
    expect(convertedReq?.status).toBe('ordered');
    expect(convertedReq?.poNumber).toBeDefined();
  });

  it('processes goods receipt and marks purchase order as completed', () => {
    const fixture = TestBed.createComponent(Purchasing);
    const component = fixture.componentInstance;

    const initialReceiptCount = component.goodsReceipts().length;
    const inTransitOrder = component.purchaseOrders().find((o) => o.deliveryStatus === 'in_transit');
    expect(inTransitOrder).toBeDefined();
    if (!inTransitOrder) return;

    component.openGoodsReceiptModal(inTransitOrder);
    expect(component.isGoodsReceiptModalOpen()).toBe(true);

    component.confirmGoodsReceipt();

    expect(component.goodsReceipts().length).toBe(initialReceiptCount + 1);
    const updatedOrder = component.purchaseOrders().find((o) => o.id === inTransitOrder.id);
    expect(updatedOrder?.deliveryStatus).toBe('delivered');
    expect(updatedOrder?.status).toBe('completed');
  });
});
