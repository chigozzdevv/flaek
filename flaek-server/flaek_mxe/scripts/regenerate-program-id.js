const fs = require('fs')
const path = require('path')
const { Keypair } = require('@solana/web3.js')

function writeKeypairJson(p, kp) {
  const arr = Array.from(kp.secretKey)
  fs.mkdirSync(path.dirname(p), { recursive: true })
  fs.writeFileSync(p, JSON.stringify(arr))
}

function replaceInFile(file, from, to) {
  const buf = fs.readFileSync(file, 'utf8')
  const out = buf.split(from).join(to)
  if (out !== buf) fs.writeFileSync(file, out)
}

function getCurrentProgramId(libPath) {
  const s = fs.readFileSync(libPath, 'utf8')
  const m = s.match(/declare_id!\("([A-Za-z0-9]+)"\);/) || s.match(/declare_id!\('([A-Za-z0-9]+)'\);/)
  if (!m) throw new Error('declare_id! not found')
  return m[1]
}

async function main() {
  const root = path.join(__dirname, '..')
  const libPath = path.join(root, 'programs', 'flaek_mxe', 'src', 'lib.rs')
  const anchorToml = path.join(root, 'Anchor.toml')
  const clientJobs = path.join(__dirname, '..', '..', '..', 'flaek-client', 'src', 'pages', 'dashboard', 'jobs.tsx')
  const clientBuilder = path.join(__dirname, '..', '..', '..', 'flaek-client', 'src', 'pages', 'dashboard', 'pipeline-builder.tsx')
  const clientApi = path.join(__dirname, '..', '..', '..', 'flaek-client', 'src', 'lib', 'api.ts')
  const switchScript = path.join(root, 'scripts', 'switch-to-public-cluster.ts')
  const kpOut = path.join(root, 'target', 'deploy', 'flaek_mxe-keypair.json')
  const kpKeysDir = path.join(root, 'keys')
  const kpKeysOut = path.join(kpKeysDir, 'flaek_mxe_program.json')

  const oldPid = getCurrentProgramId(libPath)
  const kp = Keypair.generate()
  const newPid = kp.publicKey.toBase58()

  writeKeypairJson(kpOut, kp)
  fs.mkdirSync(kpKeysDir, { recursive: true })
  writeKeypairJson(kpKeysOut, kp)

  replaceInFile(libPath, oldPid, newPid)
  if (fs.existsSync(anchorToml)) replaceInFile(anchorToml, oldPid, newPid)
  if (fs.existsSync(clientJobs)) replaceInFile(clientJobs, oldPid, newPid)
  if (fs.existsSync(clientBuilder)) replaceInFile(clientBuilder, oldPid, newPid)
  if (fs.existsSync(clientApi)) replaceInFile(clientApi, oldPid, newPid)
  if (fs.existsSync(switchScript)) replaceInFile(switchScript, oldPid, newPid)

  console.log(JSON.stringify({ oldProgramId: oldPid, newProgramId: newPid, keypairPaths: [kpOut, kpKeysOut] }, null, 2))
}

main().catch(e => { console.error(e); process.exit(1) })
