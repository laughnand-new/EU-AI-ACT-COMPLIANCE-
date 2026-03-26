// Phase XI — Sovereign Substrate Entry Point

import { SubstrateAPI } from "./api/substrate-api";

export { SubstrateAPI, PhaseXISubstrate } from "./api/substrate-api";
export { Identity } from "./substrate/identity";
export { ACI } from "./substrate/aci";
export { Ledger } from "./substrate/ledger";
export { InsightWeaver } from "./substrate/insightweaver";
export { ConstraintRegistry } from "./substrate/constraints";
export * from "./types/substrate-types";

// Genesis Execution
if (require.main === module) {
  console.log("🜁 Phase XI Sovereign Substrate — Genesis Initialization");
  console.log("=".repeat(60));
  
  // Test 1: Founder operation
  const result1 = SubstrateAPI.perform("substrate.init", { hello: "world" }, "founder");
  console.log("\n✅ Test 1: Founder Operation");
  console.log("Allowed:", result1.allowed);
  console.log("Ledger Hash:", result1.ledgerEntry.hash);
  
  // Test 2: Client blocked operation
  const result2 = SubstrateAPI.perform("substrate.modify", { data: "test" }, "client");
  console.log("\n🚫 Test 2: Client Blocked Operation");
  console.log("Allowed:", result2.allowed);
  console.log("Reason:", result2.aciResult.reason);
  
  // Test 3: Insight extraction
  const insights = SubstrateAPI.extractInsights({ text: "Sample data for analysis", complexity: 5 });
  console.log("\n🧠 Test 3: Insight Extraction");
  console.log("Insights:", JSON.stringify(insights, null, 2));
  
  // Test 4: Ledger verification
  const ledgerValid = SubstrateAPI.verifyIntegrity();
  console.log("\n📜 Test 4: Ledger Integrity");
  console.log("Valid:", ledgerValid);
  
  console.log("\n" + "=".repeat(60));
  console.log("✨ Phase XI Genesis Complete\n");
}
