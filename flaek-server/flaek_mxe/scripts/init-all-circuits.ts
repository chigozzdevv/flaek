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

const CIRCUITS = [
  "add", "subtract", "multiply", "divide", "modulo", "power", "abs_diff",
  "greater_than", "less_than", "equal", "greater_equal", "less_equal", "in_range",
  "and", "or", "not", "xor", "if_else",
  "average", "sum", "min", "max", "median",
  "credit_score", "health_risk", "vote_tally", "meets_threshold", "weighted_average"
];

async function initializeCircuit(
  program: Program<FlaekMxe>,
  owner: anchor.web3.Keypair,
  provider: anchor.AnchorProvider,
  circuitName: string,
  force: boolean,
  offchainSource: boolean
): Promise<boolean> {
  try {
    console.log(`\n----------------------------------------`);
    console.log(`Initializing: ${circuitName}`);
    console.log(`----------------------------------------`);

    const baseSeedCompDefAcc = getArciumAccountBaseSeed("ComputationDefinitionAccount");
    const offset = getCompDefAccOffset(circuitName);
    const offsetNum = Buffer.from(offset).readUInt32LE();

    const compDefPDA = PublicKey.findProgramAddressSync(
      [baseSeedCompDefAcc, program.programId.toBuffer(), offset],
      getArciumProgAddress()
    )[0];

    console.log(`  Comp def PDA: ${compDefPDA.toBase58()}`);
    console.log(`  Offset: ${offsetNum}`);

    // Check if already initialized
    try {
      const accountInfo = await provider.connection.getAccountInfo(compDefPDA);
      if (accountInfo && accountInfo.data.length > 0 && !force) {
        console.log(`  ✓ Already initialized, skipping...`);
        return true;
      } else if (accountInfo && accountInfo.data.length > 0 && force) {
        console.log(`  ⚠️ Already initialized, attempting re-init to update source...`);
      }
    } catch (e) {
      // Account doesn't exist, proceed with initialization
    }

    // Get the init method name (convert snake_case to camelCase)
    const methodName = `init${circuitName
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join('')}CompDef`;

    console.log(`  Calling method: ${methodName}`);

    // Initialize the computation definition
    const sig = await (program.methods as any)[methodName]()
      .accounts({
        compDefAccount: compDefPDA,
        payer: owner.publicKey,
        mxeAccount: getMXEAccAddress(program.programId),
        arciumProgram: getArciumProgAddress(),
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([owner])
      .rpc({
        commitment: "confirmed",
      });

    console.log(`  ✓ Initialization tx: ${sig}`);

    if (offchainSource) {
      console.log(`  ✓ Registered off-chain circuit source (no on-chain upload needed)`);
      console.log(`  ✅ ${circuitName} initialized for off-chain execution!`);
      return true;
    }

    // Wait a bit for the transaction to settle
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Finalize the computation definition
    console.log(`  Finalizing...`);
    
    const finalizeTx = await buildFinalizeCompDefTx(
      provider,
      offsetNum,
      program.programId
    );

    const latestBlockhash = await provider.connection.getLatestBlockhash();
    finalizeTx.recentBlockhash = latestBlockhash.blockhash;
    finalizeTx.lastValidBlockHeight = latestBlockhash.lastValidBlockHeight;
    finalizeTx.sign(owner);

    const finalizeSig = await provider.sendAndConfirm(finalizeTx, [], {
      commitment: "confirmed",
    });
    
    console.log(`  ✓ Finalization tx: ${finalizeSig}`);
    console.log(`  ✅ ${circuitName} completed successfully!`);
    
    return true;
  } catch (error) {
    console.error(`  ❌ Error initializing ${circuitName}:`, error.message || error);
    return false;
  }
}

async function main() {
  console.log("=========================================");
  console.log("Flaek Circuit Initialization");
  console.log("=========================================");
  console.log(`Total circuits: ${CIRCUITS.length}`);
  console.log("=========================================\n");

  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.FlaekMxe as Program<FlaekMxe>;
  const owner = readKpJson(`${os.homedir()}/.config/solana/id.json`);

  console.log("Program ID:", program.programId.toBase58());
  console.log("MXE Account:", getMXEAccAddress(program.programId).toBase58());
  console.log("RPC:", provider.connection.rpcEndpoint);
  console.log("Payer:", owner.publicKey.toBase58());

  const results: { circuit: string; success: boolean }[] = [];

  const force = process.argv.includes('--force');
  const offchainSource = process.argv.includes('--onchain') ? false : true;
  if (offchainSource) {
    console.log("Off-chain circuit mode enabled (pass --onchain to revert).");
  } else {
    console.log("On-chain circuit mode enabled (finalizing and uploading metadata).");
  }

  for (const circuit of CIRCUITS) {
    const success = await initializeCircuit(program, owner, provider, circuit, force, offchainSource);
    results.push({ circuit, success });
    
    // Small delay between circuits to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log("\n=========================================");
  console.log("Initialization Summary");
  console.log("=========================================");
  
  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  
  console.log(`Total: ${CIRCUITS.length}`);
  console.log(`Successful: ${successful}`);
  console.log(`Failed: ${failed}`);
  console.log("=========================================");
  
  if (failed > 0) {
    console.log("\nFailed circuits:");
    results.filter(r => !r.success).forEach(r => {
      console.log(`  - ${r.circuit}`);
    });
  }
  
  if (successful === CIRCUITS.length) {
    console.log("\n🎉 All circuits initialized successfully!");
  } else if (successful > 0) {
    console.log("\n⚠️  Some circuits failed to initialize");
  } else {
    console.log("\n❌ All circuits failed to initialize");
  }
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
    console.error("Fatal error:", error);
    process.exit(1);
  });
