# Phase XII — Trust State Layer
# Derived from Ledger, Materialized for Current Trust Evaluation

from typing import Dict, List
from dataclasses import dataclass

@dataclass
class TrustRecord:
    identity_id: str
    status: str  # "active" | "revoked" | "superseded"
    last_modified: int
    revoked_by: str = ""
    revoked_at: int = 0

class TrustState:
    """Trust state layer - derived from ledger"""
    
    def __init__(self):
        self.trust_index: Dict[str, TrustRecord] = {}
        self.last_rebuild_index = 0
    
    def rebuild(self, ledger) -> None:
        """Rebuild trust state from ledger (deterministic replay)"""
        self.trust_index.clear()
        
        for i, entry in enumerate(ledger.entries):
            operation = entry.get("operation", "")
            actor = entry.get("actor", {})
            actor_id = actor.get("id", "")
            
            # Process identity creation
            if actor_id and actor_id not in self.trust_index:
                self.trust_index[actor_id] = TrustRecord(
                    identity_id=actor_id,
                    status="active",
                    last_modified=entry.get("timestamp", 0)
                )
            
            # Process identity revocation
            if operation == "identity.revoke":
                target_id = entry.get("payload", {}).get("targetId", "")
                if target_id in self.trust_index:
                    record = self.trust_index[target_id]
                    record.status = "revoked"
                    record.revoked_by = actor_id
                    record.revoked_at = entry.get("timestamp", 0)
        
        self.last_rebuild_index = len(ledger.entries)
    
    def is_identity_valid(self, identity) -> bool:
        """Check if identity is currently trusted"""
        identity_id = identity.get("id", "")
        record = self.trust_index.get(identity_id)
        return record is not None and record.status == "active"
    
    def rebuild_if_needed(self, ledger) -> None:
        """Rebuild trust state if ledger has grown"""
        if len(ledger.entries) > self.last_rebuild_index:
            self.rebuild(ledger)
