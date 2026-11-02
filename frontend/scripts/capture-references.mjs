import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';

// Read-only capture of the owner's published references. No challenge solving or login attempts.
const browser = await chromium.launch({ channel: 'msedge', headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' });
const report = [];
for (const site of ['freight', 'admin']) {
  const url = `https://zippy-${site}-studio.gopi18.chatgpt.site/`;
  const page = await context.newPage();
  const pending = [];
  const dir = `references/${site}`;
  await mkdir(dir, { recursive: true });
  await mkdir('docs/screenshots', { recursive: true });
  page.on('response', response => {
    const asset = new URL(response.url());
    const file = asset.pathname.slice(1);
    if (asset.origin === new URL(url).origin && ['app.js', 'styles.css'].includes(file) && response.status() === 200) {
      pending.push(response.body().then(body => writeFile(`${dir}/${file}`, body)));
    }
  });
  try {
    const response = await page.goto(url, { waitUntil: 'networkidle', timeout: 20000 });
    if (response?.status() !== 200 || !await page.locator('main h1').count()) {
      report.push({ site, url, status: response?.status(), result: 'Preview not rendered; browser capture unavailable.' });
      continue;
    }
    await writeFile(`${dir}/index.html`, await response.body());
    for (const role of site === 'freight' ? ['customer', 'driver'] : ['admin']) {
      if (site === 'freight') await page.locator('#role').selectOption(role === 'customer' ? 'Customer' : 'Driver');
      for (const [name, width, height] of [['desktop', 1440, 1000], ['mobile', 390, 844]]) {
        await page.setViewportSize({ width, height });
        await page.screenshot({ path: `docs/screenshots/before-${role}-${name}.png`, fullPage: true });
      }
    }
    report.push({ site, url, status: response.status(), result: 'Original HTML, loaded assets and screenshots captured.' });
  } catch (error) {
    report.push({ site, url, result: 'Capture unavailable', reason: String(error) });
  } finally {
    await Promise.allSettled(pending);
    await page.close();
  }
}
await writeFile('references/capture-report.json', JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report, null, 2));
await browser.close();
