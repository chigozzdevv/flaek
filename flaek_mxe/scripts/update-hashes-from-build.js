const fs = require('fs')
const path = require('path')
const crypto = require('crypto')

function sha256Bytes(file) {
  const buf = fs.readFileSync(file)
  return Array.from(crypto.createHash('sha256').update(buf).digest())
}

function findAndReplaceHash(src, circuit, bytes) {
  const fnTag = `pub fn init_${circuit}_comp_def(`
  const start = src.indexOf(fnTag)
  if (start === -1) return src
  const offTag = 'Some(CircuitSource::OffChain(OffChainCircuitSource {'
  const offStart = src.indexOf(offTag, start)
  if (offStart === -1) return src
  const hashKey = 'hash: ['
  const hStart = src.indexOf(hashKey, offStart)
  if (hStart === -1) return src
  const valStart = hStart + hashKey.length
  const valEnd = src.indexOf(']', valStart)
  if (valEnd === -1) return src
  const newArr = bytes.join(', ')
  return src.slice(0, valStart) + newArr + src.slice(valEnd)
}

function main() {
  const root = path.join(__dirname, '..')
  const buildDir = path.join(root, 'build')
  const libPath = path.join(root, 'programs', 'flaek_mxe', 'src', 'lib.rs')
  if (!fs.existsSync(libPath)) throw new Error('lib.rs not found')
  let src = fs.readFileSync(libPath, 'utf8')
  const files = fs.readdirSync(buildDir).filter(f => f.endsWith('.arcis') && !f.endsWith('_testnet.arcis'))
  const circuits = files.map(f => path.basename(f, '.arcis'))
  let updated = 0
  for (const c of circuits) {
    const f = path.join(buildDir, `${c}.arcis`)
    const bytes = sha256Bytes(f)
    const before = src
    src = findAndReplaceHash(src, c, bytes)
    if (src !== before) updated++
  }
  fs.writeFileSync(libPath, src)
  console.log(`Updated ${updated} hash arrays in lib.rs from build/*.arcis`)
}

main()
