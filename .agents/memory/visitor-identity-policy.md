---
name: Visitor identity policy
description: Verified first-timer accounts, permanent membership approval, and duplicate-record safeguards.
---

First-timers use verified visitor accounts, not anonymous personal profiles. Church staff approve permanent membership on the same person record, preserving the original visitor ID. Becoming a member must never grant administrator access.

**Why:** The user selected verified visitor accounts and requested a temporary visitor identity followed by a permanent ID when committed to the church.

**How to apply:** Keep public church information available before sign-in. Require verified account ownership for personal registration and profile access. Treat visitor status as provisional; the user has not specified a timed access-expiry policy.

Duplicate checks must span self-registration, staff entry, edits, and branches. Repeated registration must return the existing person, including when staff created that record first.

**Why:** The user explicitly said someone already in the app or added by church staff must not sign up twice.

**How to apply:** Use normalized contact identities and database constraints as well as application checks. Only verified email ownership can claim a staff-added record; a name or unverified phone number is not proof of ownership. Do not silently merge people. Different people may share a name, and someone using completely different contact details still needs human review.

Unavailable media links must say “Coming soon,” without a fake URL or active empty button.

**Why:** The user chose “Coming soon” for media whose links they will provide later, and requested the real Royalhouse YouTube channel.

**How to apply:** Use verified official links when supplied or established from the church's official sources.
