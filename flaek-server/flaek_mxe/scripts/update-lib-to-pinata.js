const fs = require('fs')
const path = require('path')

function main() {
  const root = path.join(__dirname, '..')
  const buildDir = path.join(root, 'build')
  const mapPath = path.join(buildDir, 'circuits_urls_pinata_devnet.json')
  if (!fs.existsSync(mapPath)) {
    console.error('Mapping file not found:', mapPath)
    process.exit(1)
  }
  const parsed = JSON.parse(fs.readFileSync(mapPath, 'utf8'))
  const { mapping } = parsed
  const dirCid = parsed.dirCid
  const libPath = path.join(root, 'programs', 'flaek_mxe', 'src', 'lib.rs')
  if (!fs.existsSync(libPath)) {
    console.error('lib.rs not found:', libPath)
    process.exit(1)
  }
  let src = fs.readFileSync(libPath, 'utf8')
  let updated = 0
  for (const [circuit, entry] of Object.entries(mapping)) {
    const baseName = entry.path ? entry.path.split('/').pop() : `${circuit}_devnet.arcis`
    const url = `https://ipfs.io/ipfs/${dirCid}/${baseName}`
    const re = new RegExp(`(pub\\s+fn\\s+init_${circuit}_comp_def\\([\\s\\S]*?source:\\s*)\"[^\"]*\"`)
    const before = src
    src = src.replace(re, `$1"${url}"`)
    if (src !== before) updated++
  }
  fs.writeFileSync(libPath, src)
  console.log(`Updated sources for ${updated} circuits to Pinata devnet URLs`)
}

main()
