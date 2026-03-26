// Phase XI — Deterministic Substrate Kernel

import { SubstrateAction, SubstrateIdentity } from "../types/substrate-types";

export class SubstrateKernel {
  private static instance: SubstrateKernel;
  private substrateClock = Date.now();

  private constructor() {}

  static getInstance(): SubstrateKernel {
    if (!this.instance) this.instance = new SubstrateKernel();
    return this.instance;
  }

  getTimestamp(): number {
    return ++this.substrateClock; // deterministic monotonic clock
  }

  createAction(operation: string, payload: any, actor: SubstrateIdentity): SubstrateAction {
    return {
      actor,
      operation,
      payload,
      timestamp: this.getTimestamp(),
    };
  }
}
