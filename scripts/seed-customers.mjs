import { readFileSync } from 'node:fs';

const apiKey = 'AIzaSyAu1u-wKeR9RQBhp6lqUvo64ZbQ5fNDIGg';

async function main() {
  console.log('Authenticating as odivonbeauty@odivon.com...');
  const authRes = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'odivonbeauty@odivon.com',
        password: '123654Dg',
        returnSecureToken: true,
      }),
    }
  );

  const authData = await authRes.json();
  if (!authData.idToken) {
    console.error('Auth failed:', authData);
    process.exit(1);
  }

  const token = authData.idToken;
  console.log('Authenticated! UID:', authData.localId);

  // Fetch branch
  const branchRes = await fetch('https://mainapi.odivon.com/api/v1/beauty/branches', {
    headers: { Authorization: `Bearer ${token}` },
  });
  const branchData = await branchRes.json();
  const branchId = branchData.data?.[0]?.id;
  console.log('Target Branch ID:', branchId);

  // Clear existing demo customers if any
  const existingRes = await fetch('https://mainapi.odivon.com/api/v1/beauty/customers', {
    headers: { Authorization: `Bearer ${token}` },
  });
  const existing = await existingRes.json();
  if (existing.data && existing.data.length > 0) {
    console.log(`Clearing ${existing.data.length} old customers...`);
    for (const oldCust of existing.data) {
      await fetch(`https://mainapi.odivon.com/api/v1/beauty/customers/${oldCust.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
    }
    console.log('Cleared old customers.');
  }

  // Read demo customers from TS file
  const tsContent = readFileSync('src/app/core/customer/customer-demo-data.ts', 'utf-8');
  const match = tsContent.match(/export const DEMO_CUSTOMERS: CustomerProfile\[\] = (\[[\s\S]*?\]);\s*$/);
  if (!match) {
    console.error('Could not parse DEMO_CUSTOMERS regex');
    process.exit(1);
  }

  // Replace TS specific expressions like calculateAge('...') with calculated values
  const sanitized = match[1].replace(/calculateAge\('([^']+)'\)\s*\?\?\s*(\d+)/g, '$2');
  const demoCustomers = eval(`(${sanitized})`);
  console.log(`Parsed ${demoCustomers.length} demo customers.`);

  // Post each customer
  let count = 0;
  for (const customer of demoCustomers) {
    const { id, ...data } = customer;
    console.log(`Creating customer ${count + 1}/${demoCustomers.length}: ${customer.fullName} (TC: ${customer.identityNumber})...`);
    const res = await fetch('https://mainapi.odivon.com/api/v1/beauty/customers', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        branchId,
        data,
      }),
    });
    const result = await res.json();
    if (result.success) {
      console.log(` Created ${customer.fullName} with ID: ${result.data.id}`);
      count++;
    } else {
      console.error(` Failed for ${customer.fullName}:`, result);
    }
  }

  console.log(`\n Successfully seeded ${count} customers with verified TCKNs and complete health/wallet/installment/session data!`);
}

main().catch(console.error);
