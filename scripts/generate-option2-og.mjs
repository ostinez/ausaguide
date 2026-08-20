import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const artifactDir = 'C:/Users/USER/.gemini/antigravity-ide/brain/a08d2a4d-6914-40de-8f89-6999eec0bb06';
const baseImg = path.join(artifactDir, 'og_card_mountain_concept_1787225297307.jpg');
const logoImg = path.resolve('public/logo-mark.png');

async function createFinalOption2Card() {
  console.log('Compositing Option 2 with official brand details...');

  // 1. Prepare official metallic logo mark (56x56)
  const logoBuf = await sharp(logoImg)
    .resize(56, 56, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();

  // 2. SVG overlay for official brand header & footer details
  const overlaySvg = Buffer.from(`
    <svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="logoGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#34D399" stop-opacity="0.35" />
          <stop offset="100%" stop-color="#0e2423" stop-opacity="0" />
        </radialGradient>
        <linearGradient id="urlGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#B7E6E5" />
          <stop offset="100%" stop-color="#599D9C" />
        </linearGradient>
      </defs>

      <!-- Smooth dark teal patch for clean top header -->
      <rect x="75" y="48" width="360" height="74" rx="16" fill="#0d2322" fill-opacity="0.95" />

      <!-- Backlight glow behind logo -->
      <circle cx="118" cy="85" r="32" fill="url(#logoGlow)" />

      <!-- Official Brand Name in Space Grotesk -->
      <text x="160" y="93" font-family="'Space Grotesk', system-ui, sans-serif" font-size="28" font-weight="900" fill="#FFFFFF" letter-spacing="0.5">Ausaguide</text>

      <!-- Verified Badge Pill in Header -->
      <g transform="translate(315, 73)">
        <rect x="0" y="0" width="105" height="26" rx="13" fill="#184948" stroke="#317978" stroke-width="1.2" />
        <circle cx="12" cy="13" r="3.5" fill="#10B981" />
        <text x="22" y="17.5" font-family="'Inter', system-ui, sans-serif" font-size="11" font-weight="800" fill="#B7E6E5" letter-spacing="0.8">VERIFIED</text>
      </g>

      <!-- Smooth dark patch for bottom footer with clean website URL & tagline -->
      <rect x="75" y="525" width="380" height="65" rx="16" fill="#091a19" fill-opacity="0.95" />
      <circle cx="108" cy="557" r="14" fill="#113B3A" stroke="#235E5D" stroke-width="1.2" />
      <path d="M104 557 L107 560 L113 554" fill="none" stroke="#34D399" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
      <text x="132" y="563" font-family="'Space Grotesk', system-ui, sans-serif" font-size="17" font-weight="800" fill="url(#urlGrad)" letter-spacing="0.5">https://ausaguide.com</text>
    </svg>
  `);

  // 3. Composite everything onto the 1200x630 background
  await sharp(baseImg)
    .resize(1200, 630, { fit: 'cover' })
    .composite([
      { input: overlaySvg, top: 0, left: 0 },
      { input: logoBuf, top: 57, left: 90 },
    ])
    .png({ quality: 95 })
    .toFile('public/og-image.png');

  // Copy to artifact directory for presentation
  fs.copyFileSync('public/og-image.png', path.join(artifactDir, 'final_og_card_preview.png'));
  console.log('Successfully generated public/og-image.png and final_og_card_preview.png');
}

createFinalOption2Card().catch(console.error);
