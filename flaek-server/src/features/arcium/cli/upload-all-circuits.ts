import 'dotenv/config'
import * as fs from 'fs'
import * as path from 'path'
import { objectStore } from '@/storage/object-store'

async function main() {
  const buildDir = path.resolve(process.cwd(), '..', 'flaek_mxe', 'build')
  if (!fs.existsSync(buildDir)) {
    console.error(`Build directory not found: ${buildDir}`)
    process.exit(1)
  }

  const net = (process.env.CIRCUITS_NET || process.argv.slice(2)[0] || 'devnet').toLowerCase()
  const all = fs.readdirSync(buildDir)
  const suffix = `_${net}.arcis`
  const netFiles = all.filter(f => f.endsWith(suffix)).map(f => path.join(buildDir, f))
  const baseFiles = all
    .filter(f => f.endsWith('.arcis') && !f.endsWith('_testnet.arcis') && !f.endsWith('_devnet.arcis'))
    .map(f => path.join(buildDir, f))
  const files = netFiles.length > 0 ? netFiles : baseFiles

  if (files.length === 0) {
    console.error(`No *${suffix} or base .arcis files found in build directory`)
    process.exit(1)
  }

  const folder = `arcium/circuits/${net}`
  const results: Record<string, { url: string, public_id: string }> = {}

  for (const file of files) {
    const base = path.basename(file)
    const circuit = base.endsWith(suffix) ? base.replace(suffix, '') : base.replace('.arcis', '')
    const publicId = `${circuit}${suffix}`
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

  const outPath = path.join(buildDir, `circuits_urls_${net}.json`)
  fs.writeFileSync(outPath, JSON.stringify(results, null, 2))
  console.log(`\nUploaded ${Object.keys(results).length} circuits for ${net}.`)
  console.log(`Mapping saved to: ${outPath}`)
  console.log('Sample:')
  console.log(JSON.stringify(Object.entries(results).slice(0,3), null, 2))
}

main().catch((e) => { console.error(e); process.exit(1) })
