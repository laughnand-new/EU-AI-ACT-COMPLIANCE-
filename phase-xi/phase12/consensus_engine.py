# Phase XII — Deterministic Consensus Engine (Skeleton)
# Sovereign Governance Fabric

from dataclasses import dataclass
from enum import Enum
from typing import Dict, List, Optional
from .hlc import HybridLogicalClock, HLCTimestamp
from .ledger import Ledger
from .trust_state import TrustState
from .messages import (
    ProposeAction,
    VoteAction,
    CommitAction,
    SyncLedger,
    TrustStateSnapshot,
    NodeHeartbeat
)

class NodeRole(Enum):
    PROPOSER = "proposer"
    VOTER = "voter"
    OBSERVER = "observer"

@dataclass
class NodeIdentity:
    node_id: str
    lineage: List[str]
    signature: str
    revoked: bool = False

class ConsensusEngine:
    """Phase XII Deterministic Consensus Engine"""
    
    def __init__(self, node_identity: NodeIdentity, role: NodeRole, peers: List[str]):
        self.identity = node_identity
        self.role = role
        self.peers = peers
        
        self.hlc = HybridLogicalClock(node_identity.node_id)
        self.ledger = Ledger()
        self.trust_state = TrustState()
        
        self.pending_votes: Dict[str, List[VoteAction]] = {}
    
    # -------------------------
    # PROPOSAL PIPELINE
    # -------------------------
    def propose_action(self, operation: str, payload: dict, actor_identity) -> Optional[ProposeAction]:
        """Propose an action for consensus"""
        if self.role != NodeRole.PROPOSER:
            return None
        
        timestamp = self.hlc.now()
        msg = ProposeAction(
            action_id=self._generate_action_id(),
            operation=operation,
            payload=payload,
            actor_identity=actor_identity,
            hlc_timestamp=timestamp
        )
        self._broadcast(msg)
        return msg
    
    # -------------------------
    # VOTING PIPELINE
    # -------------------------
    def handle_propose(self, msg: ProposeAction) -> VoteAction:
        """Handle proposal and cast vote"""
        if self.role == NodeRole.OBSERVER:
            return VoteAction(msg.action_id, self.identity.node_id, "abstain")
        
        # Identity + ACI + trust-state checks
        if not self.trust_state.is_identity_valid(msg.actor_identity):
            vote = VoteAction(msg.action_id, self.identity.node_id, "reject", "invalid identity")
        else:
            vote = VoteAction(msg.action_id, self.identity.node_id, "accept")
        
        self._broadcast(vote)
        return vote
    
    def handle_vote(self, msg: VoteAction) -> None:
        """Handle vote and check for quorum"""
        votes = self.pending_votes.setdefault(msg.action_id, [])
        votes.append(msg)
        
        if self._has_quorum(votes):
            self._commit_action(msg.action_id)
    
    # -------------------------
    # COMMIT PIPELINE
    # -------------------------
    def _commit_action(self, action_id: str) -> None:
        """Commit action to ledger after quorum"""
        entry = self.ledger.commit(action_id)
        commit_msg = CommitAction(action_id, entry["index"], entry["hash"])
        self._broadcast(commit_msg)
        
        # Rebuild trust-state if identity/governance action
        if entry.get("is_governance_action"):
            self.trust_state.rebuild(self.ledger)
    
    def handle_commit(self, msg: CommitAction) -> None:
        """Handle commit from peer"""
        self.ledger.apply_commit(msg)
        self.trust_state.rebuild_if_needed(self.ledger)
    
    # -------------------------
    # LEDGER SYNC
    # -------------------------
    def handle_sync_ledger(self, msg: SyncLedger) -> None:
        """Handle ledger sync request"""
        missing = self.ledger.get_missing_entries(msg.from_index)
        # Send missing entries back to requester
        # Implementation depends on network layer
    
    # -------------------------
    # HEARTBEAT
    # -------------------------
    def handle_heartbeat(self, msg: NodeHeartbeat) -> None:
        """Handle heartbeat from peer"""
        self.hlc.observe(msg.hlc_timestamp)
    
    # -------------------------
    # INTERNAL UTILITIES
    # -------------------------
    def _broadcast(self, msg) -> None:
        """Broadcast message to peers (network layer placeholder)"""
        # TODO: Implement network layer
        pass
    
    def _has_quorum(self, votes: List[VoteAction]) -> bool:
        """Check if quorum reached"""
        accepts = [v for v in votes if v.vote == "accept"]
        return len(accepts) >= self._quorum_size()
    
    def _quorum_size(self) -> int:
        """Calculate required quorum size"""
        return (len(self.peers) // 2) + 1
    
    def _generate_action_id(self) -> str:
        """Generate deterministic action ID"""
        timestamp = self.hlc.now()
        return f"act-{timestamp.physical}-{timestamp.logical}-{timestamp.node_id}"
    
    def get_status(self) -> dict:
        """Get consensus engine status"""
        return {
            "node_id": self.identity.node_id,
            "role": self.role.value,
            "peers": len(self.peers),
            "ledger_size": len(self.ledger.entries),
            "pending_votes": len(self.pending_votes),
            "trust_index_size": len(self.trust_state.trust_index)
        }
