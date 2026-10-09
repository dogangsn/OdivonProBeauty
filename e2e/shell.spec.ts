import { expect, test } from '@playwright/test';

test('opens the role-aware application shell', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/OdivonPro/);
  await expect(page.locator('body')).toContainText(/OdivonPro|Giris/);
});
