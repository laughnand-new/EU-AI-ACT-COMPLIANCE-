// Phase XI — Execution Ledger (Reconstructibility Layer)

import { LedgerEntry, SubstrateAction, ACIResult } from "../types/substrate-types";
import crypto from "crypto";

export class Ledger {
  private static entries: LedgerEntry[] = [];

  static record(action: SubstrateAction, result: ACIResult): LedgerEntry {
    const previousHash = this.entries.length
      ? this.entries[this.entries.length - 1].hash
      : null;

    const hash = crypto
      .createHash("sha256")
      .update(JSON.stringify({ action, result, previousHash }))
      .digest("hex");

    const entry: LedgerEntry = { action, result, hash, previousHash };
    this.entries.push(entry);

    return entry;
  }

  static all(): LedgerEntry[] {
    return this.entries;
  }

  static verify(): boolean {
    for (let i = 0; i < this.entries.length; i++) {
      const entry = this.entries[i];
      const expectedPrevHash = i > 0 ? this.entries[i - 1].hash : null;
      
      if (entry.previousHash !== expectedPrevHash) {
        return false; // Chain broken
      }
    }
    return true;
  }

  static export(): string {
    return JSON.stringify(this.entries, null, 2);
  }
}
