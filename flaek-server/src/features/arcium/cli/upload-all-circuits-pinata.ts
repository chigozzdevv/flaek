import 'dotenv/config'
import * as fs from 'fs'
import * as path from 'path'
import axios from 'axios'
import FormData from 'form-data'

async function main() {
  const jwt = process.env.PINATA_JWT
  const gateway = process.env.PINATA_GATEWAY
  if (!jwt || !gateway) {
    console.error('Missing PINATA_JWT or PINATA_GATEWAY in .env')
    process.exit(1)
  }

  const buildDir = path.resolve(process.cwd(), '..', 'flaek_mxe', 'build')
  if (!fs.existsSync(buildDir)) {
    console.error(`Build directory not found: ${buildDir}`)
    process.exit(1)
  }

  const all = fs.readdirSync(buildDir)
  const devnetFiles = all.filter(f => f.endsWith('_devnet.arcis')).map(f => path.join(buildDir, f))
  const baseFiles = all
    .filter(f => f.endsWith('.arcis') && !f.endsWith('_testnet.arcis') && !f.endsWith('_devnet.arcis'))
    .map(f => path.join(buildDir, f))
  const files = devnetFiles.length > 0 ? devnetFiles : baseFiles

  if (files.length === 0) {
    console.error('No *_devnet.arcis or base .arcis files found in build directory')
    process.exit(1)
  }

  const form = new FormData()
  const dirPrefix = 'devnet'
  for (const abs of files) {
    const base = path.basename(abs)
    const circuit = base.endsWith('_devnet.arcis')
      ? base.replace('_devnet.arcis', '')
      : base.replace('.arcis', '')
    const uploadName = `${circuit}_devnet.arcis`
    const rel = dirPrefix ? `${dirPrefix}/${uploadName}` : uploadName
    form.append('file', fs.createReadStream(abs), { filepath: rel })
  }

  // Optional metadata
  form.append('pinataMetadata', JSON.stringify({ name: `flaek_circuits_devnet_${Date.now()}` }))
  form.append('pinataOptions', JSON.stringify({ cidVersion: 1 }))

  process.stdout.write(`Uploading ${files.length} circuits to Pinata as a directory... `)
  const res = await axios.post('https://api.pinata.cloud/pinning/pinFileToIPFS', form, {
    headers: {
      Authorization: `Bearer ${jwt}`,
      ...form.getHeaders(),
    },
    maxContentLength: Infinity as any,
    maxBodyLength: Infinity as any,
    timeout: 600000,
  })
  console.log('done')

  const dirCid = res.data?.IpfsHash
  if (!dirCid) {
    console.error('Pinata response missing IpfsHash')
    console.error(res.data)
    process.exit(1)
  }

  const mapping: Record<string, { url: string; path: string; cid: string }> = {}
  for (const abs of files) {
    const base = path.basename(abs)
    const circuit = base.endsWith('_devnet.arcis')
      ? base.replace('_devnet.arcis', '')
      : base.replace('.arcis', '')
    const uploadName = `${circuit}_devnet.arcis`
    const rel = dirPrefix ? `${dirPrefix}/${uploadName}` : uploadName
    const url = `https://${gateway}/ipfs/${dirCid}/${rel}`
    mapping[circuit] = { url, path: rel, cid: dirCid }
  }

  const out = path.join(buildDir, 'circuits_urls_pinata_devnet.json')
  fs.writeFileSync(out, JSON.stringify({ dirCid, mapping }, null, 2))
  console.log(`Pinned directory CID: ${dirCid}`)
  console.log(`Mapping saved to: ${out}`)
  console.log('Sample:', Object.entries(mapping).slice(0, 3))
}

main().catch((e) => { console.error(e?.response?.data || e?.message || e); process.exit(1) })
