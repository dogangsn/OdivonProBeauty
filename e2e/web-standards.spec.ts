import { expect, test } from '@playwright/test';

const publicPages = [
  { path: '/login', title: /Giriş yap \| OdivonPro Beauty/ },
  { path: '/register', title: /14 gün ücretsiz deneyin \| OdivonPro Beauty/ },
  { path: '/portal', title: /Müşteri portalı \| OdivonPro Beauty/ },
  { path: '/terms', title: /Kullanım Şartları \| OdivonPro Beauty/ },
  { path: '/privacy', title: /Gizlilik Politikası/ },
  { path: '/cookies', title: /Çerez Politikası/ },
];

test.describe('web standards', () => {
  for (const file of ['/robots.txt', '/sitemap.xml', '/llms.txt']) {
    test(`serves ${file}`, async ({ request }) => {
      const response = await request.get(file);
      expect(response.status()).toBe(200);
      const body = await response.text();
      expect(body).not.toContain('<app-root>');
      expect(body.length).toBeGreaterThan(50);
    });
  }

  for (const page of publicPages) {
    test(`${page.path} has title, description and is indexable`, async ({ page: p }) => {
      await p.goto(page.path);
      await expect(p).toHaveTitle(page.title);
      await expect(p.locator('meta[name="description"]')).toHaveAttribute('content', /.{50,}/);
      await expect(p.locator('meta[name="robots"]')).toHaveAttribute('content', 'index, follow');
      await expect(p.locator('link[rel="canonical"]')).toHaveAttribute(
        'href',
        new RegExp(`${page.path}$`),
      );
    });
  }

  test('unknown URLs show the 404 page and are not indexed', async ({ page }) => {
    await page.goto('/bu-sayfa-yok');
    await expect(page.getByRole('heading', { name: 'Aradığınız sayfa bulunamadı' })).toBeVisible();
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
      'content',
      'noindex, nofollow',
    );
  });

  test('cookie banner asks once and remembers the choice', async ({ page }) => {
    await page.goto('/login');
    const banner = page.getByRole('dialog', { name: 'Çerez tercihleriniz' });
    await expect(banner).toBeVisible();
    await banner.getByRole('button', { name: 'Reddet' }).click();
    await expect(banner).toBeHidden();
    await page.reload();
    await expect(page.locator('h2#login-title')).toBeVisible();
    await expect(banner).toBeHidden();
  });

  test('login shows a clear sign-up CTA and legal links', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('link', { name: /14 gün ücretsiz deneyin/ })).toBeVisible();
    const legal = page.locator('p.legal');
    await expect(legal.getByRole('link', { name: 'Kullanım Şartları' })).toHaveAttribute(
      'href',
      '/terms',
    );
    await expect(legal.getByRole('link', { name: 'Gizlilik Politikası' })).toHaveAttribute(
      'href',
      '/privacy',
    );
  });

  for (const path of ['/login', '/register', '/portal', '/terms', '/privacy', '/cookies', '/yok']) {
    test(`${path} fits a 375px phone screen`, async ({ browser }) => {
      const context = await browser.newContext({
        viewport: { width: 375, height: 740 },
        isMobile: true,
        hasTouch: true,
      });
      const page = await context.newPage();
      await page.goto(path);
      await page.waitForLoadState('networkidle');
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow).toBeLessThanOrEqual(0);
      await context.close();
    });
  }
});
