const fs = require('fs')
const path = require('path')
const crypto = require('crypto')

function sha256Bytes(file) {
  const buf = fs.readFileSync(file)
  return Array.from(crypto.createHash('sha256').update(buf).digest())
}

function main() {
  const root = path.join(__dirname, '..')
  const buildDir = path.join(root, 'build')
  const libPath = path.join(root, 'programs', 'flaek_mxe', 'src', 'lib.rs')
  let src = fs.readFileSync(libPath, 'utf8')

  const re = /source:\s*"https:\/\/ipfs\.io\/ipfs\/[^\/]+\/([^"\/]+)"[\s\S]*?hash:\s*\[[^\]]*\]/g
  let updated = 0
  src = src.replace(re, (match, basename) => {
    const circuit = basename.replace(/_devnet\.arcis$/, '').replace(/\.arcis$/, '')
    const f = path.join(buildDir, `${circuit}.arcis`)
    if (!fs.existsSync(f)) return match
    const bytes = sha256Bytes(f).join(', ')
    const replaced = match.replace(/hash:\s*\[[^\]]*\]/, `hash: [${bytes}]`)
    if (replaced !== match) updated++
    return replaced
  })

  fs.writeFileSync(libPath, src)
  console.log(`Updated ${updated} hash arrays based on ipfs basenames`)
}

main()
