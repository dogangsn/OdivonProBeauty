import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';
import {
  ApprovalStep,
  GoodsReceipt,
  GoodsReceiptItem,
  PaymentTerms,
  PurchaseOrder,
  PurchaseOrderItem,
  PurchaseOrderStatus,
  PurchaseRequisition,
  PurchaseRequisitionItem,
  PurchasingKpis,
  RequisitionCategory,
  RequisitionPriority,
  RequisitionStatus,
  SupplierScorecard,
  buildApprovalSteps,
} from '../../core/purchasing/purchasing.model';
import {
  INITIAL_GOODS_RECEIPTS,
  INITIAL_KPIS,
  INITIAL_PURCHASE_ORDERS,
  INITIAL_REQUISITIONS,
  INITIAL_SUPPLIERS,
} from '../../core/purchasing/purchasing-demo-data';

export type PurchasingTab =
  | 'requisitions'
  | 'approvals'
  | 'orders'
  | 'goods-receipts'
  | 'suppliers';

@Component({
  selector: 'app-purchasing',
  imports: [CommonModule, FormsModule],
  templateUrl: './purchasing.html',
  styleUrl: './purchasing.css',
})
export class Purchasing {
  // Tabs
  readonly activeTab = signal<PurchasingTab>('requisitions');

  // Core Data Signals
  readonly requisitions = signal<PurchaseRequisition[]>(INITIAL_REQUISITIONS);
  readonly purchaseOrders = signal<PurchaseOrder[]>(INITIAL_PURCHASE_ORDERS);
  readonly goodsReceipts = signal<GoodsReceipt[]>(INITIAL_GOODS_RECEIPTS);
  readonly suppliers = signal<SupplierScorecard[]>(INITIAL_SUPPLIERS);
  readonly kpis = signal<PurchasingKpis>(INITIAL_KPIS);

  // Filters
  readonly requisitionFilter = signal<string>('all');
  readonly orderFilter = signal<string>('all');
  readonly searchQuery = signal<string>('');

  // Modals & Drawers
  readonly isNewRequisitionModalOpen = signal<boolean>(false);
  readonly selectedRequisition = signal<PurchaseRequisition | null>(null);
  readonly isRequisitionDetailOpen = signal<boolean>(false);

  readonly isNewOrderModalOpen = signal<boolean>(false);
  readonly selectedOrder = signal<PurchaseOrder | null>(null);
  readonly isOrderDetailOpen = signal<boolean>(false);

  readonly isGoodsReceiptModalOpen = signal<boolean>(false);
  readonly targetOrderForReceipt = signal<PurchaseOrder | null>(null);

  readonly isRejectModalOpen = signal<boolean>(false);
  readonly rejectTarget = signal<{ type: 'req' | 'order'; id: string; code: string } | null>(null);
  readonly rejectReasonInput = signal<string>('');

  // New Requisition Form State
  readonly newReqBranchName = signal<string>('Nişantaşı Ana Şube');
  readonly newReqCategory = signal<RequisitionCategory>('tirnak-sarf');
  readonly newReqPriority = signal<RequisitionPriority>('normal');
  readonly newReqRequiredDate = signal<string>('2026-10-25');
  readonly newReqReason = signal<string>('');
  readonly newReqItems = signal<Array<{
    productName: string;
    brand: string;
    sku: string;
    requestedQuantity: number;
    unit: string;
    estimatedUnitCost: number;
  }>>([
    {
      productName: '',
      brand: '',
      sku: '',
      requestedQuantity: 1,
      unit: 'Adet',
      estimatedUnitCost: 0,
    },
  ]);

  // Convert / New Order Form State
  readonly newOrderSupplierId = signal<string>('sup-001');
  readonly newOrderExpectedDate = signal<string>('2026-10-26');
  readonly newOrderPaymentTerms = signal<PaymentTerms>('vade_30');
  readonly newOrderNotes = signal<string>('');
  readonly convertingFromRequisition = signal<PurchaseRequisition | null>(null);

  // Goods Receipt Form State
  readonly grnWaybillNumber = signal<string>('');
  readonly grnInvoiceNumber = signal<string>('');
  readonly grnReceivedBy = signal<string>('Merve Demir (Depo & Mal Kabul)');
  readonly grnLotNumber = signal<string>('LOT-2026-');
  readonly grnExpiryDate = signal<string>('2028-12-31');
  readonly grnNotes = signal<string>('');

  // Computed Values
  readonly filteredRequisitions = computed(() => {
    const list = this.requisitions();
    const filter = this.requisitionFilter();
    const query = this.searchQuery().toLowerCase().trim();

    return list.filter((item) => {
      const matchesFilter =
        filter === 'all' ||
        (filter === 'pending' && item.status === 'pending_approval') ||
        (filter === 'approved' && item.status === 'approved') ||
        (filter === 'ordered' && item.status === 'ordered') ||
        (filter === 'rejected' && item.status === 'rejected');

      const matchesSearch =
        !query ||
        item.code.toLowerCase().includes(query) ||
        item.reason.toLowerCase().includes(query) ||
        item.requestedByStaffName.toLowerCase().includes(query) ||
        item.items.some((i) => i.productName.toLowerCase().includes(query));

      return matchesFilter && matchesSearch;
    });
  });

  readonly pendingApprovalRequisitions = computed(() => {
    return this.requisitions().filter((r) => r.status === 'pending_approval');
  });

  readonly pendingApprovalOrders = computed(() => {
    return this.purchaseOrders().filter((o) => o.status === 'pending_approval');
  });

  readonly totalPendingApprovalsCount = computed(() => {
    return this.pendingApprovalRequisitions().length + this.pendingApprovalOrders().length;
  });

  readonly filteredOrders = computed(() => {
    const list = this.purchaseOrders();
    const filter = this.orderFilter();
    const query = this.searchQuery().toLowerCase().trim();

    return list.filter((order) => {
      const matchesFilter =
        filter === 'all' ||
        (filter === 'in_transit' && order.deliveryStatus === 'in_transit') ||
        (filter === 'pending' && order.status === 'pending_approval') ||
        (filter === 'completed' && order.status === 'completed');

      const matchesSearch =
        !query ||
        order.poNumber.toLowerCase().includes(query) ||
        order.supplierName.toLowerCase().includes(query) ||
        (order.trackingNumber && order.trackingNumber.toLowerCase().includes(query));

      return matchesFilter && matchesSearch;
    });
  });

  readonly newReqCalculatedTotal = computed(() => {
    return this.newReqItems().reduce(
      (sum, item) => sum + (item.requestedQuantity || 0) * (item.estimatedUnitCost || 0),
      0
    );
  });

  // Action Methods
  setActiveTab(tab: PurchasingTab): void {
    this.activeTab.set(tab);
  }

  // --- REQUISITION ACTIONS ---
  openNewRequisitionModal(): void {
    this.newReqCategory.set('tirnak-sarf');
    this.newReqPriority.set('normal');
    this.newReqReason.set('');
    this.newReqItems.set([
      {
        productName: '',
        brand: '',
        sku: '',
        requestedQuantity: 1,
        unit: 'Adet',
        estimatedUnitCost: 0,
      },
    ]);
    this.isNewRequisitionModalOpen.set(true);
  }

  closeNewRequisitionModal(): void {
    this.isNewRequisitionModalOpen.set(false);
  }

  addRequisitionItemRow(): void {
    this.newReqItems.update((items) => [
      ...items,
      {
        productName: '',
        brand: '',
        sku: '',
        requestedQuantity: 1,
        unit: 'Adet',
        estimatedUnitCost: 0,
      },
    ]);
  }

  removeRequisitionItemRow(index: number): void {
    this.newReqItems.update((items) => {
      if (items.length <= 1) return items;
      return items.filter((_, i) => i !== index);
    });
  }

  saveNewRequisition(): void {
    const items = this.newReqItems();
    if (!items.length || !items[0].productName.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Eksik Bilgi',
        text: 'Lütfen en az bir ürün kalemi ve adı giriniz.',
      });
      return;
    }

    const total = this.newReqCalculatedTotal();
    const newCode = `TAL-2026-00${this.requisitions().length + 42}`;
    const approvalSteps = buildApprovalSteps(total);

    const newReq: PurchaseRequisition = {
      id: `req-${Date.now()}`,
      code: newCode,
      branchId: 'br-nişantaşı',
      branchName: this.newReqBranchName(),
      requestedByStaffId: 'stf-current',
      requestedByStaffName: 'Klinik Uzmanı (Giriş Yapan Kullanıcı)',
      requestedAt: new Date().toISOString(),
      requiredDate: this.newReqRequiredDate(),
      priority: this.newReqPriority(),
      category: this.newReqCategory(),
      reason: this.newReqReason() || 'Periyodik sarf malzeme ikmali',
      estimatedTotal: total,
      status: 'pending_approval',
      currentApprovalLevel: 1,
      approvalFlow: approvalSteps,
      items: items.map((i, idx) => ({
        id: `item-${Date.now()}-${idx}`,
        productName: i.productName,
        brand: i.brand,
        sku: i.sku || `SKU-${Math.floor(1000 + Math.random() * 9000)}`,
        requestedQuantity: Number(i.requestedQuantity) || 1,
        unit: i.unit,
        estimatedUnitCost: Number(i.estimatedUnitCost) || 0,
        estimatedTotalCost: (Number(i.requestedQuantity) || 1) * (Number(i.estimatedUnitCost) || 0),
      })),
    };

    this.requisitions.update((prev) => [newReq, ...prev]);
    this.updateKpis();
    this.closeNewRequisitionModal();

    Swal.fire({
      icon: 'success',
      title: 'Talep Oluşturuldu!',
      text: `${newCode} kodlu satın alma talebi başarıyla oluşturuldu ve ${approvalSteps[0].roleName} onayına sunuldu.`,
      timer: 3000,
      showConfirmButton: false,
    });
  }

  viewRequisitionDetail(req: PurchaseRequisition): void {
    this.selectedRequisition.set(req);
    this.isRequisitionDetailOpen.set(true);
  }

  closeRequisitionDetail(): void {
    this.isRequisitionDetailOpen.set(false);
  }

  // --- APPROVAL WORKFLOW ACTIONS ---
  approveRequisition(req: PurchaseRequisition): void {
    const steps = [...req.approvalFlow];
    const currentLvl = req.currentApprovalLevel;
    const stepIndex = steps.findIndex((s) => s.level === currentLvl);

    if (stepIndex !== -1) {
      steps[stepIndex] = {
        ...steps[stepIndex],
        status: 'approved',
        approverStaffName: 'Sistem Yöneticisi / Onay Yetkilisi',
        actionAt: new Date().toISOString(),
        comment: 'Bütçe ve stok gereksinimi onaylandı.',
      };
    }

    const hasNextPending = steps.some((s) => s.status === 'pending');
    let nextStatus: RequisitionStatus = 'pending_approval';
    let nextLevel = currentLvl;

    if (!hasNextPending) {
      nextStatus = 'approved';
    } else {
      nextLevel = currentLvl + 1;
    }

    this.requisitions.update((list) =>
      list.map((item) =>
        item.id === req.id
          ? {
              ...item,
              status: nextStatus,
              currentApprovalLevel: nextLevel,
              approvalFlow: steps,
            }
          : item
      )
    );

    if (this.selectedRequisition()?.id === req.id) {
      this.selectedRequisition.update((curr) =>
        curr
          ? {
              ...curr,
              status: nextStatus,
              currentApprovalLevel: nextLevel,
              approvalFlow: steps,
            }
          : null
      );
    }

    this.updateKpis();

    Swal.fire({
      icon: 'success',
      title: hasNextPending ? 'Kademe Onayı Verildi' : 'Talep Tamamen Onaylandı!',
      text: hasNextPending
        ? `${req.code} için Kademe ${currentLvl} onayı tamamlandı. Sonraki kademe onayına aktarıldı.`
        : `${req.code} satın alma talebi onaylandı ve Sipariş Emri (PO) oluşturulmaya hazır.`,
      timer: 2500,
      showConfirmButton: false,
    });
  }

  openRejectModal(type: 'req' | 'order', id: string, code: string): void {
    this.rejectTarget.set({ type, id, code });
    this.rejectReasonInput.set('');
    this.isRejectModalOpen.set(true);
  }

  closeRejectModal(): void {
    this.isRejectModalOpen.set(false);
    this.rejectTarget.set(null);
  }

  confirmReject(): void {
    const target = this.rejectTarget();
    const reason = this.rejectReasonInput().trim();

    if (!target) return;
    if (!reason) {
      Swal.fire({
        icon: 'warning',
        title: 'Ret Gerekçesi Zorunludur',
        text: 'Lütfen talebin veya siparişin neden reddedildiğini açıklayan bir gerekçe giriniz.',
      });
      return;
    }

    if (target.type === 'req') {
      this.requisitions.update((list) =>
        list.map((item) => {
          if (item.id !== target.id) return item;
          const updatedSteps: ApprovalStep[] = item.approvalFlow.map((s) =>
            s.level === item.currentApprovalLevel
              ? {
                  ...s,
                  status: 'rejected',
                  actionAt: new Date().toISOString(),
                  comment: reason,
                }
              : s
          );
          return {
            ...item,
            status: 'rejected',
            rejectReason: reason,
            approvalFlow: updatedSteps,
          };
        })
      );

      if (this.selectedRequisition()?.id === target.id) {
        this.selectedRequisition.update((curr) =>
          curr ? { ...curr, status: 'rejected', rejectReason: reason } : null
        );
      }
    } else {
      this.purchaseOrders.update((list) =>
        list.map((order) =>
          order.id === target.id
            ? { ...order, status: 'cancelled', notes: `Sipariş Reddedildi: ${reason}` }
            : order
        )
      );
    }

    this.updateKpis();
    this.closeRejectModal();

    Swal.fire({
      icon: 'info',
      title: 'İşlem Reddedildi',
      text: `${target.code} kaydı gerekçeli olarak reddedildi.`,
      timer: 2000,
      showConfirmButton: false,
    });
  }

  // --- CONVERT REQUISITION TO PURCHASE ORDER ---
  startConvertToPurchaseOrder(req: PurchaseRequisition): void {
    this.convertingFromRequisition.set(req);
    this.newOrderExpectedDate.set(req.requiredDate || '2026-10-26');
    this.newOrderPaymentTerms.set('vade_30');
    this.newOrderNotes.set(`Talep Referansı: ${req.code} - ${req.reason}`);

    // Auto-select suitable supplier based on category
    if (req.category === 'tirnak-sarf') {
      this.newOrderSupplierId.set('sup-001'); // Kodi
    } else if (req.category === 'lazer-sarf') {
      this.newOrderSupplierId.set('sup-002'); // Candela
    } else if (req.category === 'cilt-bakim') {
      this.newOrderSupplierId.set('sup-003'); // Dermaceutic
    } else if (req.category === 'hijyen-sterilizasyon') {
      this.newOrderSupplierId.set('sup-004'); // Ege Medikal
    }

    this.isRequisitionDetailOpen.set(false);
    this.isNewOrderModalOpen.set(true);
  }

  closeNewOrderModal(): void {
    this.isNewOrderModalOpen.set(false);
    this.convertingFromRequisition.set(null);
  }

  savePurchaseOrder(): void {
    const req = this.convertingFromRequisition();
    const supplier = this.suppliers().find((s) => s.id === this.newOrderSupplierId());

    if (!supplier) {
      Swal.fire({
        icon: 'warning',
        title: 'Tedarikçi Seçimi',
        text: 'Lütfen siparişin gönderileceği tedarikçiyi seçiniz.',
      });
      return;
    }

    const poNumber = `SIP-2026-01${this.purchaseOrders().length + 5}`;
    const items: PurchaseOrderItem[] = req
      ? req.items.map((i, idx) => ({
          id: `po-item-${Date.now()}-${idx}`,
          productName: i.productName,
          brand: i.brand,
          sku: i.sku,
          orderedQuantity: i.requestedQuantity,
          receivedQuantity: 0,
          unit: i.unit,
          unitPrice: i.estimatedUnitCost,
          taxRate: 20,
          discountRate: 0,
          lineTotal: i.estimatedTotalCost,
        }))
      : [
          {
            id: `po-item-${Date.now()}`,
            productName: 'Doğrudan Sipariş Kalemi',
            orderedQuantity: 10,
            receivedQuantity: 0,
            unit: 'Adet',
            unitPrice: 500,
            taxRate: 20,
            discountRate: 0,
            lineTotal: 5000,
          },
        ];

    const subtotal = items.reduce((sum, item) => sum + item.lineTotal, 0);
    const taxTotal = subtotal * 0.2;
    const grandTotal = subtotal + taxTotal;

    const newOrder: PurchaseOrder = {
      id: `po-${Date.now()}`,
      poNumber,
      requisitionId: req?.id,
      requisitionCode: req?.code,
      supplierId: supplier.id,
      supplierName: supplier.supplierName,
      supplierContact: supplier.contactPerson,
      supplierPhone: supplier.phone,
      supplierEmail: supplier.email,
      branchId: req?.branchId || 'br-nişantaşı',
      branchName: req?.branchName || 'Nişantaşı Ana Şube',
      orderDate: new Date().toISOString().split('T')[0],
      expectedDeliveryDate: this.newOrderExpectedDate(),
      paymentTerms: this.newOrderPaymentTerms(),
      currency: 'TRY',
      subtotal,
      taxTotal,
      discountTotal: 0,
      grandTotal,
      status: 'sent_to_supplier',
      deliveryStatus: 'in_transit',
      paymentStatus: 'unpaid',
      trackingNumber: `KRG-${Math.floor(10000000 + Math.random() * 90000000)}`,
      carrierName: 'Medikal Express Lojistik',
      approvalFlow: [
        {
          level: 1,
          roleName: 'Satın Alma Yetkilisi',
          approverStaffName: 'Sistem Yöneticisi',
          status: 'approved',
          actionAt: new Date().toISOString(),
        },
      ],
      items,
      notes: this.newOrderNotes(),
    };

    // Update requisitions if converted
    if (req) {
      this.requisitions.update((list) =>
        list.map((r) =>
          r.id === req.id
            ? { ...r, status: 'ordered', purchaseOrderId: newOrder.id, poNumber }
            : r
        )
      );
    }

    this.purchaseOrders.update((list) => [newOrder, ...list]);
    this.updateKpis();
    this.closeNewOrderModal();

    Swal.fire({
      icon: 'success',
      title: 'Sipariş Emri Oluşturuldu!',
      text: `${poNumber} numaralı sipariş başarıyla oluşturuldu ve ${supplier.supplierName} firmasına gönderildi.`,
      timer: 3000,
      showConfirmButton: false,
    });
  }

  viewOrderDetail(order: PurchaseOrder): void {
    this.selectedOrder.set(order);
    this.isOrderDetailOpen.set(true);
  }

  closeOrderDetail(): void {
    this.isOrderDetailOpen.set(false);
  }

  // --- GOODS RECEIPT ACTIONS ---
  openGoodsReceiptModal(order: PurchaseOrder): void {
    this.targetOrderForReceipt.set(order);
    this.grnWaybillNumber.set(`IRS-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`);
    this.grnInvoiceNumber.set(`GIB-${new Date().getFullYear()}${Math.floor(10000000 + Math.random() * 90000000)}`);
    this.grnLotNumber.set(`LOT-${new Date().getFullYear()}-M${Math.floor(10 + Math.random() * 90)}`);
    this.grnExpiryDate.set('2028-12-31');
    this.grnNotes.set('Ürün ambalajları ve güvenlik mühürleri kontrol edildi, eksiksiz kabul edildi.');
    this.isOrderDetailOpen.set(false);
    this.isGoodsReceiptModalOpen.set(true);
  }

  closeGoodsReceiptModal(): void {
    this.isGoodsReceiptModalOpen.set(false);
    this.targetOrderForReceipt.set(null);
  }

  confirmGoodsReceipt(): void {
    const order = this.targetOrderForReceipt();
    if (!order) return;

    const receiptNumber = `MK-2026-00${this.goodsReceipts().length + 40}`;

    const receiptItems: GoodsReceiptItem[] = order.items.map((i, idx) => ({
      id: `grn-item-${Date.now()}-${idx}`,
      productId: i.productId,
      productName: i.productName,
      quantityOrdered: i.orderedQuantity,
      quantityReceived: i.orderedQuantity,
      quantityRejected: 0,
      unit: i.unit,
      lotNumber: this.grnLotNumber(),
      expiryDate: this.grnExpiryDate(),
      qualityCondition: 'perfect',
    }));

    const newReceipt: GoodsReceipt = {
      id: `grn-${Date.now()}`,
      receiptNumber,
      purchaseOrderId: order.id,
      poNumber: order.poNumber,
      supplierName: order.supplierName,
      branchId: order.branchId,
      branchName: order.branchName,
      waybillNumber: this.grnWaybillNumber(),
      invoiceNumber: this.grnInvoiceNumber(),
      receivedAt: new Date().toISOString(),
      receivedByStaffName: this.grnReceivedBy(),
      items: receiptItems,
      status: 'verified',
      notes: this.grnNotes(),
    };

    // Update purchase order delivery status
    this.purchaseOrders.update((list) =>
      list.map((o) =>
        o.id === order.id
          ? {
              ...o,
              status: 'completed',
              deliveryStatus: 'delivered',
              items: o.items.map((it) => ({ ...it, receivedQuantity: it.orderedQuantity })),
            }
          : o
      )
    );

    this.goodsReceipts.update((list) => [newReceipt, ...list]);
    this.updateKpis();
    this.closeGoodsReceiptModal();

    Swal.fire({
      icon: 'success',
      title: 'Mal Kabul Yapıldı!',
      text: `${receiptNumber} nolu teslim tesellüm tutanağı düzenlendi ve ürünler klinik stoklarına aktarıldı.`,
      timer: 3000,
      showConfirmButton: false,
    });
  }

  // Helper
  private updateKpis(): void {
    const reqs = this.requisitions();
    const orders = this.purchaseOrders();

    const pendingReqs = reqs.filter((r) => r.status === 'pending_approval');
    const pendingReqsTotal = pendingReqs.reduce((sum, r) => sum + r.estimatedTotal, 0);

    const activeOrders = orders.filter((o) => o.status !== 'completed' && o.status !== 'cancelled');
    const activeOrdersTotal = activeOrders.reduce((sum, o) => sum + o.grandTotal, 0);

    this.kpis.update((kpi) => ({
      ...kpi,
      pendingRequisitionsCount: pendingReqs.length,
      pendingRequisitionsTotal: pendingReqsTotal,
      activeOrdersCount: activeOrders.length,
      activeOrdersTotal: activeOrdersTotal,
    }));
  }
}
