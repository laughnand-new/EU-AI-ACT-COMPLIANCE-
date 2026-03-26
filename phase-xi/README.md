# Phase XI Sovereign Substrate

## Genesis Implementation

**Phase XI is not an agent framework.**  
**Phase XI is not a workflow engine.**  
**Phase XI is not a toolchain.**

**Phase XI is the governance substrate that makes all of those things subordinate.**

---

## Architecture

### Substrate-First Design

Everything operates **within** the substrate, not **on top of** it:

- **Deterministic Kernel**: Monotonic clock, deterministic action creation
- **ACI Enforcement Boundary**: Non-bypassable permission system
- **Execution Ledger**: Blockchain-like reconstructibility
- **Identity System**: Cryptographically signed, substrate-native identities
- **Constraint Registry**: Substrate-level rule enforcement
- **InsightWeaver Primitive**: Deterministic pattern extraction

---

## Components

```
/substrate
  kernel.ts           - Deterministic substrate kernel
  identity.ts         - Substrate-native identity system
  aci.ts              - ACI enforcement boundary
  insightweaver.ts    - InsightWeaver primitive
  constraints.ts      - Constraint registry
  ledger.ts           - Execution ledger
  substrate.ts        - Substrate orchestrator

/api
  substrate-api.ts    - API surface

/types
  substrate-types.ts  - Type definitions
```

---

## Usage

### Installation

```bash
npm install
```

### Run Genesis Test

```bash
npm start
```

### Example: Founder Operation

```typescript
import { SubstrateAPI } from './api/substrate-api';

const result = SubstrateAPI.perform(
  "substrate.init",
  { data: "test" },
  "founder"
);

console.log(result.allowed); // true
console.log(result.ledgerEntry.hash); // deterministic hash
```

### Example: Blocked Operation

```typescript
const result = SubstrateAPI.perform(
  "substrate.modify",
  { data: "test" },
  "client" // clients cannot modify substrate
);

console.log(result.allowed); // false
console.log(result.aciResult.reason); // "Clients cannot modify substrate."
```

### Example: Insight Extraction

```typescript
const insights = SubstrateAPI.extractInsights({
  text: "Sample data",
  metadata: { complexity: 5 }
});

console.log(insights);
// {
//   summary: "...",
//   features: ["text", "metadata"],
//   depth: 2,
//   complexity: 42
// }
```

---

## Sovereignty Claims

1. **Non-Bypassable**: All operations must pass through ACI enforcement
2. **Deterministic**: Same inputs always produce same outputs
3. **Reconstructible**: Every action is ledgered with cryptographic hashing
4. **Substrate-Native**: Identity and permissions are substrate-level, not application-level

---

## Integration

### With FastAPI Backend

Create a Python wrapper:

```python
import subprocess
import json

def call_substrate(operation, payload, origin):
    result = subprocess.run(
        ['node', '-e', f'''
            const {{ SubstrateAPI }} = require('./phase-xi');
            const result = SubstrateAPI.perform("{operation}", {json.dumps(payload)}, "{origin}");
            console.log(JSON.stringify(result));
        '''],
        capture_output=True,
        text=True
    )
    return json.loads(result.stdout)
```

### With React Frontend

Create an API endpoint:

```typescript
// /api/substrate/execute
import { SubstrateAPI } from '@/phase-xi';

export async function POST(req: Request) {
  const { operation, payload, origin } = await req.json();
  const result = SubstrateAPI.perform(operation, payload, origin);
  return Response.json(result);
}
```

---

## Acquisition Posture

**This is not "another AI governance tool."**

This is:
- The substrate all AI must operate within
- The non-bypassable enforcement layer
- The deterministic governance boundary
- The sovereign control plane

**Phase XI controls the substrate. Everything else is downstream.**

---

## License

Proprietary - ApexForge Elite
