---
name: Private Expo preview limit
description: Replit private-preview restrictions for this mobile artifact.
---

Replit private mobile previews are not supported in Expo Go, simulators, or the Replit mobile app. Managed Expo CLI authentication can fix a CLI sign-in mismatch, but does not remove this private-preview restriction.

**Why:** private native preview support is a platform limitation independent of application authentication.

**How to apply:** use the Replit browser-based web preview to inspect the UI. For native-device testing, use a supported setup that is not this private preview; never ask the user to share Expo credentials in chat.

For presentation reliability, a successful web export may be served as the browser preview while preserving a separate native development command.

**Why:** SDK-aligned packages and a passing web export did not guarantee that Metro's live development bundle could resolve pnpm-linked dependencies in this environment.

**How to apply:** verify the actual browser screen, not just the export result. Do not represent the browser fallback as a fix for Expo Go, and do not change project privacy without consent.
