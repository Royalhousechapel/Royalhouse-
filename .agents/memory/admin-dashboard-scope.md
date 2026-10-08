---
name: Admin dashboard scope
description: Product rule for exposing role modules in Royalhouse administration.
---

Only make a role module available when it is backed by real shared records and server-enforced actions. Departments without a persisted domain workflow should use their real department task queue rather than fabricated counts or placeholder actions.

**Why:** The requested role previews must reflect real data and enforce permissions; this app does not yet have persisted records for every department's domain.

**How to apply:** Before adding a module to the role catalog or default role seeds, confirm the module has shared storage, API authorization, and working actions. Otherwise keep that department on the task queue until the domain workflow exists.
