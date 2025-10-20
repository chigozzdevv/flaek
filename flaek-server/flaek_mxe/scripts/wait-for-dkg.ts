import * as anchor from "@coral-xyz/anchor";
import { Connection, PublicKey } from "@solana/web3.js";
import { getMXEPublicKey } from "@arcium-hq/client";

const PROGRAM_ID = "AF3aPN4n6udY1Uan5jkUrbzFfiquPiXcrTBTNmfR2GP7";
const RPC_URL = "https://devnet.helius-rpc.com/?api-key=36a6861e-bab9-4038-93bd-b196fe6adc61";

async function waitForDKG() {
  const connection = new Connection(RPC_URL, "confirmed");
  const provider = new anchor.AnchorProvider(
    connection,
    {} as any,
    { commitment: "confirmed" }
  );

  const programId = new PublicKey(PROGRAM_ID);
  let attempts = 0;
  const maxAttempts = 60; // 5 minutes (5s intervals)

  console.log("Waiting for DKG to complete...");
  console.log(`Program: ${PROGRAM_ID}\n`);

  while (attempts < maxAttempts) {
    attempts++;
    process.stdout.write(`Attempt ${attempts}/${maxAttempts}... `);

    try {
      const mxePublicKey = await getMXEPublicKey(provider, programId);

      if (mxePublicKey && mxePublicKey.length === 32) {
        console.log("\n\n✅ DKG Complete!");
        console.log(`MXE Public Key: [${Array.from(mxePublicKey).slice(0, 8).join(",")}...]`);
        console.log(`\nFull key array for .env:`);
        console.log(`ARCIUM_MXE_PUBLIC_KEY=[${Array.from(mxePublicKey).join(",")}]`);
        return true;
      }
    } catch (e) {
      // Ignore errors during DKG
    }

    process.stdout.write("Not ready yet\n");
    await new Promise((r) => setTimeout(r, 5000)); // Wait 5 seconds
  }

  console.log("\n\n❌ Timeout: DKG did not complete in 5 minutes");
  console.log("This might take longer. Check manually with:");
  console.log(`  curl http://localhost:4000/v1/public/mxe/${PROGRAM_ID}`);
  return false;
}

waitForDKG().then((success) => process.exit(success ? 0 : 1));
