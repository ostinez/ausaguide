import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const artifactDir = 'C:/Users/USER/.gemini/antigravity-ide/brain/a08d2a4d-6914-40de-8f89-6999eec0bb06';
const baseImg = path.join(artifactDir, 'og_fluid_wave_concept_b_1787225959642.jpg');
const logoImg = path.resolve('public/logo-mark.png');

async function createFinalFluidWaveCard() {
  console.log('Compositing Concept B with official metallic logo mark...');

  // 1. Prepare official metallic circular logo (60x60)
  const logoBuf = await sharp(logoImg)
    .resize(60, 60, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();

  // 2. SVG overlay for official brand badge in top-left
  const overlaySvg = Buffer.from(`
    <svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="logoGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#34D399" stop-opacity="0.45" />
          <stop offset="100%" stop-color="#0e2423" stop-opacity="0" />
        </radialGradient>
      </defs>

      <!-- Smooth dark teal capsule for logo & brand name -->
      <g transform="translate(68, 48)">
        <rect x="0" y="0" width="220" height="68" rx="34" fill="#0b1e1d" fill-opacity="0.85" stroke="#235E5D" stroke-width="1.5" />
        <circle cx="34" cy="34" r="28" fill="url(#logoGlow)" />
        <text x="74" y="42" font-family="'Space Grotesk', system-ui, sans-serif" font-size="22" font-weight="900" fill="#FFFFFF" letter-spacing="0.5">Ausaguide</text>
      </g>
    </svg>
  `);

  // 3. Composite onto 1200x630 canvas
  await sharp(baseImg)
    .resize(1200, 630, { fit: 'cover' })
    .composite([
      { input: overlaySvg, top: 0, left: 0 },
      { input: logoBuf, top: 52, left: 72 },
    ])
    .png({ quality: 95 })
    .toFile('public/og-image.png');

  // Copy to artifact directory for embedding
  fs.copyFileSync('public/og-image.png', path.join(artifactDir, 'final_fluid_wave_preview.png'));
  console.log('Successfully generated public/og-image.png and final_fluid_wave_preview.png');
}

createFinalFluidWaveCard().catch(console.error);
