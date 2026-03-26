// Phase XII — Trust State Layer
// Derived from ledger, materialized for current trust evaluation

import { LedgerEntry, IdentityRecord } from "../types/substrate-types";
import { IdentityEngine } from "../substrate/identity";

export type TrustStatus = "active" | "revoked" | "superseded";

export interface TrustRecord {
  identityId: string;
  status: TrustStatus;
  lastModified: number;
  revokedBy?: string;
  revokedAt?: number;
}

export class TrustStateLayer {
  private static trustIndex: Map<string, TrustRecord> = new Map();
  private static lastRebuildIndex: number = 0;

  // Rebuild trust state from ledger (deterministic replay)
  static rebuild(ledgerEntries: LedgerEntry[]): void {
    this.trustIndex.clear();
    
    for (let i = 0; i < ledgerEntries.length; i++) {
      const entry = ledgerEntries[i];
      const operation = entry.action.operation;
      const actor = entry.action.actor as IdentityRecord;
      
      // Process identity creation
      if (operation === "identity.create" || !this.trustIndex.has(actor.id)) {
        this.trustIndex.set(actor.id, {
          identityId: actor.id,
          status: "active",
          lastModified: entry.action.timestamp,
        });
      }
      
      // Process identity revocation
      if (operation === "identity.revoke" && entry.result.allowed) {
        const targetId = entry.action.payload?.targetId;
        if (targetId) {
          const record = this.trustIndex.get(targetId);
          if (record) {
            record.status = "revoked";
            record.revokedBy = actor.id;
            record.revokedAt = entry.action.timestamp;
            record.lastModified = entry.action.timestamp;
          }
        }
      }
    }
    
    this.lastRebuildIndex = ledgerEntries.length;
  }

  // Query current trust status
  static getTrustStatus(identityId: string): TrustStatus {
    const record = this.trustIndex.get(identityId);
    return record?.status || "active"; // Default to active if not in index
  }

  // Check if identity is currently trusted
  static isTrusted(identityId: string): boolean {
    return this.getTrustStatus(identityId) === "active";
  }

  // Get full trust record
  static getTrustRecord(identityId: string): TrustRecord | undefined {
    return this.trustIndex.get(identityId);
  }

  // Get all revoked identities
  static getRevokedIdentities(): TrustRecord[] {
    return Array.from(this.trustIndex.values()).filter(
      record => record.status === "revoked"
    );
  }

  // Get trust state snapshot (for consensus)
  static getSnapshot(): any {
    return {
      snapshotId: crypto.randomUUID(),
      upToLedgerIndex: this.lastRebuildIndex,
      trustIndexHash: this.computeTrustIndexHash(),
      trustRecords: Array.from(this.trustIndex.entries()),
      timestamp: Date.now(),
    };
  }

  // Compute deterministic hash of trust state
  private static computeTrustIndexHash(): string {
    const crypto = require("crypto");
    const records = Array.from(this.trustIndex.entries())
      .sort(([a], [b]) => a.localeCompare(b)); // Deterministic ordering
    
    return crypto
      .createHash("sha256")
      .update(JSON.stringify(records))
      .digest("hex");
  }

  // Evaluation modes
  static evaluateHistorical(identityId: string, atTimestamp: number): boolean {
    // Historical mode: Was this valid at the time?
    // Just checks if identity existed before that timestamp
    const record = this.trustIndex.get(identityId);
    if (!record) return false;
    
    // If revoked, check if revocation happened after the timestamp
    if (record.status === "revoked" && record.revokedAt) {
      return record.revokedAt > atTimestamp;
    }
    
    return true;
  }

  static evaluateCurrent(identityId: string): boolean {
    // Current trust mode: Is this identity trusted now?
    return this.isTrusted(identityId);
  }
}
