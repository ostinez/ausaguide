const fs = require('fs')
const path = require('path')

const migrationsDir = path.resolve(__dirname, 'supabase', 'migrations')

const file1_old = path.join(migrationsDir, '20260713.sql')
const file1_new = path.join(migrationsDir, '20260713_init.sql')

const file2_old = path.join(migrationsDir, '20260716.sql')
const file2_new = path.join(migrationsDir, '20260716_init.sql')

try {
  if (fs.existsSync(file1_old)) {
    fs.renameSync(file1_old, file1_new)
    console.log('Renamed 20260713 to 20260713_init successfully.')
  } else {
    console.log('20260713 file not found.')
  }

  if (fs.existsSync(file2_old)) {
    fs.renameSync(file2_old, file2_new)
    console.log('Renamed 20260716 to 20260716_init successfully.')
  } else {
    console.log('20260716 file not found.')
  }
} catch (err) {
  console.error('Rename failed:', err)
}
