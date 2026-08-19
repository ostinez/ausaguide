const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function buildAllScenarios() {
  const corridorDir = path.join(__dirname, '../public/images/corridor');
  const heroDir = path.join(__dirname, '../public/images/hero');
  const width = 1376;
  const height = 768;

  // Typography SVG Template for AUSAGUIDE (Consistent across all slides)
  function createAusaguideSvg(opacity = 0.92, shadowColor = 'rgba(0,0,0,0.85)') {
    return Buffer.from(`
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <filter id="textShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="8" stdDeviation="12" flood-color="${shadowColor}" flood-opacity="0.85" />
          </filter>
        </defs>
        <text 
          x="50%" 
          y="26%" 
          text-anchor="middle" 
          font-family="system-ui, -apple-system, sans-serif" 
          font-weight="900" 
          font-size="108" 
          letter-spacing="-2px" 
          fill="#ffffff" 
          fill-opacity="${opacity}" 
          filter="url(#textShadow)"
        >AUSAGUIDE</text>
      </svg>
    `);
  }

  // Helper to composite text and depth mask
  // If we overlay text behind foreground, we can composite:
  // Base image -> Text SVG -> Foreground cutout/mask
  async function maskScenario(basePath, outPath, maskType = 'standard', isTrap = false) {
    const textSvg = createAusaguideSvg(isTrap ? 0.70 : 0.92, isTrap ? 'rgba(0,0,0,0.95)' : 'rgba(0,0,0,0.7)');
    
    // We create a gradient depth mask so foreground trees/rocks/vehicles occlude the text naturally
    // For smart: text in upper sky, bottom 60% is preserved foreground
    // For trap: text is also obscured by fog/dust/weather
    const depthMaskSvg = Buffer.from(`
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="depthGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#ffffff" stop-opacity="1.0" />
            <stop offset="28%" stop-color="#ffffff" stop-opacity="0.85" />
            <stop offset="42%" stop-color="#ffffff" stop-opacity="0.20" />
            <stop offset="55%" stop-color="#ffffff" stop-opacity="0.0" />
            <stop offset="100%" stop-color="#ffffff" stop-opacity="0.0" />
          </linearGradient>
        </defs>
        <rect width="100%" height="100%" fill="url(#depthGrad)" />
      </svg>
    `);

    // Composite text onto base image with depth gradient
    const textLayer = await sharp(textSvg)
      .composite([{ input: depthMaskSvg, blend: 'dest-in' }])
      .png()
      .toBuffer();

    let pipeline = sharp(basePath).resize(width, height);

    if (isTrap) {
      // Add subtle realistic weather/dust/trap atmosphere to the trap slide
      const trapAtmosphere = Buffer.from(`
        <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="trapMist" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stop-color="#475569" stop-opacity="0.35" />
              <stop offset="50%" stop-color="#64748b" stop-opacity="0.25" />
              <stop offset="100%" stop-color="#1e293b" stop-opacity="0.10" />
            </linearGradient>
          </defs>
          <rect width="100%" height="100%" fill="url(#trapMist)" />
        </svg>
      `);
      pipeline = pipeline.composite([
        { input: textLayer, blend: 'over' },
        { input: trapAtmosphere, blend: 'over' }
      ]);
    } else {
      pipeline = pipeline.composite([
        { input: textLayer, blend: 'over' }
      ]);
    }

    await pipeline.jpeg({ quality: 95 }).toFile(outPath);
  }

  // 1. Beach & Coast
  await maskScenario(path.join(corridorDir, 'smart_beach.jpg'), path.join(heroDir, 'beach_smart.jpg'), 'beach', false);
  await maskScenario(path.join(corridorDir, 'trap_beach.jpg'), path.join(heroDir, 'beach_trap.jpg'), 'beach', true);

  // 2. Wildlife Safari
  await maskScenario(path.join(corridorDir, 'smart_safari_guide.jpg'), path.join(heroDir, 'safari_smart.jpg'), 'safari', false);
  await maskScenario(path.join(corridorDir, 'trap_safari_breakdown.jpg'), path.join(heroDir, 'safari_trap.jpg'), 'safari', true);

  // 3. Highland Waterfalls
  await maskScenario(path.join(corridorDir, 'smart_waterfall.jpg'), path.join(heroDir, 'waterfall_smart.jpg'), 'waterfall', false);
  await maskScenario(path.join(corridorDir, 'trap_waterfall.jpg'), path.join(heroDir, 'waterfall_trap.jpg'), 'waterfall', true);

  // 4. Pet-Friendly Stay
  await maskScenario(path.join(corridorDir, 'smart_pet_friendly.jpg'), path.join(heroDir, 'pets_smart.jpg'), 'pets', false);
  await maskScenario(path.join(corridorDir, 'trap_no_pets.jpg'), path.join(heroDir, 'pets_trap.jpg'), 'pets', true);

  // 5. Pricing & Flexibility
  await maskScenario(path.join(corridorDir, 'smart_flex_booking.jpg'), path.join(heroDir, 'pricing_smart.jpg'), 'pricing', false);
  await maskScenario(path.join(corridorDir, 'trap_extra_fees.jpg'), path.join(heroDir, 'pricing_trap.jpg'), 'pricing', true);

  console.log('All 5 scenario pairs built successfully with masked AUSAGUIDE typography!');
}

buildAllScenarios().catch(console.error);
