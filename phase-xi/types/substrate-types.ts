// Phase XI — Substrate Types (Deterministic)

export type SubstrateIdentity = {
  id: string;                 // Deterministic identity token
  origin: "founder" | "system" | "client";
  createdAt: number;          // Substrate clock
  signature: string;          // Non-repudiable signature
  lineage?: string[];         // Ancestry chain (hardened identity)
  revoked?: boolean;          // Revocation status
};

export type IdentityRecord = {
  id: string;
  origin: "founder" | "system" | "client";
  createdAt: number;
  lineage: string[];
  signature: string;
  revoked: boolean;
};

export type ACIResult = {
  allowed: boolean;
  reason?: string;
  enforcedBy?: string;        // Which rule enforced this
};

export type SubstrateAction = {
  actor: SubstrateIdentity | IdentityRecord;
  operation: string;
  payload: any;
  timestamp: number;
};

export type LedgerEntry = {
  action: SubstrateAction;
  result: ACIResult;
  hash: string;
  previousHash: string | null;
  identityLineage?: string;   // Embedded identity lineage
};
