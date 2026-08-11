import fs from "fs"
import path from "path"

const targetDir = path.resolve("src/assets/images")

function cleanDirectory(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true })

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)

    if (entry.isDirectory()) {
      cleanDirectory(fullPath)
    } else if (entry.isFile() && entry.name.includes("_temp.webp")) {
      console.log(`Deleting temp file: ${fullPath}`)
      fs.unlinkSync(fullPath)
    }
  }
}

cleanDirectory(targetDir)
console.log("Cleanup complete!")
