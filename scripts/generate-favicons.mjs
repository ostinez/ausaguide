import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const SOURCE_IMAGE = path.resolve('public/logo-mark.png');
const PUBLIC_DIR = path.resolve('public');

async function generateFavicons() {
  console.log('Generating favicons from', SOURCE_IMAGE);

  if (!fs.existsSync(SOURCE_IMAGE)) {
    throw new Error(`Source image not found: ${SOURCE_IMAGE}`);
  }

  // 1. Generate PNG sizes
  const sizes = [
    { name: 'favicon-16x16.png', size: 16 },
    { name: 'favicon-32x32.png', size: 32 },
    { name: 'favicon-48x48.png', size: 48 }, // Google Search recommended
    { name: 'favicon-96x96.png', size: 96 },
    { name: 'apple-touch-icon.png', size: 180 },
    { name: 'web-app-manifest-192x192.png', size: 192 },
    { name: 'web-app-manifest-512x512.png', size: 512 },
  ];

  const pngBuffers = {};

  for (const item of sizes) {
    const outputPath = path.join(PUBLIC_DIR, item.name);
    const buf = await sharp(SOURCE_IMAGE)
      .resize(item.size, item.size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toBuffer();

    fs.writeFileSync(outputPath, buf);
    pngBuffers[item.size] = buf;
    console.log(`Created ${item.name} (${item.size}x${item.size}) - ${buf.length} bytes`);
  }

  // 2. Generate multi-resolution favicon.ico (16x16, 32x32, 48x48)
  const icoSizes = [16, 32, 48];
  const count = icoSizes.length;
  
  // ICO header: 6 bytes
  // Directory entries: count * 16 bytes
  const headerSize = 6 + count * 16;
  let currentOffset = headerSize;

  const entries = [];
  for (const size of icoSizes) {
    const imgBuf = pngBuffers[size];
    entries.push({
      width: size === 256 ? 0 : size,
      height: size === 256 ? 0 : size,
      colorCount: 0,
      reserved: 0,
      planes: 1,
      bitCount: 32,
      bytesInRes: imgBuf.length,
      imageOffset: currentOffset,
      data: imgBuf,
    });
    currentOffset += imgBuf.length;
  }

  const icoBuffer = Buffer.alloc(currentOffset);
  // Header
  icoBuffer.writeUInt16LE(0, 0); // Reserved
  icoBuffer.writeUInt16LE(1, 2); // Type 1 = ICO
  icoBuffer.writeUInt16LE(count, 4); // Number of images

  // Directory entries
  let entryPos = 6;
  for (const entry of entries) {
    icoBuffer.writeUInt8(entry.width, entryPos);
    icoBuffer.writeUInt8(entry.height, entryPos + 1);
    icoBuffer.writeUInt8(entry.colorCount, entryPos + 2);
    icoBuffer.writeUInt8(entry.reserved, entryPos + 3);
    icoBuffer.writeUInt16LE(entry.planes, entryPos + 4);
    icoBuffer.writeUInt16LE(entry.bitCount, entryPos + 6);
    icoBuffer.writeUInt32LE(entry.bytesInRes, entryPos + 8);
    icoBuffer.writeUInt32LE(entry.imageOffset, entryPos + 12);
    entryPos += 16;
  }

  // Write image data
  for (const entry of entries) {
    entry.data.copy(icoBuffer, entry.imageOffset);
  }

  const icoPath = path.join(PUBLIC_DIR, 'favicon.ico');
  fs.writeFileSync(icoPath, icoBuffer);
  console.log(`Created favicon.ico (${icoBuffer.length} bytes) with sizes 16x16, 32x32, 48x48`);

  // 3. Create site.webmanifest
  const manifest = {
    name: "Ausaguide",
    short_name: "Ausaguide",
    description: "Live tours and experiences with real locals in Kenya",
    start_url: "/",
    display: "standalone",
    background_color: "#113B3A",
    theme_color: "#113B3A",
    icons: [
      {
        src: "/web-app-manifest-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any"
      },
      {
        src: "/web-app-manifest-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable"
      },
      {
        src: "/web-app-manifest-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any"
      },
      {
        src: "/web-app-manifest-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable"
      }
    ]
  };

  const manifestPath = path.join(PUBLIC_DIR, 'site.webmanifest');
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  console.log('Created site.webmanifest');

  console.log('Favicon generation completed successfully!');
}

generateFavicons().catch((err) => {
  console.error('Error generating favicons:', err);
  process.exit(1);
});
