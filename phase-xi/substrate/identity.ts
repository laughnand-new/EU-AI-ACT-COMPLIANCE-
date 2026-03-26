// Phase XI — Hardened Identity Engine
// Sovereign Identity System (Founder: Laughnand)

import crypto from "crypto";

export const FOUNDER_ID = "Laughnand";

// Identity Types
export type IdentityRecord = {
  id: string;
  origin: "founder" | "system" | "client";
  createdAt: number;
  lineage: string[];        // ancestry chain
  signature: string;        // deterministic signature
  revoked: boolean;
};

// In-memory revocation registry (can be replaced with substrate storage)
const revokedIdentities = new Set<string>();

export class IdentityEngine {

  // Create identity with deterministic lineage
  static createIdentity(origin: "system" | "client"): IdentityRecord {
    const id = crypto.randomUUID();
    const createdAt = Date.now();

    const lineage = [FOUNDER_ID, origin.toUpperCase(), id];

    const signature = this.signLineage(lineage, createdAt);

    return {
      id,
      origin,
      createdAt,
      lineage,
      signature,
      revoked: false,
    };
  }

  // Founder identity (immutable)
  static getFounderIdentity(): IdentityRecord {
    const createdAt = 0; // genesis timestamp
    const lineage = [FOUNDER_ID];

    return {
      id: FOUNDER_ID,
      origin: "founder",
      createdAt,
      lineage,
      signature: this.signLineage(lineage, createdAt),
      revoked: false,
    };
  }

  // Deterministic signature using lineage + timestamp
  static signLineage(lineage: string[], timestamp: number): string {
    const data = lineage.join("::") + "::" + timestamp;
    return crypto.createHash("sha256").update(data).digest("hex");
  }

  // Verify identity integrity
  static verify(identity: IdentityRecord): boolean {
    if (identity.revoked) return false;
    if (revokedIdentities.has(identity.id)) return false;

    const expected = this.signLineage(identity.lineage, identity.createdAt);
    return expected === identity.signature;
  }

  // Founder-only revocation
  static revokeIdentity(targetId: string, actorId: string): boolean {
    if (actorId !== FOUNDER_ID) {
      throw new Error("Only founder can revoke identities.");
    }
    
    if (targetId === FOUNDER_ID) {
      throw new Error("Founder identity cannot be revoked.");
    }

    revokedIdentities.add(targetId);
    return true;
  }

  // Check revocation status
  static isRevoked(id: string): boolean {
    return revokedIdentities.has(id);
  }

  // Substrate-native session token
  static createSessionToken(identity: IdentityRecord): string {
    if (identity.revoked || this.isRevoked(identity.id)) {
      throw new Error("Identity revoked.");
    }

    const payload = `${identity.id}::${identity.signature}::${Date.now()}`;
    return crypto.createHash("sha256").update(payload).digest("hex");
  }

  // Verify session token
  static verifySessionToken(token: string, identity: IdentityRecord): boolean {
    // In production, store token-to-identity mapping
    // For now, verify identity is valid
    return this.verify(identity) && !this.isRevoked(identity.id);
  }

  // Get identity lineage as string
  static getLineageString(identity: IdentityRecord): string {
    return identity.lineage.join(" → ");
  }
}

// Backward compatibility with old Identity class
export class Identity {
  static create(origin: "founder" | "system" | "client"): IdentityRecord {
    if (origin === "founder") {
      return IdentityEngine.getFounderIdentity();
    }
    return IdentityEngine.createIdentity(origin);
  }

  static verify(identity: IdentityRecord): boolean {
    return IdentityEngine.verify(identity);
  }
}
