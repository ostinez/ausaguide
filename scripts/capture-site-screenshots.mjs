import { chromium } from '@playwright/test';
import sharp from 'sharp';
import { createServer } from 'vite';
import path from 'path';
import fs from 'fs';

async function captureScreenshots() {
  console.log('1. Starting Vite development server...');
  const server = await createServer({
    configFile: path.resolve(process.cwd(), 'vite.config.ts'),
    server: { port: 5188, host: '127.0.0.1' },
  });
  await server.listen();
  const serverUrl = 'http://127.0.0.1:5188';
  console.log(`Vite server running at ${serverUrl}`);

  console.log('2. Launching headless Chromium with mobile viewport...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1',
  });

  const page = await context.newPage();

  const outputDir = path.resolve(process.cwd(), 'public/images/home');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // ── Step 1: Find a Tour (/tours) ──
  console.log('Capturing Step 1: Find a Tour (/tours)...');
  await page.goto(`${serverUrl}/tours`, { waitUntil: 'networkidle', timeout: 30000 }).catch(() => {});
  await page.waitForTimeout(2000);
  const step1Buffer = await page.screenshot({ type: 'png' });
  await sharp(step1Buffer)
    .resize(780, 1000, { fit: 'cover', position: 'top' })
    .webp({ quality: 90 })
    .toFile(path.join(outputDir, 'book_phone.webp'));
  console.log('✓ Saved book_phone.webp');

  // ── Step 2: Book with Confidence (Tour Detail / Booking) ──
  console.log('Capturing Step 2: Book with Confidence (/tours)...');
  // Navigate to first tour or tour detail
  await page.goto(`${serverUrl}/tours`, { waitUntil: 'networkidle' }).catch(() => {});
  await page.waitForTimeout(1500);
  const tourCard = page.locator('a[href^="/tours/"]').first();
  if (await tourCard.count() > 0) {
    await tourCard.click();
    await page.waitForTimeout(2500);
  } else {
    await page.goto(`${serverUrl}/checkout`, { waitUntil: 'networkidle' }).catch(() => {});
    await page.waitForTimeout(1500);
  }
  const step2Buffer = await page.screenshot({ type: 'png' });
  await sharp(step2Buffer)
    .resize(780, 1000, { fit: 'cover', position: 'top' })
    .webp({ quality: 90 })
    .toFile(path.join(outputDir, 'book_confirm.webp'));
  console.log('✓ Saved book_confirm.webp');

  // ── Step 3: Virtual Tour (/feed or Live experience) ──
  console.log('Capturing Step 3: Virtual Tour (/feed)...');
  await page.goto(`${serverUrl}/feed`, { waitUntil: 'networkidle' }).catch(() => {});
  await page.waitForTimeout(2500);
  const step3Buffer = await page.screenshot({ type: 'png' });
  await sharp(step3Buffer)
    .resize(780, 1000, { fit: 'cover', position: 'top' })
    .webp({ quality: 90 })
    .toFile(path.join(outputDir, 'virtual_tour.webp'));
  console.log('✓ Saved virtual_tour.webp');

  // ── Step 4: Physical Tour (/map) ──
  console.log('Capturing Step 4: Physical Tour (/map)...');
  await page.goto(`${serverUrl}/map`, { waitUntil: 'networkidle' }).catch(() => {});
  await page.waitForTimeout(3000);
  const step4Buffer = await page.screenshot({ type: 'png' });
  await sharp(step4Buffer)
    .resize(780, 1000, { fit: 'cover', position: 'top' })
    .webp({ quality: 90 })
    .toFile(path.join(outputDir, 'physical_tour.webp'));
  console.log('✓ Saved physical_tour.webp');

  await browser.close();
  await server.close();
  console.log('🎉 All 4 screenshots captured from real website and saved successfully!');
}

captureScreenshots().catch((err) => {
  console.error('Error capturing screenshots:', err);
  process.exit(1);
});
