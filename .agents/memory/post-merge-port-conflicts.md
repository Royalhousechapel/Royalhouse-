---
name: Post-merge port conflicts
description: Recognize stale artifact server processes after workflow reconciliation.
---

After a merge, an EADDRINUSE failure can mean an old artifact server survived reconciliation, not that the app has a code or port configuration defect.

**Why:** both managed services built successfully but their replacement processes could not bind while older servers still occupied their assigned ports.

**How to apply:** identify the listener and verify its process command and artifact working directory before stopping it. Restart the existing managed workflow afterward; do not change ports or create duplicate workflows to work around a stale process.
