---
name: OpenAPI and Zod 3 codegen
description: Compatibility constraints between this workspace's OpenAPI generator and its installed Zod version.
---

When generating the shared Zod client in this workspace, UUID-shaped identifiers must remain plain OpenAPI strings rather than using `format: uuid`. Avoid OpenAPI `format: email` too; express email checks with a compatible regex pattern. OpenAPI integer fields should use `type: number` with this generator/Zod pairing, and request component names should not collide with generated runtime validator names.

**Why:** The installed Zod 3 runtime does not expose the top-level `zod.uuid()`, `zod.email()`, or `zod.int()` helpers emitted by the current generator for these formats and integer fields, so code generation succeeds but the library typecheck fails.

**How to apply:** If UUID or email validation is needed later, use a compatible hand-authored refinement or regex at the runtime boundary, or upgrade the workspace's Zod/generator pair together; do not reintroduce unsupported formats alone. For integer-valued fields, use `type: number` with `multipleOf: 1` when an integer constraint is needed. Prefer distinct request schema names such as `*Request` when the same names would also be emitted as TypeScript interfaces.

Keep generated validation-bound constants before the schemas that reference them.

**Why:** Orval's split Zod output can place shared length/pattern bounds after their first use, causing type errors and temporal-dead-zone failures despite successful generation.

**How to apply:** Preserve generation-time ordering repair and the actual validation limits. Never repair generated files by hand or remove limits merely to make generation pass.