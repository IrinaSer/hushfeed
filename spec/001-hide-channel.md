# 001 — Hide channel

**Status:** In progress

## Why

Subscriptions are binary: you are subscribed or you are not. A user who is tired of one channel has to unsubscribe to get it out of the feed, and loses the channel entirely.

Hushfeed lets the user keep the subscription and control the feed. This spec covers the first and smallest version of that: hide every video of a channel from the YouTube Subscriptions feed, reversibly.

The bar for this release: hiding a channel with Hushfeed must be easier than unsubscribing from it.

## Who

A desktop browser user subscribed to roughly 50–500 YouTube channels who uses the Subscriptions tab regularly and does not want to unsubscribe to reduce noise.

## What

### 1. Hide a channel from the feed

- On the YouTube Subscriptions feed, each video card shows a Hushfeed `Hide channel` button on hover. It is Hushfeed's own button, not an item injected into YouTube's `⋮` menu.
- This applies to regular video cards. Shorts are out of scope: a Short card in the feed names no channel (see Out of scope).
- A collaboration video (several channels) is hidden when any of its channels is hidden. Its `Hide channel` hides the publishing channel, the first one named.
- Choosing it hides every card of that channel currently in the feed, and every card of that channel that loads later (scroll, in-app navigation, reload).
- The user never opens extension settings, searches for a channel or copies a URL to hide it.

### 2. Undo

- Right after hiding, a notice appears on the page: `Channel hidden` with an `Undo` action.
- `Undo` removes the rule and brings the channel's cards back without a page reload.

### 3. Popup

- Shows whether filtering is on, and a toggle to turn it on or off.
- Shows how many channels are hidden.
- Lists all hidden channels by name, scrollable when long, each with a `Show` action that removes the rule.
- With no hidden channels, shows an empty state that says how to hide one.

### 4. Global on/off

- With filtering off, no card is hidden and the `Hide channel` action is not offered. Rules are kept.
- Turning it back on applies the existing rules again.
- Toggling takes effect on open YouTube tabs without a reload.

## Constraints

- **Local only.** Rules and the on/off state live in `chrome.storage.local`. No account, backend, sync or analytics. Nothing leaves the browser.
- **Minimal permissions.** The extension requests access to YouTube only, plus `storage`. The scaffold's `https://*/*` host permission is removed.
- **Domain logic is independent of the DOM.** The decision "show or hide this feed item" is a pure function of a feed item and the stored rules. It knows nothing about YouTube markup and is unit-tested.
- **YouTube markup is isolated.** Selectors and card parsing live in one YouTube-specific module, so that a markup change on YouTube is fixed in one place.
- **Storage sits behind a repository interface.** The rest of the code does not call `chrome.storage` directly.
- **No per-card storage lookups.** Rules are cached in the content script and refreshed when storage changes.
- **Feed observation does not rescan.** New cards are processed once as they appear; the whole feed is not re-queried on every DOM mutation.
- **Channel identity.** A rule is keyed by the channel ID (`UC…`) when the card exposes it, otherwise by the handle (`/@handle`). Verified on the live feed in slice 3: a video card links to its channel as `/@handle`, or as `/channel/UC…` for channels without a handle, never both. So in practice rules are keyed by handle, and by ID only for channels without one. Handles are decoded and lowercased, since YouTube treats them case-insensitively and percent-encodes non-Latin ones. A collaboration card names its channels as plain text, with no handle or ID, so those channels are matched by display name (case- and whitespace-insensitive), and `Hide channel` on one stores a rule keyed by the publisher's name; that rule also hides the channel's own videos, whose cards carry both handle and name. Two channels with the same display name, or a renamed channel, can be matched wrongly; accepted as the only signal the feed gives.
- **Toolchain.** Plasmo (React, MV3), as scaffolded. pnpm is the package manager; `pnpm-lock.yaml` is the only lockfile.
- **Tests.** Unit and integration tests run on Vitest. End-to-end tests run on Playwright against the built extension and real YouTube. The Subscriptions feed needs a signed-in account, so they run locally under a dedicated test account in a persistent Playwright browser profile that is never committed. They are not part of the required `build` check, since CI cannot sign in.
- **Hiding is not destructive.** Cards are hidden, not removed from the DOM, so that undo and toggle-off work without a reload.

## Out of scope

Shorts in the Subscriptions feed: their cards link only to `/shorts/<id>` and carry no channel, so attributing them needs an extra lookup per Short (verified in slice 3; a separate spec); snooze; per-channel rules (Shorts, livestreams, duration); keyword filtering; categories; options page; import/export; statistics; onboarding screens; YouTube pages other than the Subscriptions feed; other platforms; other browsers; monetisation.

## Slices

1. **Domain core.** Feed item and rule models, filter engine, rules repository interface with an in-memory implementation, unit tests. No browser code.
2. **Storage.** `chrome.storage.local` implementation of the repository, on/off state, change notifications.
3. **Hide on the feed.** Content script on the Subscriptions feed: detect video cards, extract the channel, apply stored rules to current and newly loaded cards. Rules are seeded by hand at this point.
4. **Hide action and undo.** `Hide channel` on the card, the notice, `Undo`.
5. **Popup.** On/off toggle, hidden count, hidden channels list with `Show`, empty state. Replaces the scaffold popup.
6. **Permissions.** Narrow host permissions to YouTube.
7. **End-to-end tests.** Playwright scenarios: hide → reload → still hidden; hide → undo → visible again.

## Acceptance criteria

- [x] Hiding a channel from a card removes all of its cards from the Subscriptions feed.
- [x] Cards of a hidden channel that load on scroll are hidden.
- [x] A hidden channel stays hidden after a reload and after in-app navigation away and back.
- [ ] `Undo` restores the channel's cards without a reload.
- [x] `Show` in the popup restores the channel in an open Subscriptions tab without a reload.
- [x] Turning filtering off shows all cards; turning it on hides them again; rules survive both.
- [x] Cards of channels without a rule are never hidden.
- [x] A collaboration video is hidden when any of its channels is hidden, and offers `Hide channel` for its publisher.
- [x] The filter engine has unit tests for: hidden channel, unrelated channel, filtering off.
- [x] The manifest requests no host access beyond YouTube.
- [ ] The end-to-end scenarios of slice 7 pass.
