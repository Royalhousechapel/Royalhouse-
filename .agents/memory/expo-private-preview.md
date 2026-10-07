---
name: Private Expo preview limit
description: Replit private-preview restrictions for this mobile artifact.
---

Replit private mobile previews are not supported in Expo Go, simulators, or the Replit mobile app. An Expo Go QR-code sign-in mismatch is therefore not fixable by changing the app's source or restarting Metro.

**Why:** the private Replit preview identity is not a normal Expo CLI login that the user can authenticate from the app code.

**How to apply:** use the Replit browser-based web preview to inspect the UI. For native-device testing, use a supported setup that is not this private preview; never ask the user to share Expo credentials in chat.
