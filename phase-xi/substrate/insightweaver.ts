// Phase XI — InsightWeaver Primitive (Deterministic Insight Engine)

export class InsightWeaver {
  static extractPatterns(input: any): any {
    // Deterministic pattern extraction
    const inputStr = JSON.stringify(input);
    
    return {
      summary: inputStr.slice(0, 200),
      features: Object.keys(input || {}),
      depth: this.calculateDepth(input),
      complexity: inputStr.length,
    };
  }

  static compressMeaning(input: any): string {
    return JSON.stringify(input).slice(0, 100);
  }

  private static calculateDepth(obj: any, depth = 0): number {
    if (typeof obj !== "object" || obj === null) return depth;
    return Math.max(
      depth,
      ...Object.values(obj).map((v) => this.calculateDepth(v, depth + 1))
    );
  }
}
