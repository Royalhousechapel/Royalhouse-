---
name: OpenAPI UUID compatibility
description: Compatibility constraint between this workspace's OpenAPI generator and its installed Zod version.
---

When generating the shared Zod client in this workspace, UUID-shaped identifiers must remain plain OpenAPI strings rather than using `format: uuid`.

**Why:** The installed Zod 3 runtime does not expose the top-level `zod.uuid()` helper emitted by the current generator for UUID-formatted schemas, so code generation succeeds but the library typecheck fails.

**How to apply:** If UUID validation is needed later, add a compatible refinement in a hand-authored runtime boundary or upgrade the workspace's Zod/generator pair together; do not reintroduce `format: uuid` alone.