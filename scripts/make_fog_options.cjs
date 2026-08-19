const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function main() {
  const sunriseMasked = 'C:\\Users\\USER\\.gemini\\antigravity-ide\\brain\\a08d2a4d-6914-40de-8f89-6999eec0bb06\\mount_kenya_sunrise_masked_1787169289023.jpg';
  const naturalFog = 'C:\\Users\\USER\\.gemini\\antigravity-ide\\brain\\a08d2a4d-6914-40de-8f89-6999eec0bb06\\mount_kenya_foggy_4k_1787167986408.jpg';
  
  const artifactDir = 'C:\\Users\\USER\\.gemini\\antigravity-ide\\brain\\a08d2a4d-6914-40de-8f89-6999eec0bb06';
  const publicDir = path.join(__dirname, '../public/images/hero');
  const suggestionsDir = path.join(publicDir, 'suggestions');
  
  if (!fs.existsSync(suggestionsDir)) fs.mkdirSync(suggestionsDir, { recursive: true });

  const width = 1376;
  const height = 768;

  // ── OPTION 1: Authentic 4K Storm Capture (Natural Vibrant Alpine Flora + Dark Mist Storm) ──
  // 100% natural colors - vibrant green lobelias, dark tarn lake, natural storm clouds swallowing the peak
  await sharp(naturalFog)
    .resize(width, height)
    .jpeg({ quality: 95 })
    .toFile(path.join(suggestionsDir, 'option_1_natural_storm.jpg'));
  fs.copyFileSync(path.join(suggestionsDir, 'option_1_natural_storm.jpg'), path.join(artifactDir, 'option_1_natural_storm.jpg'));

  // ── OPTION 2: Dense White Alpine Fog (Lush Natural Colors, Top 60% Swallowed in White Mountain Mist) ──
  const whiteFogSvg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="whiteMist" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#e2e8f0" stop-opacity="0.96" />
          <stop offset="25%" stop-color="#cbd5e1" stop-opacity="0.92" />
          <stop offset="50%" stop-color="#94a3b8" stop-opacity="0.82" />
          <stop offset="70%" stop-color="#64748b" stop-opacity="0.30" />
          <stop offset="100%" stop-color="#334155" stop-opacity="0.0" />
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#whiteMist)" />
    </svg>
  `;
  await sharp(sunriseMasked)
    .modulate({ brightness: 0.9, saturation: 0.85 })
    .composite([
      { input: Buffer.from(whiteFogSvg), blend: 'over' }
    ])
    .jpeg({ quality: 95 })
    .toFile(path.join(suggestionsDir, 'option_2_whiteout_fog.jpg'));
  fs.copyFileSync(path.join(suggestionsDir, 'option_2_whiteout_fog.jpg'), path.join(artifactDir, 'option_2_whiteout_fog.jpg'));

  // ── OPTION 3: Rolling Cloud Inversion & Misty Ridge ──
  const cloudBankSvg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="clouds" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#475569" stop-opacity="0.88" />
          <stop offset="35%" stop-color="#94a3b8" stop-opacity="0.85" />
          <stop offset="55%" stop-color="#cbd5e1" stop-opacity="0.75" />
          <stop offset="75%" stop-color="#475569" stop-opacity="0.25" />
          <stop offset="100%" stop-color="#1e293b" stop-opacity="0.0" />
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#clouds)" />
    </svg>
  `;
  await sharp(naturalFog)
    .resize(width, height)
    .modulate({ brightness: 0.95, saturation: 0.9 })
    .composite([
      { input: Buffer.from(cloudBankSvg), blend: 'over', opacity: 0.65 }
    ])
    .jpeg({ quality: 95 })
    .toFile(path.join(suggestionsDir, 'option_3_rolling_clouds.jpg'));
  fs.copyFileSync(path.join(suggestionsDir, 'option_3_rolling_clouds.jpg'), path.join(artifactDir, 'option_3_rolling_clouds.jpg'));

  // ── OPTION 4: Wet Torrential Rain & Low Ridge Mist ──
  const rainSvg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="rainSky" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#334155" stop-opacity="0.75" />
          <stop offset="45%" stop-color="#64748b" stop-opacity="0.65" />
          <stop offset="80%" stop-color="#1e293b" stop-opacity="0.15" />
          <stop offset="100%" stop-color="#0f172a" stop-opacity="0.0" />
        </linearGradient>
        <pattern id="rainDrops" width="20" height="20" patternUnits="userSpaceOnUse">
          <line x1="2" y1="0" x2="0" y2="20" stroke="#f8fafc" stroke-width="0.8" stroke-opacity="0.30" />
          <line x1="12" y1="0" x2="10" y2="20" stroke="#e2e8f0" stroke-width="0.6" stroke-opacity="0.25" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#rainSky)" />
      <rect width="100%" height="100%" fill="url(#rainDrops)" />
    </svg>
  `;
  await sharp(naturalFog)
    .resize(width, height)
    .composite([
      { input: Buffer.from(rainSvg), blend: 'over' }
    ])
    .jpeg({ quality: 95 })
    .toFile(path.join(suggestionsDir, 'option_4_torrential_rain.jpg'));
  fs.copyFileSync(path.join(suggestionsDir, 'option_4_torrential_rain.jpg'), path.join(artifactDir, 'option_4_torrential_rain.jpg'));

  console.log('All 4 fog suggestions successfully created!');
}

main().catch(console.error);
