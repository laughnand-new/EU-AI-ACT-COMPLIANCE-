// Phase XI — Sovereign Substrate Orchestrator

import { SubstrateKernel } from "./kernel";
import { ACI } from "./aci";
import { Ledger } from "./ledger";
import { SubstrateIdentity } from "../types/substrate-types";

export class PhaseXISubstrate {
  static execute(operation: string, payload: any, actor: SubstrateIdentity) {
    const kernel = SubstrateKernel.getInstance();
    const action = kernel.createAction(operation, payload, actor);

    // ACI Enforcement - non-bypassable
    const aciResult = ACI.evaluate(action);
    
    // Ledger Recording - deterministic
    const ledgerEntry = Ledger.record(action, aciResult);

    return { 
      aciResult, 
      ledgerEntry,
      allowed: aciResult.allowed,
      timestamp: action.timestamp
    };
  }

  static getLedger() {
    return Ledger.all();
  }

  static verifyLedger() {
    return Ledger.verify();
  }
}
