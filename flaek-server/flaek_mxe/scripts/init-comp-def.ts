import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import { FlaekMxe } from "../target/types/flaek_mxe";
import * as fs from "fs";
import * as os from "os";
import {
  getCompDefAccOffset,
  getArciumAccountBaseSeed,
  getArciumProgAddress,
  buildFinalizeCompDefTx,
  getMXEAccAddress,
} from "@arcium-hq/client";

async function main() {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.FlaekMxe as Program<FlaekMxe>;
  const owner = readKpJson(`${os.homedir()}/.config/solana/id.json`);

  console.log("Program ID:", program.programId.toBase58());
  console.log("Initializing 'add' computation definition...");

  const baseSeedCompDefAcc = getArciumAccountBaseSeed("ComputationDefinitionAccount");
  const offset = getCompDefAccOffset("add");

  const compDefPDA = PublicKey.findProgramAddressSync(
    [baseSeedCompDefAcc, program.programId.toBuffer(), offset],
    getArciumProgAddress()
  )[0];

  console.log("Comp def PDA:", compDefPDA.toBase58());

  // Initialize the computation definition
  const sig = await program.methods
    .initAddCompDef()
    .accounts({
      compDefAccount: compDefPDA,
      payer: owner.publicKey,
      mxeAccount: getMXEAccAddress(program.programId),
    })
    .signers([owner])
    .rpc({
      commitment: "confirmed",
    });

  console.log("✅ Initialization signature:", sig);

  // Finalize the computation definition
  console.log("Finalizing computation definition...");
  
  const finalizeTx = await buildFinalizeCompDefTx(
    provider as anchor.AnchorProvider,
    Buffer.from(offset).readUInt32LE(),
    program.programId
  );

  const latestBlockhash = await provider.connection.getLatestBlockhash();
  finalizeTx.recentBlockhash = latestBlockhash.blockhash;
  finalizeTx.lastValidBlockHeight = latestBlockhash.lastValidBlockHeight;
  finalizeTx.sign(owner);

  const finalizeSig = await provider.sendAndConfirm(finalizeTx);
  console.log("✅ Finalization signature:", finalizeSig);
  
  console.log("\n🎉 Computation definition initialized and finalized successfully!");
}

function readKpJson(path: string): anchor.web3.Keypair {
  const file = fs.readFileSync(path);
  return anchor.web3.Keypair.fromSecretKey(
    new Uint8Array(JSON.parse(file.toString()))
  );
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error:", error);
    process.exit(1);
  });
