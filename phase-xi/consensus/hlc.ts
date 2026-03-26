// Phase XII — Hybrid Logical Clock (HLC)
// Deterministic, monotonic, causally-ordered timestamps

export class HybridLogicalClock {
  private logicalTime: number = 0;
  private physicalTime: number = Date.now();
  private nodeId: string;

  constructor(nodeId: string) {
    this.nodeId = nodeId;
  }

  // Get current HLC timestamp
  now(): HLCTimestamp {
    const currentPhysical = Date.now();

    if (currentPhysical > this.physicalTime) {
      this.physicalTime = currentPhysical;
      this.logicalTime = 0;
    } else {
      this.logicalTime++;
    }

    return {
      physical: this.physicalTime,
      logical: this.logicalTime,
      nodeId: this.nodeId,
    };
  }

  // Update clock with received timestamp (causal ordering)
  update(received: HLCTimestamp): HLCTimestamp {
    const currentPhysical = Date.now();
    const maxPhysical = Math.max(
      currentPhysical,
      this.physicalTime,
      received.physical
    );

    if (maxPhysical === this.physicalTime && maxPhysical === received.physical) {
      this.logicalTime = Math.max(this.logicalTime, received.logical) + 1;
    } else if (maxPhysical === this.physicalTime) {
      this.logicalTime++;
    } else if (maxPhysical === received.physical) {
      this.logicalTime = received.logical + 1;
    } else {
      this.logicalTime = 0;
    }

    this.physicalTime = maxPhysical;

    return this.now();
  }

  // Compare two HLC timestamps
  static compare(a: HLCTimestamp, b: HLCTimestamp): number {
    if (a.physical !== b.physical) {
      return a.physical - b.physical;
    }
    if (a.logical !== b.logical) {
      return a.logical - b.logical;
    }
    return a.nodeId.localeCompare(b.nodeId);
  }

  // Check if a happened before b
  static happenedBefore(a: HLCTimestamp, b: HLCTimestamp): boolean {
    return this.compare(a, b) < 0;
  }

  // Serialize HLC timestamp
  static serialize(ts: HLCTimestamp): string {
    return `${ts.physical}-${ts.logical}-${ts.nodeId}`;
  }

  // Deserialize HLC timestamp
  static deserialize(serialized: string): HLCTimestamp {
    const [physical, logical, nodeId] = serialized.split("-");
    return {
      physical: parseInt(physical),
      logical: parseInt(logical),
      nodeId,
    };
  }
}

export interface HLCTimestamp {
  physical: number;  // Wall clock time
  logical: number;   // Logical counter
  nodeId: string;    // Tie-breaker
}
