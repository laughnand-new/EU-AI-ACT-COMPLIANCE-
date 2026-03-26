// Phase XI — Substrate API Surface

import { PhaseXISubstrate } from "../substrate/substrate";
import { Identity } from "../substrate/identity";
import { InsightWeaver } from "../substrate/insightweaver";

export { PhaseXISubstrate } from "../substrate/substrate";

export class SubstrateAPI {
  static perform(operation: string, payload: any, origin: "founder" | "system" | "client") {
    const actor = Identity.create(origin);
    return PhaseXISubstrate.execute(operation, payload, actor);
  }

  static getLedger() {
    return PhaseXISubstrate.getLedger();
  }

  static verifyIntegrity() {
    return PhaseXISubstrate.verifyLedger();
  }

  static extractInsights(data: any) {
    const actor = Identity.create("system");
    const result = PhaseXISubstrate.execute("substrate.insight.extract", data, actor);
    
    if (result.allowed) {
      return InsightWeaver.extractPatterns(data);
    }
    
    return { error: "Operation not allowed", reason: result.aciResult.reason };
  }
}
