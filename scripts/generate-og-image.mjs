import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

async function createOgImage() {
  const width = 1200;
  const height = 630;
  const logoPath = path.resolve('public/logo-mark.png');

  console.log('Generating 1200x630 OG image with logo from:', logoPath);

  // 1. Read and resize user's circular metallic logo mark
  const logoSize = 300;
  const logoBuffer = await sharp(logoPath)
    .resize(logoSize, logoSize, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();

  // 2. SVG Background & Typography Overlay
  const svgOverlay = Buffer.from(`
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="glow1" cx="20%" cy="30%" r="65%">
          <stop offset="0%" stop-color="#317978" stop-opacity="0.5" />
          <stop offset="100%" stop-color="#0a1a19" stop-opacity="0" />
        </radialGradient>
        <radialGradient id="glow2" cx="82%" cy="65%" r="60%">
          <stop offset="0%" stop-color="#10b981" stop-opacity="0.25" />
          <stop offset="100%" stop-color="#081413" stop-opacity="0" />
        </radialGradient>
        <radialGradient id="logoGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#34D399" stop-opacity="0.3" />
          <stop offset="60%" stop-color="#317978" stop-opacity="0.15" />
          <stop offset="100%" stop-color="#0b1b1a" stop-opacity="0" />
        </radialGradient>
        <linearGradient id="titleGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#FFFFFF" />
          <stop offset="55%" stop-color="#B7E6E5" />
          <stop offset="100%" stop-color="#34D399" />
        </linearGradient>
        <linearGradient id="borderGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#317978" stop-opacity="0.8" />
          <stop offset="50%" stop-color="#235E5D" stop-opacity="0.3" />
          <stop offset="100%" stop-color="#10B981" stop-opacity="0.6" />
        </linearGradient>
      </defs>

      <!-- Background Base -->
      <rect width="100%" height="100%" fill="#081514" />

      <!-- Glowing Ambient Lights -->
      <rect width="100%" height="100%" fill="url(#glow1)" />
      <rect width="100%" height="100%" fill="url(#glow2)" />

      <!-- Outer Frame Box -->
      <rect x="28" y="28" width="1144" height="574" rx="32" fill="none" stroke="url(#borderGrad)" stroke-width="2" />

      <!-- Logo Backlight Glow Circle -->
      <circle cx="970" cy="315" r="210" fill="url(#logoGlow)" />

      <!-- Brand Tag Pill -->
      <g transform="translate(72, 70)">
        <rect x="0" y="0" width="180" height="38" rx="19" fill="#113B3A" stroke="#317978" stroke-width="1.5" />
        <circle cx="20" cy="19" r="5" fill="#34D399" />
        <text x="36" y="24" font-family="'Space Grotesk', system-ui, sans-serif" font-size="14" font-weight="900" fill="#B7E6E5" letter-spacing="2">AUSAGUIDE</text>
      </g>

      <!-- Main Headline in Hero Font -->
      <text x="72" y="185" font-family="'Space Grotesk', system-ui, sans-serif" font-size="52" font-weight="900" fill="url(#titleGrad)" letter-spacing="-1.5">
        Preview Kenya Live
      </text>
      <text x="72" y="248" font-family="'Space Grotesk', system-ui, sans-serif" font-size="52" font-weight="900" fill="#FFFFFF" letter-spacing="-1.5">
        With Real Locals.
      </text>

      <!-- Subtitle Description -->
      <text x="72" y="322" font-family="'Inter', system-ui, sans-serif" font-size="21" font-weight="500" fill="#83B9B7">
        Stop wasting money on tourist traps. Connect live with vetted
      </text>
      <text x="72" y="356" font-family="'Inter', system-ui, sans-serif" font-size="21" font-weight="500" fill="#83B9B7">
        Kenyan hosts for unfiltered virtual video tours and safari scouting.
      </text>

      <!-- Feature Pill Badges -->
      <g transform="translate(72, 450)">
        <!-- Badge 1 -->
        <rect x="0" y="0" width="205" height="42" rx="21" fill="#113B3A" stroke="#235E5D" stroke-width="1.5" />
        <text x="22" y="26" font-family="'Inter', system-ui, sans-serif" font-size="13.5" font-weight="700" fill="#34D399">✓ 100% Live Verified</text>

        <!-- Badge 2 -->
        <rect x="220" y="0" width="215" height="42" rx="21" fill="#113B3A" stroke="#235E5D" stroke-width="1.5" />
        <text x="242" y="26" font-family="'Inter', system-ui, sans-serif" font-size="13.5" font-weight="700" fill="#B7E6E5">✓ Vetted Local Guides</text>

        <!-- Badge 3 -->
        <rect x="450" y="0" width="210" height="42" rx="21" fill="#113B3A" stroke="#235E5D" stroke-width="1.5" />
        <text x="472" y="26" font-family="'Inter', system-ui, sans-serif" font-size="13.5" font-weight="700" fill="#B7E6E5">✓ Zero Tourist Traps</text>
      </g>

      <!-- Bottom Domain Watermark -->
      <text x="72" y="540" font-family="'Space Grotesk', system-ui, sans-serif" font-size="16" font-weight="700" fill="#599D9C" letter-spacing="1">https://ausaguide.com</text>
    </svg>
  `);

  // 3. Composite SVG + User's Logo Mark
  const logoTop = Math.round((height - logoSize) / 2);
  const logoLeft = 820;

  await sharp(svgOverlay)
    .composite([
      {
        input: logoBuffer,
        top: logoTop,
        left: logoLeft,
      },
    ])
    .png({ quality: 95 })
    .toFile('public/og-image.png');

  console.log('Successfully generated public/og-image.png (1200x630)');
}

createOgImage().catch(console.error);
