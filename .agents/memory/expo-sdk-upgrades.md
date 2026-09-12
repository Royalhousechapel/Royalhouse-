---
name: Expo SDK upgrade constraints
description: Workspace-specific constraints encountered when upgrading the Royalhouse Expo app.
---

Expo SDK upgrades in this workspace must respect the root pnpm minimum release-age policy. If a trusted Expo package is published inside the 24-hour window, add only that exact package to `minimumReleaseAgeExclude` and remove the exception after the window passes.

**Why:** SDK 57’s required `expo-glass-effect` patch was newer than the workspace’s supply-chain protection window, so a normal Expo-managed install could not complete.

**How to apply:** Run Expo’s compatibility fixer from the mobile package, keep React versions consistent across the workspace, and re-run Expo Doctor, TypeScript, and a preview export. SDK 57 also uses the `NativeTabs.Trigger.Icon` / `NativeTabs.Trigger.Label` API and TypeScript 6 may require `ignoreDeprecations: "6.0"` when `baseUrl` is retained.