import * as anchor from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import { getMXEAccAddress } from "@arcium-hq/client";

async function main() {
  const programId = new PublicKey("F1aQdsqtKM61djxRgUwKy4SS5BTKVDtgoK5vYkvL62B6");
  const provider = anchor.AnchorProvider.env();
  
  const mxeAccount = getMXEAccAddress(programId);
  console.log("MXE Account:", mxeAccount.toBase58());
  
  const accountInfo = await provider.connection.getAccountInfo(mxeAccount);
  
  if (!accountInfo) {
    console.log("❌ MXE account does not exist");
    return;
  }
  
  console.log("✅ MXE account exists");
  console.log("Owner:", accountInfo.owner.toBase58());
  console.log("Data length:", accountInfo.data.length);
  
  // Try to decode authority (first 32 bytes after discriminator)
  if (accountInfo.data.length >= 40) {
    const authorityBytes = accountInfo.data.slice(8, 40);
    const authority = new PublicKey(authorityBytes);
    console.log("Authority:", authority.toBase58());
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error:", error);
    process.exit(1);
  });
