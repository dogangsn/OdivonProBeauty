export type RequisitionPriority = 'low' | 'normal' | 'high' | 'urgent';

export type RequisitionCategory =
  | 'tirnak-sarf'
  | 'lazer-sarf'
  | 'cilt-bakim'
  | 'hijyen-sterilizasyon'
  | 'ekipman-yedek-parca'
  | 'genel-sarf';

export type RequisitionStatus =
  | 'draft'
  | 'pending_approval'
  | 'approved'
  | 'rejected'
  | 'ordered'
  | 'cancelled';

export type ApprovalStepStatus = 'pending' | 'approved' | 'rejected' | 'skipped';

export interface ApprovalStep {
  level: number;
  roleName: string;
  approverStaffName?: string;
  approverStaffId?: string;
  status: ApprovalStepStatus;
  actionAt?: string;
  comment?: string;
  minThreshold?: number;
}

export interface PurchaseRequisitionItem {
  id: string;
  productId?: string;
  productName: string;
  brand?: string;
  sku?: string;
  requestedQuantity: number;
  unit: string;
  estimatedUnitCost: number;
  estimatedTotalCost: number;
  notes?: string;
}

export interface PurchaseRequisition {
  id: string;
  code: string;
  branchId: string;
  branchName: string;
  requestedByStaffId: string;
  requestedByStaffName: string;
  requestedAt: string;
  requiredDate: string;
  priority: RequisitionPriority;
  category: RequisitionCategory;
  items: PurchaseRequisitionItem[];
  estimatedTotal: number;
  reason: string;
  status: RequisitionStatus;
  currentApprovalLevel: number;
  approvalFlow: ApprovalStep[];
  purchaseOrderId?: string;
  poNumber?: string;
  rejectReason?: string;
}

export type PaymentTerms =
  | 'pesin'
  | 'vade_30'
  | 'vade_60'
  | 'vade_90'
  | 'havale_eft'
  | 'kredi_karti';

export type PurchaseOrderStatus =
  | 'draft'
  | 'pending_approval'
  | 'approved'
  | 'sent_to_supplier'
  | 'partially_received'
  | 'completed'
  | 'cancelled';

export type DeliveryStatus =
  | 'waiting'
  | 'in_transit'
  | 'partially_received'
  | 'delivered'
  | 'returned';

export type PaymentStatus = 'unpaid' | 'partially_paid' | 'paid';

export interface PurchaseOrderItem {
  id: string;
  productId?: string;
  productName: string;
  brand?: string;
  sku?: string;
  orderedQuantity: number;
  receivedQuantity: number;
  unit: string;
  unitPrice: number;
  taxRate: number;
  discountRate: number;
  lineTotal: number;
}

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  requisitionId?: string;
  requisitionCode?: string;
  supplierId: string;
  supplierName: string;
  supplierContact: string;
  supplierPhone: string;
  supplierEmail: string;
  supplierTaxNumber?: string;
  branchId: string;
  branchName: string;
  orderDate: string;
  expectedDeliveryDate: string;
  paymentTerms: PaymentTerms;
  currency: string;
  items: PurchaseOrderItem[];
  subtotal: number;
  taxTotal: number;
  discountTotal: number;
  grandTotal: number;
  status: PurchaseOrderStatus;
  deliveryStatus: DeliveryStatus;
  paymentStatus: PaymentStatus;
  approvalFlow: ApprovalStep[];
  notes?: string;
  trackingNumber?: string;
  carrierName?: string;
}

export interface GoodsReceiptItem {
  id: string;
  productId?: string;
  productName: string;
  quantityOrdered: number;
  quantityReceived: number;
  quantityRejected: number;
  unit: string;
  lotNumber?: string;
  expiryDate?: string;
  qualityCondition: 'perfect' | 'minor_issue' | 'damaged' | 'rejected';
  rejectReason?: string;
}

export interface GoodsReceipt {
  id: string;
  receiptNumber: string;
  purchaseOrderId: string;
  poNumber: string;
  supplierName: string;
  branchId: string;
  branchName: string;
  waybillNumber: string;
  invoiceNumber?: string;
  receivedAt: string;
  receivedByStaffName: string;
  items: GoodsReceiptItem[];
  status: 'verified' | 'discrepancy' | 'rejected';
  notes?: string;
}

export interface SupplierScorecard {
  id: string;
  supplierName: string;
  category: string;
  contactPerson: string;
  phone: string;
  email: string;
  rating: number;
  onTimeDeliveryRate: number;
  qualityComplianceRate: number;
  leadTimeDays: number;
  activeOrdersCount: number;
  totalSpend: number;
  status: 'active' | 'preferred' | 'under_review' | 'blacklisted';
}

export interface PurchasingKpis {
  pendingRequisitionsCount: number;
  pendingRequisitionsTotal: number;
  activeOrdersCount: number;
  activeOrdersTotal: number;
  monthlySpend: number;
  budgetLimit: number;
  budgetUtilizationPercent: number;
  averageApprovalHours: number;
}

export function buildApprovalSteps(estimatedTotal: number): ApprovalStep[] {
  const steps: ApprovalStep[] = [
    {
      level: 1,
      roleName: 'Şube Müdürü',
      status: 'pending',
      minThreshold: 0,
    },
  ];

  if (estimatedTotal >= 10000) {
    steps.push({
      level: 2,
      roleName: 'Satın Alma & Finans Müdürü',
      status: 'pending',
      minThreshold: 10000,
    });
  }

  if (estimatedTotal >= 50000) {
    steps.push({
      level: 3,
      roleName: 'Genel Müdür / Yönetim',
      status: 'pending',
      minThreshold: 50000,
    });
  }

  return steps;
}
