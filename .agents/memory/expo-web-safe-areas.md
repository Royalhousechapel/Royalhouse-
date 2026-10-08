---
name: Expo web safe areas
description: Why Expo single-page web exports need the public HTML template for notch-aware viewport metadata.
---

For Expo single-page web output, customize viewport metadata through the public HTML template, not the Router's `+html` component.

**Why:** The current Expo single-page exporter ignores `app/+html.tsx` and generates its SPA document from the public template or the CLI default. The default viewport omits `viewport-fit=cover`, which is needed for browser safe-area environment values on notched phones.

**How to apply:** Preserve the template's root element and React Native web height/scroll reset. Let Expo inject generated scripts and styles; never hard-code bundle hashes. Verify the exported document's viewport metadata after rebuilding rather than assuming a typed `+html` component affected it.
