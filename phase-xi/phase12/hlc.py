# Phase XII — Hybrid Logical Clock
# Deterministic, Monotonic, Causally-Ordered Timestamps

from dataclasses import dataclass
from datetime import datetime

@dataclass
class HLCTimestamp:
    """Hybrid Logical Clock timestamp"""
    physical: int  # Wall clock time (ms)
    logical: int   # Logical counter
    node_id: str   # Tie-breaker

class HybridLogicalClock:
    """Deterministic clock for distributed consensus"""
    
    def __init__(self, node_id: str):
        self.node_id = node_id
        self.physical = int(datetime.now().timestamp() * 1000)
        self.logical = 0
    
    def now(self) -> HLCTimestamp:
        """Get current HLC timestamp"""
        current_physical = int(datetime.now().timestamp() * 1000)
        
        if current_physical > self.physical:
            self.physical = current_physical
            self.logical = 0
        else:
            self.logical += 1
        
        return HLCTimestamp(
            physical=self.physical,
            logical=self.logical,
            node_id=self.node_id
        )
    
    def observe(self, received: HLCTimestamp) -> HLCTimestamp:
        """Update clock with received timestamp (causal ordering)"""
        current_physical = int(datetime.now().timestamp() * 1000)
        max_physical = max(current_physical, self.physical, received.physical)
        
        if max_physical == self.physical == received.physical:
            self.logical = max(self.logical, received.logical) + 1
        elif max_physical == self.physical:
            self.logical += 1
        elif max_physical == received.physical:
            self.logical = received.logical + 1
        else:
            self.logical = 0
        
        self.physical = max_physical
        return self.now()
    
    @staticmethod
    def compare(a: HLCTimestamp, b: HLCTimestamp) -> int:
        """Compare two timestamps (-1: a<b, 0: a==b, 1: a>b)"""
        if a.physical != b.physical:
            return -1 if a.physical < b.physical else 1
        if a.logical != b.logical:
            return -1 if a.logical < b.logical else 1
        if a.node_id != b.node_id:
            return -1 if a.node_id < b.node_id else 1
        return 0
