# Phase XII — Consensus Message Types
# Deterministic, Identity-Aware, HLC-Ordered

from dataclasses import dataclass
from typing import Any, Dict, List

@dataclass
class ProposeAction:
    """Proposal to execute an action"""
    action_id: str
    operation: str
    payload: Dict[str, Any]
    actor_identity: Any  # IdentityRecord
    hlc_timestamp: Any  # HLCTimestamp

@dataclass
class VoteAction:
    """Vote on a proposed action"""
    action_id: str
    node_id: str
    vote: str  # "accept" | "reject"
    reason: str = ""

@dataclass
class CommitAction:
    """Commit accepted action to ledger"""
    action_id: str
    ledger_index: int
    hash: str

@dataclass
class SyncLedger:
    """Request ledger synchronization"""
    from_index: int
    to_index: int
    requesting_node: str

@dataclass
class TrustStateSnapshot:
    """Trust state snapshot for consensus"""
    snapshot_id: str
    up_to_ledger_index: int
    trust_index_hash: str

@dataclass
class NodeHeartbeat:
    """Node health and status"""
    node_id: str
    hlc_timestamp: Any  # HLCTimestamp
    health: str  # "healthy" | "degraded" | "failed"
    latest_ledger_index: int
