// @ts-check
const { test, expect } = require('@playwright/test');
const { AxeBuilder } = require('@axe-core/playwright');

const SITE = 'https://ashwinpr15.github.io';
const PAGES = [
  '/',
  '/work/fleet-sales-reporting/',
  '/work/qlikview-power-bi-migration/',
  '/work/f1-cost-cap/',
  '/work/headset-desk/',
  '/work/quadruped-robot/',
];
const WIDTHS = [320, 390, 768, 1024, 1440];

for (const path of PAGES) {
  test.describe(`page ${path}`, () => {
    test('loads with a heading, metadata and no script errors', async ({ page }) => {
      const errors = [];
      page.on('pageerror', (e) => errors.push(String(e)));
      page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
      const res = await page.goto(path, { waitUntil: 'networkidle' });
      expect(res && res.status()).toBe(200);
      await expect(page.locator('h1')).toHaveCount(1);
      await expect(page.locator('h1')).toBeVisible();
      await expect(page).toHaveTitle(/Ashwin Pillanda Ravindra/);
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', SITE + path);
      await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', /.{50,}/);
      await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute('content', 'summary_large_image');
      expect(errors).toEqual([]);
    });

    test('is readable with JavaScript turned off', async ({ browser }) => {
      const ctx = await browser.newContext({ javaScriptEnabled: false });
      const page = await ctx.newPage();
      await page.goto(path);
      await expect(page.locator('h1')).toBeVisible();
      await expect(page.locator('main')).toBeVisible();
      await expect(page.locator('.site-nav a').first()).toBeVisible();
      await ctx.close();
    });

    test('internal links, images and assets resolve', async ({ page, request }) => {
      await page.goto(path);
      const urls = await page.evaluate(() => {
        const out = new Set();
        const add = (u) => { if (u) out.add(new URL(u, location.href).href.split('#')[0]); };
        document.querySelectorAll('a[href]').forEach((a) => add(a.getAttribute('href')));
        document.querySelectorAll('img[src]').forEach((i) => add(i.getAttribute('src')));
        document.querySelectorAll('img[srcset]').forEach((i) => i.getAttribute('srcset').split(',').forEach((s) => add(s.trim().split(/\s+/)[0])));
        document.querySelectorAll('link[href]').forEach((l) => { if (l.rel !== 'canonical') add(l.getAttribute('href')); });
        document.querySelectorAll('script[src]').forEach((s) => add(s.getAttribute('src')));
        return [...out];
      });
      const internal = urls.filter((u) => u.startsWith('http://localhost:8123'));
      expect(internal.length).toBeGreaterThan(3);
      for (const u of internal) {
        const r = await request.get(u);
        expect(r.status(), u).toBe(200);
      }
    });

    for (const width of WIDTHS) {
      test(`has no sideways scrolling at ${width}px`, async ({ browser }) => {
        const ctx = await browser.newContext({ viewport: { width, height: 800 } });
        const page = await ctx.newPage();
        await page.goto(path, { waitUntil: 'networkidle' });
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
        expect(overflow).toBeLessThanOrEqual(0);
        await ctx.close();
      });
    }

    for (const scheme of /** @type {const} */ (['light', 'dark'])) {
      test(`passes axe accessibility checks in ${scheme} theme`, async ({ browser }) => {
        const ctx = await browser.newContext({ colorScheme: scheme });
        const page = await ctx.newPage();
        await page.goto(path, { waitUntil: 'networkidle' });
        const results = await new AxeBuilder({ page })
          .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'])
          .analyze();
        expect(results.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`)).toEqual([]);
        await ctx.close();
      });
    }
  });
}

test('resume PDF is served', async ({ request }) => {
  const r = await request.get('/assets/Ashwin-Resume.pdf');
  expect(r.status()).toBe(200);
  expect((await r.body()).subarray(0, 4).toString()).toBe('%PDF');
});

test('social card, robots.txt and sitemap exist', async ({ request }) => {
  const card = await request.get('/assets/social-card.png');
  expect(card.status()).toBe(200);
  const robots = await request.get('/robots.txt');
  expect(await robots.text()).toContain('Sitemap: ' + SITE + '/sitemap.xml');
  const sitemap = await (await request.get('/sitemap.xml')).text();
  for (const path of PAGES) expect(sitemap).toContain(`<loc>${SITE}${path}</loc>`);
});

test('404 page links back into the site', async ({ page }) => {
  await page.goto('/404.html');
  await expect(page.locator('h1')).toHaveText("This page doesn't exist");
  await expect(page.locator('main a[href="/"]')).toBeVisible();
});

test('home hero shows role, proof points and resume above the fold on a laptop', async ({ browser }) => {
  const ctx = await browser.newContext({ viewport: { width: 1366, height: 768 } });
  const page = await ctx.newPage();
  await page.goto('/');
  for (const sel of ['.hero-role', '.cta-row a[href$="Ashwin-Resume.pdf"]', '.proof']) {
    await expect(page.locator(sel)).toBeInViewport();
  }
  await ctx.close();
});

test('mobile navigation and resume button are reachable', async ({ browser }) => {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();
  await page.goto('/');
  for (const name of ['Work', 'Experience', 'Education', 'Contact']) {
    await expect(page.locator('.site-nav').getByRole('link', { name, exact: true })).toBeInViewport();
  }
  await expect(page.locator('.header-actions').getByRole('link', { name: 'Resume' })).toBeVisible();
  await page.locator('.site-nav').getByRole('link', { name: 'Contact', exact: true }).click();
  await expect(page.locator('#contactTitle')).toBeInViewport();
  await ctx.close();
});

test('case-study cards link to their own pages', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: 'Read the fleet reporting case study' }).click();
  await expect(page).toHaveURL(/\/work\/fleet-sales-reporting\/$/);
  await expect(page.locator('h1')).toContainText('fleet sales report');
});

test('theme toggle switches and remembers the theme', async ({ browser }) => {
  const ctx = await browser.newContext({ colorScheme: 'light' });
  const page = await ctx.newPage();
  await page.goto('/');
  const toggle = page.locator('#themeToggle');
  await expect(toggle).toBeVisible();
  await toggle.click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await ctx.close();
});

test('email is a real mailto link and keyboard focus is visible', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#contact a[href="mailto:ashwinpr@bu.edu"]')).toBeVisible();
  await page.keyboard.press('Tab');
  await expect(page.locator('.skip-link')).toBeFocused();
  await expect(page.locator('.skip-link')).toBeInViewport();
});
