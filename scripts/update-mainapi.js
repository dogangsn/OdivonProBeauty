const fs = require('fs');
const path = require('path');

const targetDir = 'C:/Users/dogan/Documents/Private/Project/OdivonMainApi/src/modules/beauty';

// 1. Update beauty-store.ts
const storePath = path.join(targetDir, 'shared', 'beauty-store.ts');
let storeCode = fs.readFileSync(storePath, 'utf8');

if (!storeCode.includes('beautyNailWarranties')) {
  const targetResourceStr = "  installments: {\r\n    collection: 'beautyInstallmentPlans',\r\n    permission: 'beautyFinance',\r\n    branchRequired: true,\r\n  },";
  const targetResourceStrLf = "  installments: {\n    collection: 'beautyInstallmentPlans',\n    permission: 'beautyFinance',\n    branchRequired: true,\n  },";

  const nailResources = `  installments: {
    collection: 'beautyInstallmentPlans',
    permission: 'beautyFinance',
    branchRequired: true,
  },
  'nail-designs': {
    collection: 'beautyNailDesigns',
    permission: 'beautyCatalog',
    branchRequired: true,
  },
  'nail-warranties': {
    collection: 'beautyNailWarranties',
    permission: 'beautyAppointments',
    branchRequired: true,
  },
  'nail-sterilizations': {
    collection: 'beautyNailSterilizations',
    permission: 'beautyResources',
    branchRequired: true,
  },
  'nail-swatches': {
    collection: 'beautyNailSwatches',
    permission: 'beautyCatalog',
    branchRequired: true,
  },`;

  if (storeCode.includes(targetResourceStr)) {
    storeCode = storeCode.replace(targetResourceStr, nailResources.replace(/\n/g, '\r\n'));
  } else if (storeCode.includes(targetResourceStrLf)) {
    storeCode = storeCode.replace(targetResourceStrLf, nailResources);
  }

  const oldScope = `'wallet-transactions',
          'installments'`;
  const newScope = `'wallet-transactions',
          'installments',
          'nail-warranties',
          'nail-designs'`;

  if (storeCode.includes(oldScope.replace(/\n/g, '\r\n'))) {
    storeCode = storeCode.replace(oldScope.replace(/\n/g, '\r\n'), newScope.replace(/\n/g, '\r\n'));
  } else if (storeCode.includes(oldScope)) {
    storeCode = storeCode.replace(oldScope, newScope);
  }

  fs.writeFileSync(storePath, storeCode, 'utf8');
  console.log('Added nail resources to beauty-store.ts');
} else {
  console.log('Nail resources already in beauty-store.ts');
}

// 2. Update beauty.dto.ts
const dtoPath = path.join(targetDir, 'beauty.dto.ts');
let dtoCode = fs.readFileSync(dtoPath, 'utf8');

const nailDtos = `
export class BeautyNailWarrantyDto {
  @IsString() customerId!: string;
  @IsString() customerName!: string;
  @IsString() phone!: string;
  @IsISO8601() appliedDate!: string;
  @IsISO8601() warrantyExpireDate!: string;
  @IsString() technicianStaffName!: string;
  @IsString() technique!: string;
  @IsString() nailShape!: string;
  @IsString() swatchCode!: string;
  @IsIn(['active', 'claimed', 'expired']) status!: string;
  @IsOptional() @IsString() claimedAt?: string;
  @IsOptional() @IsString() damagedFinger?: string;
  @IsOptional() @IsString() repairNotes?: string;
  @IsOptional() @IsString() branchId?: string;
}

export class BeautyNailSterilizationDto {
  @IsString() cycleNumber!: string;
  @IsString() autoclaveDeviceName!: string;
  @IsString() sterilizedAt!: string;
  @IsString() sterilizedByStaffName!: string;
  @IsNumber() temperatureCelsius!: number;
  @IsNumber() pressureBar!: number;
  @IsNumber() holdTimeMinutes!: number;
  @IsBoolean() indicatorStripPassed!: boolean;
  @IsString() batchPouchBarcode!: string;
  @IsNumber() instrumentCount!: number;
  @IsOptional() @IsString() assignedCustomerName?: string;
  @IsOptional() @IsString() notes?: string;
  @IsOptional() @IsString() branchId?: string;
}
`;

if (!dtoCode.includes('BeautyNailWarrantyDto')) {
  dtoCode += (dtoCode.includes('\r\n') ? nailDtos.replace(/\n/g, '\r\n') : nailDtos);
  fs.writeFileSync(dtoPath, dtoCode, 'utf8');
  console.log('Added nail DTOs to beauty.dto.ts');
} else {
  console.log('Nail DTOs already in beauty.dto.ts');
}

// 3. Update beauty-rules.spec.ts
const specPath = path.join(targetDir, 'shared', 'beauty-rules.spec.ts');
let specCode = fs.readFileSync(specPath, 'utf8');
if (!specCode.includes('nail-warranties')) {
  const targetSpec = "expect(BEAUTY_RESOURCES['installments']).toBeDefined();\n    expect(BEAUTY_RESOURCES['installments'].collection).toBe('beautyInstallmentPlans');";
  const targetSpecCrlf = "expect(BEAUTY_RESOURCES['installments']).toBeDefined();\r\n    expect(BEAUTY_RESOURCES['installments'].collection).toBe('beautyInstallmentPlans');";
  const nailSpec = `expect(BEAUTY_RESOURCES['installments']).toBeDefined();
    expect(BEAUTY_RESOURCES['installments'].collection).toBe('beautyInstallmentPlans');

    expect(BEAUTY_RESOURCES['nail-warranties']).toBeDefined();
    expect(BEAUTY_RESOURCES['nail-warranties'].collection).toBe('beautyNailWarranties');

    expect(BEAUTY_RESOURCES['nail-sterilizations']).toBeDefined();
    expect(BEAUTY_RESOURCES['nail-sterilizations'].collection).toBe('beautyNailSterilizations');`;

  if (specCode.includes(targetSpecCrlf)) {
    specCode = specCode.replace(targetSpecCrlf, nailSpec.replace(/\n/g, '\r\n'));
  } else if (specCode.includes(targetSpec)) {
    specCode = specCode.replace(targetSpec, nailSpec);
  }
  fs.writeFileSync(specPath, specCode, 'utf8');
  console.log('Added nail tests to beauty-rules.spec.ts');
} else {
  console.log('Nail tests already in beauty-rules.spec.ts');
}
