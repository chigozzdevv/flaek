const fs = require('fs');
const path = require('path');

function main() {
  const mxeRoot = path.resolve(__dirname, '..');
  const mapPath = path.join(mxeRoot, 'build', 'circuits_urls_pinata_devnet.json');
  const libPath = path.join(mxeRoot, 'programs', 'flaek_mxe', 'src', 'lib.rs');

  if (!fs.existsSync(mapPath)) {
    console.error('Mapping JSON not found at', mapPath);
    process.exit(1);
  }
  if (!fs.existsSync(libPath)) {
    console.error('lib.rs not found at', libPath);
    process.exit(1);
  }

  const mapJson = JSON.parse(fs.readFileSync(mapPath, 'utf-8'));
  const cid = mapJson.dirCid;
  if (!cid) {
    console.error('dirCid missing in mapping JSON');
    process.exit(1);
  }
  const base = `https://brown-immense-amphibian-214.mypinata.cloud/ipfs/${cid}/circuits/devnet`;

  let src = fs.readFileSync(libPath, 'utf-8');

  const circuits = [
    'add','subtract','multiply','divide','modulo','power','abs_diff',
    'greater_than','less_than','equal','greater_equal','less_equal','in_range',
    'and','or','not','xor','if_else',
    'average','sum','min','max','median',
    'credit_score','health_risk','vote_tally','meets_threshold','weighted_average'
  ];

  for (const c of circuits) {
    const re = new RegExp(`(source:\\s*")[^"]*${c}_(?:testnet|devnet)\\.arcis(")`, 'g');
    const newUrl = `${base}/${c}_devnet.arcis`;
    src = src.replace(re, `$1${newUrl}$2`);
  }

  // Zero out all hashes in OffChainCircuitSource blocks
  src = src.replace(/hash:\s*\[[^\]]*\]/g, 'hash: [0; 32]');

  fs.writeFileSync(libPath, src);
  console.log('Patched lib.rs with devnet URLs and zero hashes using CID:', cid);
}

main();
