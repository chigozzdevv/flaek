import 'dotenv/config'
import * as fs from 'fs'
import * as path from 'path'
import { objectStore } from '@/storage/object-store'

async function main() {
  const root = process.cwd()
  const buildDir = path.join(root, 'flaek_mxe', 'build')
  if (!fs.existsSync(buildDir)) {
    console.error(`Build directory not found: ${buildDir}`)
    process.exit(1)
  }

  const files = fs.readdirSync(buildDir)
    .filter(f => f.endsWith('_testnet.arcis'))
    .map(f => path.join(buildDir, f))

  if (files.length === 0) {
    console.error('No *_testnet.arcis files found in build directory')
    process.exit(1)
  }

  const folder = 'arcium/circuits/testnet'
  const results: Record<string, { url: string, public_id: string }> = {}

  for (const file of files) {
    const base = path.basename(file)
    const circuit = base.replace('_testnet.arcis', '')
    const publicId = `${circuit}_testnet.arcis`
    const buf = fs.readFileSync(file)
    process.stdout.write(`Uploading ${base} -> ${folder}/${publicId} ... `)
    try {
      const res = await objectStore.upload(buf, folder, publicId)
      const url = (res.secure_url || res.url) as string
      results[circuit] = { url, public_id: res.public_id }
      console.log('done')
    } catch (e: any) {
      console.log('failed')
      console.error(e?.message || e)
      process.exit(1)
    }
  }

  const outPath = path.join(buildDir, 'circuits_urls.json')
  fs.writeFileSync(outPath, JSON.stringify(results, null, 2))
  console.log(`\nUploaded ${Object.keys(results).length} circuits.`)
  console.log(`Mapping saved to: ${outPath}`)
  console.log('Sample:')
  console.log(JSON.stringify(Object.entries(results).slice(0,3), null, 2))
}

main().catch((e) => { console.error(e); process.exit(1) })
