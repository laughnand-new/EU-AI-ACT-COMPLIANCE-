// Phase XII — Node Identity Model
// Nodes as substrate identities derived from founder root

import { IdentityEngine, FOUNDER_ID, IdentityRecord } from "../substrate/identity";
import crypto from "crypto";

export type NodeClass = "core" | "observer" | "gateway";

export interface NodeIdentity extends IdentityRecord {
  nodeClass: NodeClass;
  endpoint?: string;
  publicKey?: string;
}

export class NodeIdentityEngine {
  private static nodes: Map<string, NodeIdentity> = new Map();

  // Create node identity derived from founder
  static createNode(
    nodeClass: NodeClass,
    endpoint?: string
  ): NodeIdentity {
    const id = crypto.randomUUID();
    const createdAt = Date.now();
    const lineage = [FOUNDER_ID, "NODE", id];
    const signature = IdentityEngine.signLineage(lineage, createdAt);

    const nodeIdentity: NodeIdentity = {
      id,
      origin: "system" as const,
      createdAt,
      lineage,
      signature,
      revoked: false,
      nodeClass,
      endpoint,
    };

    this.nodes.set(id, nodeIdentity);
    return nodeIdentity;
  }

  // Get founder node (special case)
  static getFounderNode(): NodeIdentity {
    const founder = IdentityEngine.getFounderIdentity();
    return {
      ...founder,
      nodeClass: "core",
    };
  }

  // Verify node identity
  static verifyNode(node: NodeIdentity): boolean {
    return IdentityEngine.verify(node);
  }

  // Get node by ID
  static getNode(nodeId: string): NodeIdentity | undefined {
    return this.nodes.get(nodeId);
  }

  // Get all nodes by class
  static getNodesByClass(nodeClass: NodeClass): NodeIdentity[] {
    return Array.from(this.nodes.values()).filter(
      node => node.nodeClass === nodeClass && !node.revoked
    );
  }

  // Get core consensus nodes
  static getCoreNodes(): NodeIdentity[] {
    return this.getNodesByClass("core");
  }

  // Revoke node (founder only)
  static revokeNode(nodeId: string, revokedBy: string): boolean {
    if (revokedBy !== FOUNDER_ID) {
      throw new Error("Only founder can revoke nodes");
    }

    const node = this.nodes.get(nodeId);
    if (node) {
      node.revoked = true;
      return true;
    }

    return false;
  }

  // Get node lineage
  static getNodeLineage(node: NodeIdentity): string {
    return IdentityEngine.getLineageString(node);
  }
}
