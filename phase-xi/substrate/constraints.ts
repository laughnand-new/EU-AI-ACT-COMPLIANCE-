// Phase XI — Constraint Registry

export class ConstraintRegistry {
  private static constraints: Map<string, any> = new Map();

  static register(name: string, rule: any) {
    this.constraints.set(name, rule);
  }

  static get(name: string) {
    return this.constraints.get(name);
  }

  static list() {
    return Array.from(this.constraints.keys());
  }

  static enforce(name: string, data: any): boolean {
    const rule = this.get(name);
    if (!rule) return true; // No constraint = pass
    
    if (typeof rule === "function") {
      return rule(data);
    }
    
    return true;
  }
}
