// Phase XII — Consensus Message Types
// Raft/PBFT-style deterministic consensus

import { IdentityRecord } from "../types/substrate-types";

export type MessageType =
  | "PROPOSE_ACTION"
  | "VOTE_ACTION"
  | "COMMIT_ACTION"
  | "SYNC_LEDGER"
  | "TRUST_STATE_SNAPSHOT"
  | "NODE_HEARTBEAT";

export interface ConsensusMessage {
  messageId: string;
  messageType: MessageType;
  nodeId: string;
  hlcTimestamp: number;
  signature: string;
  payload: any;
}

export interface ProposeActionMessage {
  actionId: string;
  operation: string;
  payload: any;
  actorIdentity: IdentityRecord;
  hlcTimestamp: number;
}

export interface VoteActionMessage {
  actionId: string;
  nodeId: string;
  vote: "accept" | "reject";
  reason?: string;
}

export interface CommitActionMessage {
  actionId: string;
  ledgerIndex: number;
  hash: string;
}

export interface SyncLedgerMessage {
  fromIndex: number;
  toIndex: number;
}

export interface TrustStateSnapshotMessage {
  snapshotId: string;
  upToLedgerIndex: number;
  trustIndexHash: string;
}

export interface NodeHeartbeatMessage {
  nodeId: string;
  hlcTimestamp: number;
  health: "healthy" | "degraded" | "failed";
  latestLedgerIndex: number;
}

export class ConsensusMessageFactory {
  static createProposeAction(
    actionId: string,
    operation: string,
    payload: any,
    actorIdentity: IdentityRecord,
    hlcTimestamp: number
  ): ProposeActionMessage {
    return {
      actionId,
      operation,
      payload,
      actorIdentity,
      hlcTimestamp,
    };
  }

  static createVoteAction(
    actionId: string,
    nodeId: string,
    vote: "accept" | "reject",
    reason?: string
  ): VoteActionMessage {
    return {
      actionId,
      nodeId,
      vote,
      reason,
    };
  }

  static createCommitAction(
    actionId: string,
    ledgerIndex: number,
    hash: string
  ): CommitActionMessage {
    return {
      actionId,
      ledgerIndex,
      hash,
    };
  }

  static createSyncLedger(
    fromIndex: number,
    toIndex: number
  ): SyncLedgerMessage {
    return {
      fromIndex,
      toIndex,
    };
  }

  static createTrustStateSnapshot(
    snapshotId: string,
    upToLedgerIndex: number,
    trustIndexHash: string
  ): TrustStateSnapshotMessage {
    return {
      snapshotId,
      upToLedgerIndex,
      trustIndexHash,
    };
  }

  static createNodeHeartbeat(
    nodeId: string,
    hlcTimestamp: number,
    health: "healthy" | "degraded" | "failed",
    latestLedgerIndex: number
  ): NodeHeartbeatMessage {
    return {
      nodeId,
      hlcTimestamp,
      health,
      latestLedgerIndex,
    };
  }
}
