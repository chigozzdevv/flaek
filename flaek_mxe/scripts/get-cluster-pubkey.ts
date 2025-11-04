import { getClusterAccAddress } from "@arcium-hq/client";

const CLUSTER_OFFSET = 933394941;

const clusterPubkey = getClusterAccAddress(CLUSTER_OFFSET);

console.log("Cluster Offset:", CLUSTER_OFFSET);
console.log("Cluster Pubkey:", clusterPubkey.toBase58());
console.log("\n📝 Add this to your Flaek .env:");
console.log(`ARCIUM_CLUSTER_PUBKEY=${clusterPubkey.toBase58()}`);
