import * as fs from 'fs'
import * as path from 'path'
import crypto from 'crypto'

const CIRCUITS = [
  'add','subtract','multiply','divide','modulo','power','abs_diff',
  'greater_than','less_than','equal','greater_equal','less_equal','in_range',
  'and','or','not','xor','if_else','average','sum','min','max','median',
  'credit_score','health_risk','vote_tally','meets_threshold','weighted_average'
]

const root = path.resolve(process.cwd(), '..', 'flaek_mxe', 'build')

const out: Record<string, { hashHex: string; hashArray: number[] }> = {}
for (const c of CIRCUITS) {
  const file = path.join(root, `${c}_testnet.arcis`)
  const buf = fs.readFileSync(file)
  const hex = crypto.createHash('sha256').update(buf).digest('hex')
  const arr = Array.from(crypto.createHash('sha256').update(buf).digest())
  out[c] = { hashHex: hex, hashArray: arr }
}

console.log(JSON.stringify(out, null, 2))
