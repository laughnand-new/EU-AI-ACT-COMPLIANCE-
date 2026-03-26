// Phase XI — ACI Enforcement Boundary

import { ACIResult, SubstrateAction } from "../types/substrate-types";

export class ACI {
  static evaluate(action: SubstrateAction): ACIResult {
    // Deterministic rule set
    if (action.actor.origin === "client" && action.operation === "substrate.modify") {
      return { allowed: false, reason: "Clients cannot modify substrate." };
    }

    if (action.actor.origin === "system" && action.operation.startsWith("founder.")) {
      return { allowed: false, reason: "System cannot execute founder-level operations." };
    }

    // Default: allow if not explicitly blocked
    return { allowed: true };
  }
}
