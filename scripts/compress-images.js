import fs from 'fs'
import path from 'path'
import sharp from 'sharp'

const IMAGES_DIR = path.resolve('public/images')

async function compressDirectory(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true })

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      await compressDirectory(fullPath)
    } else if (entry.isFile() && entry.name.toLowerCase().endsWith('.png')) {
      const parsed = path.parse(fullPath)
      const webpPath = path.join(parsed.dir, `${parsed.name}.webp`)

      console.log(`Compressing: ${fullPath} -> ${webpPath}`)

      try {
        await sharp(fullPath)
          .webp({ quality: 80 })
          .toFile(webpPath)

        // Delete the original PNG to save disk space
        fs.unlinkSync(fullPath)
        console.log(`Deleted original: ${fullPath}`)
      } catch (err) {
        console.error(`Failed to compress ${entry.name}:`, err.message)
      }
    }
  }
}

async function run() {
  console.log(`Starting image compression in ${IMAGES_DIR}...`)
  await compressDirectory(IMAGES_DIR)
  console.log('Image compression completed!')
}

run()
