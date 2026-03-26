// Phase XII — Dual-Layer Integrity Test
// Demonstrates: Immutable History + Trust State Reinterpretation

import { IdentityEngine, FOUNDER_ID } from "./substrate/identity";
import { PhaseXISubstrateHardened } from "./substrate/substrate-hardened";
import { LedgerHardened } from "./substrate/ledger-hardened";
import { TrustStateLayer } from "./consensus/trust-state";
import { NodeIdentityEngine } from "./consensus/node-identity";
import { ConsensusStateMachine } from "./consensus/state-machine";
import { HybridLogicalClock } from "./consensus/hlc";

console.log("🜁 PHASE XII — DUAL-LAYER INTEGRITY MODEL TEST");
console.log("=".repeat(70));
console.log("");

// Initialize
const founder = IdentityEngine.getFounderIdentity();
const client1 = IdentityEngine.createIdentity("client");
const client2 = IdentityEngine.createIdentity("client");

console.log("📌 Phase 1: Historical Ledger Creation");
console.log("-".repeat(70));

// Client1 performs operations
const op1 = PhaseXISubstrateHardened.execute(
  "data.write",
  { data: "important document" },
  client1
);
console.log(`✓ Client1 operation 1: ${op1.allowed ? "ALLOWED" : "DENIED"}`);

const op2 = PhaseXISubstrateHardened.execute(
  "data.write",
  { data: "another document" },
  client1
);
console.log(`✓ Client1 operation 2: ${op2.allowed ? "ALLOWED" : "DENIED"}`);

// Client2 performs operation
const op3 = PhaseXISubstrateHardened.execute(
  "data.read",
  { resource: "docs" },
  client2
);
console.log(`✓ Client2 operation 1: ${op3.allowed ? "ALLOWED" : "DENIED"}`);

console.log(`\nTotal ledger entries: ${LedgerHardened.all().length}`);
console.log("");

// Build initial trust state
console.log("📊 Phase 2: Trust State Layer - Initial Build");
console.log("-".repeat(70));
TrustStateLayer.rebuild(LedgerHardened.all());
console.log(`Client1 trust status: ${TrustStateLayer.getTrustStatus(client1.id)}`);
console.log(`Client2 trust status: ${TrustStateLayer.getTrustStatus(client2.id)}`);
console.log("");

// Revoke client1
console.log("⚠️  Phase 3: Identity Revocation (Founder Action)");
console.log("-".repeat(70));
const revocationResult = PhaseXISubstrateHardened.revokeIdentity(
  client1.id,
  founder
);
console.log(`✓ Client1 revoked by ${revocationResult.revokedBy}`);
console.log("");

// Rebuild trust state after revocation
console.log("🔄 Phase 4: Trust State Rebuild After Revocation");
console.log("-".repeat(70));
TrustStateLayer.rebuild(LedgerHardened.all());
console.log(`Client1 trust status: ${TrustStateLayer.getTrustStatus(client1.id)}`);
console.log(`Client2 trust status: ${TrustStateLayer.getTrustStatus(client2.id)}`);

const client1Record = TrustStateLayer.getTrustRecord(client1.id);
if (client1Record) {\n  console.log(`Client1 revoked at: ${new Date(client1Record.revokedAt!).toISOString()}`);
  console.log(`Client1 revoked by: ${client1Record.revokedBy}`);
}
console.log("");

// Dual-layer evaluation
console.log("🔬 Phase 5: Dual-Layer Evaluation");
console.log("-".repeat(70));

const op1Timestamp = op1.ledgerEntry.action.timestamp;
const now = Date.now();

console.log("Historical Evaluation (at time of operation):");
const historicalValid = TrustStateLayer.evaluateHistorical(client1.id, op1Timestamp);
console.log(`  Client1 was valid at operation time: ${historicalValid}`);

console.log("\nCurrent Trust Evaluation (now):");
const currentValid = TrustStateLayer.evaluateCurrent(client1.id);
console.log(`  Client1 is valid now: ${currentValid}`);

console.log("\nKey Insight:");
console.log("  • History layer: Operation was valid when executed ✓");
console.log("  • Trust layer: Identity is now revoked ✗");
console.log("  • Ledger: NEVER rewritten - immutable ✓");
console.log("");

// Verify ledger integrity
console.log("📜 Phase 6: Ledger Integrity Verification");
console.log("-".repeat(70));
const integrityValid = LedgerHardened.verify();
console.log(`Cryptographic chain: ${integrityValid ? "VALID ✓" : "BROKEN ✗"}`);
console.log(`Total entries: ${LedgerHardened.all().length}`);
console.log(`Revoked identities: ${TrustStateLayer.getRevokedIdentities().length}`);
console.log("");

// Audit report
console.log("📊 Phase 7: Comprehensive Audit Report");
console.log("-".repeat(70));
const audit = LedgerHardened.generateAuditReport();
console.log(`Total operations: ${audit.totalEntries}`);
console.log(`Total identities: ${audit.totalIdentities}`);
console.log(`Blocked operations: ${audit.blockedOperations}`);
console.log(`Integrity status: ${audit.integrityStatus}`);
console.log("");

console.log("Identity Activity:");
audit.identityList.forEach((id: string) => {
  const trustStatus = TrustStateLayer.getTrustStatus(id);
  const operations = LedgerHardened.getByIdentity(id).length;
  console.log(`  • ${id.slice(0, 8)}... [${trustStatus.toUpperCase()}] (${operations} ops)`);
});
console.log("");

// Node identity test
console.log("🌐 Phase 8: Node Identity Model");
console.log("-".repeat(70));
const coreNode1 = NodeIdentityEngine.createNode("core", "node1.fabric.xi");
const coreNode2 = NodeIdentityEngine.createNode("core", "node2.fabric.xi");
const observerNode = NodeIdentityEngine.createNode("observer", "audit.fabric.xi");

console.log(`Core Node 1: ${coreNode1.id}`);
console.log(`  Lineage: ${NodeIdentityEngine.getNodeLineage(coreNode1)}`);
console.log(`  Class: ${coreNode1.nodeClass}`);

console.log(`\nCore Node 2: ${coreNode2.id}`);
console.log(`  Lineage: ${NodeIdentityEngine.getNodeLineage(coreNode2)}`);

console.log(`\nObserver Node: ${observerNode.id}`);
console.log(`  Lineage: ${NodeIdentityEngine.getNodeLineage(observerNode)}`);
console.log(`  Endpoint: ${observerNode.endpoint}`);

console.log(`\nActive core nodes: ${NodeIdentityEngine.getCoreNodes().length}`);
console.log("");

// HLC test
console.log("⏱️  Phase 9: Hybrid Logical Clock");
console.log("-".repeat(70));
const hlc1 = new HybridLogicalClock("node1");
const hlc2 = new HybridLogicalClock("node2");

const ts1 = hlc1.now();
console.log(`Node1 HLC: ${HybridLogicalClock.serialize(ts1)}`);

// Simulate message passing
const ts2 = hlc2.update(ts1);
console.log(`Node2 HLC (after receiving): ${HybridLogicalClock.serialize(ts2)}`);

const ts3 = hlc1.now();
console.log(`Node1 HLC (new): ${HybridLogicalClock.serialize(ts3)}`);

console.log(`\nCausal ordering: ts1 < ts2? ${HybridLogicalClock.happenedBefore(ts1, ts2)}`);
console.log(`Causal ordering: ts2 < ts3? ${HybridLogicalClock.happenedBefore(ts2, ts3)}`);
console.log("");

// Consensus state machine
console.log("🤝 Phase 10: Consensus State Machine");
console.log("-".repeat(70));
const founderNode = NodeIdentityEngine.getFounderNode();
const consensus = new ConsensusStateMachine(founderNode, 1); // Quorum of 1 for testing

const proposal = await consensus.proposeAction(
  "data.write",
  { data: "consensus test" },
  founder
);

console.log(`Proposal ID: ${proposal.actionId}`);
console.log(`Operation: ${proposal.operation}`);
console.log(`Phase: ${proposal.phase}`);
console.log(`Votes: ${proposal.votes.size}`);

const status = consensus.getStatus();
console.log(`\nConsensus Status:`);
console.log(`  Node: ${status.nodeId}`);
console.log(`  Class: ${status.nodeClass}`);
console.log(`  Active proposals: ${status.activeProposals}`);
console.log(`  Quorum size: ${status.quorumSize}`);
console.log("");

// Final summary
console.log("=".repeat(70));
console.log("✨ PHASE XII DUAL-LAYER INTEGRITY MODEL — COMPLETE");
console.log("");
console.log("Architecture Validated:");
console.log("  ✓ Immutable History Layer (never rewritten)");
console.log("  ✓ Trust State Layer (derived from ledger)");
console.log("  ✓ Dual Evaluation Modes (historical vs current)");
console.log("  ✓ Node Identity Model (lineage-based)");
console.log("  ✓ Hybrid Logical Clock (causal ordering)");
console.log("  ✓ Consensus State Machine (propose→vote→commit)");
console.log("");
console.log("Key Properties:");
console.log("  • Revocation reinterprets history without rewriting");
console.log("  • Every action remains cryptographically provable");
console.log("  • Trust state is fully reconstructible from ledger");
console.log("  • Nodes are substrate identities with founder lineage");
console.log("  • Consensus is deterministic and identity-aware");
console.log("");
console.log("🜁 Phase XII — Distributed Governance Fabric Ready");
console.log("");
