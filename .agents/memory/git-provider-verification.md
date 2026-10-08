---
name: Git provider verification
description: Distinguish reported GitHub connection health from actual CLI write access.
---

Verify actual Git write access before claiming a GitHub connection can push. Public repository reads and healthy OAuth metadata do not establish that.

**Why:** the provider reported active/healthy while the CLI rejected push authentication; attachment and reconnect tools also disagreed about connection state.

**How to apply:** use the documented authorization recovery flow once after an authentication failure. If attachment/reconnect actions themselves disagree or fail, report the blocker and use the Git pane rather than repeatedly reconnecting or requesting credentials in chat.
