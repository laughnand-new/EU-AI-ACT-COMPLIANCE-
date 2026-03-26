// Phase XI — Substrate Types (Deterministic)

export type SubstrateIdentity = {
  id: string;                 // Deterministic identity token
  origin: "founder" | "system" | "client";
  createdAt: number;          // Substrate clock
  signature: string;          // Non-repudiable signature
};

export type ACIResult = {
  allowed: boolean;
  reason?: string;
};

export type SubstrateAction = {
  actor: SubstrateIdentity;
  operation: string;
  payload: any;
  timestamp: number;
};

export type LedgerEntry = {
  action: SubstrateAction;
  result: ACIResult;
  hash: string;
  previousHash: string | null;
};
