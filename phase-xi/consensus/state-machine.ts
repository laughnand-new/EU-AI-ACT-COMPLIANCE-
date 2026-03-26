// Phase XII — Consensus State Machine
// Propose → Vote → Commit → Apply → Recover

import { HybridLogicalClock, HLCTimestamp } from "./hlc";
import { NodeIdentityEngine, NodeIdentity } from "./node-identity";
import { TrustStateLayer } from "./trust-state";
import { ConsensusMessageFactory, ProposeActionMessage, VoteActionMessage } from "./message-types";
import { PhaseXISubstrateHardened } from "../substrate/substrate-hardened";
import { IdentityRecord } from "../types/substrate-types";
import { LedgerHardened } from "../substrate/ledger-hardened";

export type ConsensusPhase = "propose" | "vote" | "commit" | "apply";

export interface ActionProposal {
  actionId: string;
  operation: string;
  payload: any;
  actorIdentity: IdentityRecord;
  proposedBy: string;
  hlcTimestamp: HLCTimestamp;
  votes: Map<string, VoteActionMessage>;
  phase: ConsensusPhase;
}

export class ConsensusStateMachine {
  private hlc: HybridLogicalClock;
  private nodeIdentity: NodeIdentity;
  private proposals: Map<string, ActionProposal> = new Map();
  private quorumSize: number;

  constructor(nodeIdentity: NodeIdentity, quorumSize: number = 2) {
    this.nodeIdentity = nodeIdentity;
    this.hlc = new HybridLogicalClock(nodeIdentity.id);
    this.quorumSize = quorumSize;
  }

  // Step 1: Receive request and propose
  async proposeAction(
    operation: string,
    payload: any,
    actorIdentity: IdentityRecord
  ): Promise<ActionProposal> {
    const actionId = crypto.randomUUID();
    const hlcTimestamp = this.hlc.now();

    const proposal: ActionProposal = {
      actionId,
      operation,
      payload,
      actorIdentity,
      proposedBy: this.nodeIdentity.id,
      hlcTimestamp,
      votes: new Map(),
      phase: "propose",
    };

    this.proposals.set(actionId, proposal);

    // In production: broadcast to peers
    // For now: auto-vote locally
    await this.voteOnAction(actionId);

    return proposal;
  }

  // Step 2: Vote on proposal
  async voteOnAction(actionId: string): Promise<VoteActionMessage> {
    const proposal = this.proposals.get(actionId);
    if (!proposal) {
      throw new Error(`Action ${actionId} not found`);
    }

    // Verify actor identity
    if (!TrustStateLayer.isTrusted(proposal.actorIdentity.id)) {
      const vote = ConsensusMessageFactory.createVoteAction(
        actionId,
        this.nodeIdentity.id,
        "reject",
        "Actor identity not trusted"
      );
      proposal.votes.set(this.nodeIdentity.id, vote);
      return vote;
    }

    // Execute ACI check (deterministic)
    const result = PhaseXISubstrateHardened.execute(
      proposal.operation,
      proposal.payload,
      proposal.actorIdentity
    );

    const vote = ConsensusMessageFactory.createVoteAction(
      actionId,
      this.nodeIdentity.id,
      result.allowed ? "accept" : "reject",
      result.aciResult.reason
    );

    proposal.votes.set(this.nodeIdentity.id, vote);
    proposal.phase = "vote";

    // Check if quorum reached
    if (this.hasQuorum(proposal)) {
      await this.commitAction(actionId);
    }

    return vote;
  }

  // Step 3: Commit if quorum reached
  private async commitAction(actionId: string): Promise<void> {
    const proposal = this.proposals.get(actionId);
    if (!proposal) return;

    const acceptVotes = Array.from(proposal.votes.values()).filter(
      v => v.vote === "accept"
    );

    if (acceptVotes.length >= this.quorumSize) {
      proposal.phase = "commit";

      // Actually execute on substrate
      const result = PhaseXISubstrateHardened.execute(
        proposal.operation,
        proposal.payload,
        proposal.actorIdentity
      );

      proposal.phase = "apply";

      // Update trust state if needed
      if (proposal.operation.startsWith("identity.")) {
        TrustStateLayer.rebuild(LedgerHardened.all());
      }
    }
  }

  // Check if quorum reached
  private hasQuorum(proposal: ActionProposal): boolean {
    const acceptVotes = Array.from(proposal.votes.values()).filter(
      v => v.vote === "accept"
    );
    return acceptVotes.length >= this.quorumSize;
  }

  // Step 5: Recover/Replay
  async recover(): Promise<void> {
    // Rebuild trust state from ledger
    const ledger = LedgerHardened.all();
    TrustStateLayer.rebuild(ledger);
  }

  // Get consensus status
  getStatus(): any {
    return {
      nodeId: this.nodeIdentity.id,
      nodeClass: this.nodeIdentity.nodeClass,
      activeProposals: this.proposals.size,
      hlcTimestamp: this.hlc.now(),
      quorumSize: this.quorumSize,
    };
  }
}
