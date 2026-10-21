const fs = require('fs');

// 1. Update beauty-store.ts
const storePath = 'C:/Users/dogan/Documents/Private/Project/OdivonMainApi/src/modules/beauty/shared/beauty-store.ts';
let storeContent = fs.readFileSync(storePath, 'utf8');

if (!storeContent.includes("'purchase-requisitions'")) {
  const target = "'nail-swatches': {";
  const replacement = `'purchase-requisitions': {
    collection: 'beautyPurchaseRequisitions',
    permission: 'beautyInventory',
    branchRequired: true,
  },
  'purchase-orders': {
    collection: 'beautyPurchaseOrders',
    permission: 'beautyInventory',
    branchRequired: true,
  },
  'goods-receipts': {
    collection: 'beautyGoodsReceipts',
    permission: 'beautyInventory',
    branchRequired: true,
  },
  'nail-swatches': {`;
  storeContent = storeContent.replace(target, replacement);
  fs.writeFileSync(storePath, storeContent, 'utf8');
  console.log('Successfully updated beauty-store.ts with purchase-requisitions, purchase-orders, goods-receipts');
} else {
  console.log('beauty-store.ts already has purchasing resources');
}

// 2. Update beauty.dto.ts
const dtoPath = 'C:/Users/dogan/Documents/Private/Project/OdivonMainApi/src/modules/beauty/beauty.dto.ts';
let dtoContent = fs.readFileSync(dtoPath, 'utf8');

if (!dtoContent.includes('BeautyPurchaseRequisitionDto')) {
  const dtsToAdd = `

export class BeautyPurchaseRequisitionDto {
  @IsString() code!: string;
  @IsString() requestedByStaffName!: string;
  @IsString() requestedAt!: string;
  @IsString() requiredDate!: string;
  @IsIn(['low', 'normal', 'high', 'urgent']) priority!: string;
  @IsString() category!: string;
  @IsArray() items!: Array<Record<string, unknown>>;
  @IsNumber() estimatedTotal!: number;
  @IsString() reason!: string;
  @IsIn(['draft', 'pending_approval', 'approved', 'rejected', 'ordered', 'cancelled']) status!: string;
  @IsOptional() @IsNumber() currentApprovalLevel?: number;
  @IsOptional() @IsArray() approvalFlow?: Array<Record<string, unknown>>;
  @IsOptional() @IsString() purchaseOrderId?: string;
  @IsOptional() @IsString() branchId?: string;
}

export class BeautyPurchaseOrderDto {
  @IsString() poNumber!: string;
  @IsOptional() @IsString() requisitionId?: string;
  @IsString() supplierId!: string;
  @IsString() supplierName!: string;
  @IsString() orderDate!: string;
  @IsString() expectedDeliveryDate!: string;
  @IsString() paymentTerms!: string;
  @IsString() currency!: string;
  @IsArray() items!: Array<Record<string, unknown>>;
  @IsNumber() subtotal!: number;
  @IsNumber() taxTotal!: number;
  @IsNumber() grandTotal!: number;
  @IsIn(['draft', 'pending_approval', 'approved', 'sent_to_supplier', 'partially_received', 'completed', 'cancelled']) status!: string;
  @IsIn(['waiting', 'in_transit', 'partially_received', 'delivered', 'returned']) deliveryStatus!: string;
  @IsIn(['unpaid', 'partially_paid', 'paid']) paymentStatus!: string;
  @IsOptional() @IsArray() approvalFlow?: Array<Record<string, unknown>>;
  @IsOptional() @IsString() notes?: string;
  @IsOptional() @IsString() branchId?: string;
}

export class BeautyGoodsReceiptDto {
  @IsString() receiptNumber!: string;
  @IsString() purchaseOrderId!: string;
  @IsString() poNumber!: string;
  @IsString() supplierName!: string;
  @IsString() waybillNumber!: string;
  @IsOptional() @IsString() invoiceNumber?: string;
  @IsString() receivedAt!: string;
  @IsString() receivedByStaffName!: string;
  @IsArray() items!: Array<Record<string, unknown>>;
  @IsIn(['verified', 'discrepancy', 'rejected']) status!: string;
  @IsOptional() @IsString() notes?: string;
  @IsOptional() @IsString() branchId?: string;
}
`;
  dtoContent = dtoContent + dtsToAdd;
  fs.writeFileSync(dtoPath, dtoContent, 'utf8');
  console.log('Successfully updated beauty.dto.ts with purchasing DTOs');
} else {
  console.log('beauty.dto.ts already has purchasing DTOs');
}
