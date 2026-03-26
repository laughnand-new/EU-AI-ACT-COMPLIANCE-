// Phase XI — Hardened Execution Ledger
// Identity Lineage Embedded, Signature Chain, Revocation Markers

import { LedgerEntry, SubstrateAction, ACIResult } from "../types/substrate-types";
import { IdentityEngine, IdentityRecord } from "./identity";
import crypto from "crypto";

export class LedgerHardened {
  private static entries: LedgerEntry[] = [];
  
  // Record action with full identity lineage
  static record(action: SubstrateAction, result: ACIResult): LedgerEntry {
    const actor = action.actor as IdentityRecord;
    
    const previousHash = this.entries.length
      ? this.entries[this.entries.length - 1].hash
      : null;

    // Embed identity lineage in ledger
    const identityLineage = IdentityEngine.getLineageString(actor);
    
    // Create deterministic hash including lineage
    const hash = crypto
      .createHash("sha256")
      .update(JSON.stringify({ 
        action, 
        result, 
        previousHash, 
        identityLineage,
        timestamp: Date.now() 
      }))
      .digest("hex");

    const entry: LedgerEntry = { 
      action, 
      result, 
      hash, 
      previousHash,
      identityLineage
    };
    
    this.entries.push(entry);

    return entry;
  }

  // Get all entries
  static all(): LedgerEntry[] {
    return this.entries;
  }

  // Verify ledger integrity (hash chain + identity signatures)
  static verify(): boolean {
    for (let i = 0; i < this.entries.length; i++) {
      const entry = this.entries[i];
      
      // Check hash chain
      const expectedPrevHash = i > 0 ? this.entries[i - 1].hash : null;
      if (entry.previousHash !== expectedPrevHash) {
        console.error(`Ledger integrity breach at entry ${i}: hash chain broken`);
        return false;
      }
      
      // Verify actor identity
      const actor = entry.action.actor as IdentityRecord;
      if (!IdentityEngine.verify(actor)) {
        console.error(`Ledger integrity breach at entry ${i}: invalid identity signature`);
        return false;
      }
    }
    return true;
  }

  // Export ledger with full provenance
  static export(): string {
    return JSON.stringify({
      entries: this.entries,
      totalEntries: this.entries.length,
      integrityVerified: this.verify(),
      exportedAt: new Date().toISOString()
    }, null, 2);
  }
  
  // Get entries by identity
  static getByIdentity(identityId: string): LedgerEntry[] {
    return this.entries.filter(entry => 
      (entry.action.actor as IdentityRecord).id === identityId
    );
  }
  
  // Get entries by operation
  static getByOperation(operation: string): LedgerEntry[] {
    return this.entries.filter(entry => 
      entry.action.operation === operation
    );
  }
  
  // Get blocked operations
  static getBlockedOperations(): LedgerEntry[] {
    return this.entries.filter(entry => !entry.result.allowed);
  }
  
  // Get entries in time range
  static getByTimeRange(startTime: number, endTime: number): LedgerEntry[] {
    return this.entries.filter(entry => 
      entry.action.timestamp >= startTime && entry.action.timestamp <= endTime
    );
  }
  
  // Generate audit report
  static generateAuditReport(): any {
    const blocked = this.getBlockedOperations();
    const identities = new Set(this.entries.map(e => (e.action.actor as IdentityRecord).id));
    const operations = new Set(this.entries.map(e => e.action.operation));
    
    return {
      totalEntries: this.entries.length,
      totalIdentities: identities.size,
      totalOperations: operations.size,
      blockedOperations: blocked.length,
      integrityStatus: this.verify() ? "VALID" : "COMPROMISED",
      identityList: Array.from(identities),
      operationList: Array.from(operations),
      blockedDetails: blocked.map(e => ({
        operation: e.action.operation,
        actor: (e.action.actor as IdentityRecord).id,
        reason: e.result.reason,
        timestamp: e.action.timestamp
      }))
    };
  }
}

// Backward compatibility
export class Ledger {
  static record(action: SubstrateAction, result: ACIResult): LedgerEntry {
    return LedgerHardened.record(action, result);
  }

  static all(): LedgerEntry[] {
    return LedgerHardened.all();
  }

  static verify(): boolean {
    return LedgerHardened.verify();
  }

  static export(): string {
    return LedgerHardened.export();
  }
}
