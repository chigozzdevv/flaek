import 'dotenv/config'
import * as anchor from '@coral-xyz/anchor'
import { Connection, Keypair, PublicKey } from '@solana/web3.js'
import { getMXEPublicKey } from '@arcium-hq/client'

async function main() {
  const rpc = process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com'
  const secret = process.env.ARCIUM_SOLANA_SECRET_KEY
  const mxeId = process.env.ARCIUM_MXE_PROGRAM_ID
  if (!secret || !mxeId) throw new Error('Missing ARCIUM_SOLANA_SECRET_KEY or ARCIUM_MXE_PROGRAM_ID')

  const conn = new Connection(rpc, 'confirmed')
  const kp = Keypair.fromSecretKey(Uint8Array.from(JSON.parse(secret)))
  const wallet = new anchor.Wallet(kp)
  const provider = new anchor.AnchorProvider(conn, wallet, { commitment: 'confirmed' })
  anchor.setProvider(provider)

  const pub = await getMXEPublicKey(provider as any, new PublicKey(mxeId))
  if (!pub) throw new Error('MXE public key not found on-chain for this program')
  console.log(Buffer.from(pub as Uint8Array).toString('base64'))
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
