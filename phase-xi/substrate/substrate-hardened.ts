// Phase XI — Hardened Sovereign Substrate Orchestrator
// Identity Verification, Revocation Checks, Founder Authority Enforcement

import { SubstrateKernel } from "./kernel";
import { ACIHardened } from "./aci-hardened";
import { LedgerHardened } from "./ledger-hardened";
import { IdentityEngine, IdentityRecord, FOUNDER_ID } from "./identity";

export class PhaseXISubstrateHardened {
  
  // Execute operation with full identity verification
  static execute(operation: string, payload: any, actor: IdentityRecord) {
    const kernel = SubstrateKernel.getInstance();
    
    // Step 1: Verify actor identity
    if (!IdentityEngine.verify(actor)) {
      throw new Error("Identity verification failed - invalid signature");
    }
    
    // Step 2: Check revocation
    if (IdentityEngine.isRevoked(actor.id)) {
      throw new Error(`Identity ${actor.id} has been revoked`);
    }
    
    // Step 3: Create substrate action
    const action = kernel.createAction(operation, payload, actor);

    // Step 4: ACI Enforcement (non-bypassable)
    const aciResult = ACIHardened.evaluate(action);
    
    // Step 5: Ledger Recording (deterministic)
    const ledgerEntry = LedgerHardened.record(action, aciResult);

    return { 
      aciResult, 
      ledgerEntry,
      allowed: aciResult.allowed,
      timestamp: action.timestamp,
      identityLineage: IdentityEngine.getLineageString(actor),
      enforcedBy: aciResult.enforcedBy
    };
  }

  // Founder-only: Revoke identity
  static revokeIdentity(targetId: string, founderActor: IdentityRecord) {
    if (founderActor.id !== FOUNDER_ID) {
      throw new Error("Only founder can revoke identities");
    }
    
    const result = IdentityEngine.revokeIdentity(targetId, founderActor.id);
    
    // Log revocation in ledger
    this.execute("identity.revoke", { targetId }, founderActor);
    
    return {
      success: result,
      targetId,
      revokedBy: FOUNDER_ID,
      timestamp: Date.now()
    };
  }

  // Get ledger with audit report
  static getLedgerWithAudit() {
    return {
      entries: LedgerHardened.all(),
      audit: LedgerHardened.generateAuditReport(),
      integrityVerified: LedgerHardened.verify()
    };
  }

  // Verify ledger integrity
  static verifyLedger() {
    return LedgerHardened.verify();
  }
  
  // Get entries for specific identity
  static getIdentityHistory(identityId: string) {
    return LedgerHardened.getByIdentity(identityId);
  }
  
  // Get blocked operations
  static getBlockedOperations() {
    return LedgerHardened.getBlockedOperations();
  }
  
  // Export full substrate state
  static exportState() {
    return {
      ledger: LedgerHardened.export(),
      audit: LedgerHardened.generateAuditReport(),
      founderIdentity: FOUNDER_ID,
      timestamp: new Date().toISOString()
    };
  }
}

// Backward compatibility
export class PhaseXISubstrate {
  static execute(operation: string, payload: any, actor: any) {
    // Convert old SubstrateIdentity to IdentityRecord if needed
    const identityRecord = actor as IdentityRecord;
    return PhaseXISubstrateHardened.execute(operation, payload, identityRecord);
  }

  static getLedger() {
    return LedgerHardened.all();
  }

  static verifyLedger() {
    return LedgerHardened.verify();
  }
}
