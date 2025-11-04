import * as anchor from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import { getMXEPublicKey, getMXEAccAddress } from "@arcium-hq/client";

async function main() {
  const arg = process.argv[2];
  const fallback = "Hc6oVrp36jfCeSfaozozJyHk6PG9eWoFrj9PieJnCD2R";
  const programId = new PublicKey(arg || fallback);
  
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  console.log("Program ID:", programId.toBase58());
  console.log("MXE Account:", getMXEAccAddress(programId).toBase58());
  console.log("\nFetching MXE x25519 public key...");

  const mxePublicKey = await getMXEPublicKey(provider as anchor.AnchorProvider, programId);

  const base64 = Buffer.from(mxePublicKey).toString('base64');
  const hex = Buffer.from(mxePublicKey).toString('hex');

  console.log("\n✅ MXE Public Key:");
  console.log("  Base64:", base64);
  console.log("  Hex:", hex);
  
  console.log("\n📝 Add this to your Flaek .env:");
  console.log(`ARCIUM_MXE_PUBLIC_KEY=${base64}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error:", error);
    process.exit(1);
  });
