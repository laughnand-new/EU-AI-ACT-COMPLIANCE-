// Phase XI — Hardened ACI Enforcement Boundary
// Identity-Aware, Founder-Override, Revocation-Enforcing

import { ACIResult, SubstrateAction } from "../types/substrate-types";
import { IdentityEngine, FOUNDER_ID, IdentityRecord } from "./identity";

export class ACIHardened {
  
  // Core ACI evaluation with identity verification
  static evaluate(action: SubstrateAction): ACIResult {
    const actor = action.actor as IdentityRecord;
    
    // Step 1: Verify identity integrity
    if (!IdentityEngine.verify(actor)) {
      return {
        allowed: false,
        reason: "Identity verification failed",
        enforcedBy: "ACI::IdentityVerification"
      };
    }
    
    // Step 2: Check revocation status
    if (IdentityEngine.isRevoked(actor.id)) {
      return {
        allowed: false,
        reason: "Identity has been revoked",
        enforcedBy: "ACI::RevocationCheck"
      };
    }
    
    // Step 3: Founder override path (bypasses all other rules)
    if (actor.id === FOUNDER_ID) {
      return {
        allowed: true,
        enforcedBy: "ACI::FounderOverride"
      };
    }
    
    // Step 4: Apply operation-specific rules
    return this.evaluateOperationRules(action);
  }
  
  // Operation-specific rule evaluation
  private static evaluateOperationRules(action: SubstrateAction): ACIResult {
    const actor = action.actor as IdentityRecord;
    const operation = action.operation;
    
    // Substrate modification rules
    if (operation === "substrate.modify") {
      if (actor.origin === "client") {
        return {
          allowed: false,
          reason: "Clients cannot modify substrate",
          enforcedBy: "ACI::SubstrateModification"
        };
      }
    }
    
    // Founder-level operations
    if (operation.startsWith("founder.")) {
      if (actor.id !== FOUNDER_ID) {
        return {
          allowed: false,
          reason: "Only founder can execute founder-level operations",
          enforcedBy: "ACI::FounderOperations"
        };
      }
    }
    
    // Identity revocation operations
    if (operation === "identity.revoke") {
      if (actor.id !== FOUNDER_ID) {
        return {
          allowed: false,
          reason: "Only founder can revoke identities",
          enforcedBy: "ACI::IdentityRevocation"
        };
      }
    }
    
    // System operations (system origin required)
    if (operation.startsWith("system.")) {
      if (actor.origin !== "system" && actor.id !== FOUNDER_ID) {
        return {
          allowed: false,
          reason: "System operations require system origin or founder authority",
          enforcedBy: "ACI::SystemOperations"
        };
      }
    }
    
    // Default: allow if not explicitly blocked
    return {
      allowed: true,
      enforcedBy: "ACI::DefaultAllow"
    };
  }
  
  // Check if operation requires founder authority
  static requiresFounderAuthority(operation: string): boolean {
    return (
      operation.startsWith("founder.") ||
      operation === "identity.revoke" ||
      operation === "substrate.modify.core" ||
      operation === "aci.override"
    );
  }
  
  // Get all active rules
  static getActiveRules(): string[] {
    return [
      "IdentityVerification",
      "RevocationCheck",
      "FounderOverride",
      "SubstrateModification",
      "FounderOperations",
      "IdentityRevocation",
      "SystemOperations",
      "DefaultAllow"
    ];
  }
}

// Backward compatibility
export class ACI {
  static evaluate(action: SubstrateAction): ACIResult {
    return ACIHardened.evaluate(action);
  }
}
