const fs = require('fs');

const testFile = 'C:/Users/dogan/Documents/Private/Project/OdivonMainApi/src/modules/beauty/shared/beauty-rules.spec.ts';
let content = fs.readFileSync(testFile, 'utf8');

if (!content.includes("'purchase-requisitions'")) {
  const target = "expect(BEAUTY_RESOURCES['nail-sterilizations'].collection).toBe('beautyNailSterilizations');";
  const replacement = `expect(BEAUTY_RESOURCES['nail-sterilizations'].collection).toBe('beautyNailSterilizations');

    expect(BEAUTY_RESOURCES['purchase-requisitions']).toBeDefined();
    expect(BEAUTY_RESOURCES['purchase-requisitions'].collection).toBe('beautyPurchaseRequisitions');
    expect(BEAUTY_RESOURCES['purchase-requisitions'].permission).toBe('beautyInventory');
    expect(BEAUTY_RESOURCES['purchase-requisitions'].branchRequired).toBe(true);

    expect(BEAUTY_RESOURCES['purchase-orders']).toBeDefined();
    expect(BEAUTY_RESOURCES['purchase-orders'].collection).toBe('beautyPurchaseOrders');
    expect(BEAUTY_RESOURCES['purchase-orders'].permission).toBe('beautyInventory');

    expect(BEAUTY_RESOURCES['goods-receipts']).toBeDefined();
    expect(BEAUTY_RESOURCES['goods-receipts'].collection).toBe('beautyGoodsReceipts');
    expect(BEAUTY_RESOURCES['goods-receipts'].permission).toBe('beautyInventory');`;
  content = content.replace(target, replacement);
  fs.writeFileSync(testFile, content, 'utf8');
  console.log('Successfully added purchasing tests to beauty-rules.spec.ts');
} else {
  console.log('Test file already has purchasing tests');
}
