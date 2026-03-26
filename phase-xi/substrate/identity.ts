// Phase XI — Substrate-Native Identity

import { SubstrateIdentity } from "../types/substrate-types";
import crypto from "crypto";

export class Identity {
  static create(origin: "founder" | "system" | "client"): SubstrateIdentity {
    const id = crypto.randomUUID();
    const createdAt = Date.now();
    const signature = this.sign(id + createdAt);

    return { id, origin, createdAt, signature };
  }

  static sign(data: string): string {
    return crypto.createHash("sha256").update(data).digest("hex");
  }

  static verify(identity: SubstrateIdentity): boolean {
    const expected = this.sign(identity.id + identity.createdAt);
    return expected === identity.signature;
  }
}
