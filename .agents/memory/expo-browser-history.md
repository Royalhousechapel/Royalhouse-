---
name: Expo browser history
description: Browser Back behavior for presentation screens inside the Expo tab navigator.
---

Use a distinct root Stack route for a screen that needs reliable browser Back navigation rather than treating a query-parameter change on the current tab as a new screen.

**Why:** pushing a new view query on the Home tab changed the URL but did not preserve the initial Home browser-history entry in this app. Browser Back exited the app. A distinct Events Stack route preserved Home and passed the same browser check.

**How to apply:** keep explicit in-app back controls, but also check browser Back from a clean history when introducing new presentation screens. Do not infer that a changed URL means a new history entry exists.
