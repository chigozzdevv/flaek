const fs = require('fs')
const path = require('path')

function main() {
  const libPath = path.join(__dirname, '..', 'programs', 'flaek_mxe', 'src', 'lib.rs')
  let src = fs.readFileSync(libPath, 'utf8')
  const before = src
  src = src.replace(/(ctx\.accounts,\s*)false,/g, '$1true,')
  if (src !== before) {
    fs.writeFileSync(libPath, src)
    console.log('Enabled verify=true in all init_*_comp_def')
  } else {
    console.log('No changes made (verify was already true or pattern not found)')
  }
}

main()
