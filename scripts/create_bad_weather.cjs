const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function createBadWeatherLayers() {
  const sunrisePath = 'C:\\Users\\USER\\.gemini\\antigravity-ide\\brain\\a08d2a4d-6914-40de-8f89-6999eec0bb06\\mount_kenya_sunrise_masked_1787169289023.jpg';
  const foggyPath = 'C:\\Users\\USER\\.gemini\\antigravity-ide\\brain\\a08d2a4d-6914-40de-8f89-6999eec0bb06\\mount_kenya_foggy_4k_1787167986408.jpg';

  const width = 1376;
  const height = 768;

  // 1. Copy sunrise masked as the master good slide
  fs.copyFileSync(sunrisePath, path.join(__dirname, '../public/images/hero/option_c_sunrise.jpg'));

  // 2. Generate bad weather composite:
  // Modulate the exact sunrise masked image: desaturate to cold storm tones, drop exposure
  const coldBase = await sharp(sunrisePath)
    .modulate({
      brightness: 0.68,
      saturation: 0.18, // desaturate to bleak cold storm tones
    })
    .tint({ r: 100, g: 120, b: 135 }) // icy cold slate blue tint
    .toBuffer();

  // Create realistic fog and cloud mist overlay in SVG
  const fogMistSvg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="cloudMist" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#334155" stop-opacity="0.92" />
          <stop offset="20%" stop-color="#475569" stop-opacity="0.88" />
          <stop offset="40%" stop-color="#64748b" stop-opacity="0.85" />
          <stop offset="60%" stop-color="#334155" stop-opacity="0.70" />
          <stop offset="100%" stop-color="#0f172a" stop-opacity="0.55" />
        </linearGradient>
        <pattern id="rain" width="30" height="30" patternUnits="userSpaceOnUse">
          <line x1="5" y1="0" x2="0" y2="30" stroke="#cbd5e1" stroke-width="1.0" stroke-opacity="0.30" />
          <line x1="18" y1="0" x2="14" y2="30" stroke="#e2e8f0" stroke-width="0.7" stroke-opacity="0.25" />
          <line x1="28" y1="0" x2="24" y2="30" stroke="#94a3b8" stroke-width="0.9" stroke-opacity="0.28" />
        </pattern>
      </defs>
      <!-- Thick fog cloud bank covering mountain and text -->
      <rect width="100%" height="100%" fill="url(#cloudMist)" />
      <!-- Torrential rain streaks -->
      <rect width="100%" height="100%" fill="url(#rain)" />
    </svg>
  `;

  // Foggy 4K background blend
  const foggyLayer = await sharp(foggyPath)
    .resize(width, height)
    .modulate({ brightness: 0.75, saturation: 0.15 })
    .toBuffer();

  // Final composite: cold tinted base + foggy mountain blend + thick cloud mist & rain
  await sharp(coldBase)
    .composite([
      { input: foggyLayer, blend: 'screen', opacity: 0.60 },
      { input: Buffer.from(fogMistSvg), blend: 'over', opacity: 0.70 }
    ])
    .jpeg({ quality: 95 })
    .toFile(path.join(__dirname, '../public/images/hero/option_c_foggy.jpg'));

  console.log('Successfully created cold bad weather image with restricted view');
}

createBadWeatherLayers().catch(console.error);
