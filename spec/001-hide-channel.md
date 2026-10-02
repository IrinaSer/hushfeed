# 001 — Hide channel

**Status:** Draft

## Why

Subscriptions are binary: you are subscribed or you are not. A user who is tired of one channel has to unsubscribe to get it out of the feed, and loses the channel entirely.

Hushfeed lets the user keep the subscription and control the feed. This spec covers the first and smallest version of that: hide every video of a channel from the YouTube Subscriptions feed, reversibly.

The bar for this release: hiding a channel with Hushfeed must be easier than unsubscribing from it.

## Who

A desktop browser user subscribed to roughly 50–500 YouTube channels who uses the Subscriptions tab regularly and does not want to unsubscribe to reduce noise.

## What

### 1. Hide a channel from the feed

- On the YouTube Subscriptions feed, each video card offers a `Hide channel` action.
- Choosing it hides every card of that channel currently in the feed, and every card of that channel that loads later (scroll, in-app navigation, reload).
- The user never opens extension settings, searches for a channel or copies a URL to hide it.

### 2. Undo

- Right after hiding, a notice appears on the page: `Channel hidden` with an `Undo` action.
- `Undo` removes the rule and brings the channel's cards back without a page reload.

### 3. Popup

- Shows whether filtering is on, and a toggle to turn it on or off.
- Shows how many channels are hidden.
- Lists hidden channels by name, each with a `Show` action that removes the rule.
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
- **pnpm is the package manager.** `pnpm-lock.yaml` is the only lockfile.
- **Hiding is not destructive.** Cards are hidden, not removed from the DOM, so that undo and toggle-off work without a reload.

## Out of scope

Snooze; per-channel rules (Shorts, livestreams, duration); keyword filtering; categories; options page; import/export; statistics; onboarding screens; YouTube pages other than the Subscriptions feed; other platforms; other browsers; monetisation.

## Slices

1. **Domain core.** Feed item and rule models, filter engine, rules repository interface with an in-memory implementation, unit tests. No browser code.
2. **Storage.** `chrome.storage.local` implementation of the repository, on/off state, change notifications.
3. **Hide on the feed.** Content script on the Subscriptions feed: detect cards, extract the channel, apply stored rules to current and newly loaded cards. Rules are seeded by hand at this point.
4. **Hide action and undo.** `Hide channel` on the card, the notice, `Undo`.
5. **Popup.** On/off toggle, hidden count, hidden channels list with `Show`, empty state. Replaces the scaffold popup.
6. **Permissions and metadata.** Narrow host permissions, fix `author` in `package.json`.

## Acceptance criteria

- [ ] Hiding a channel from a card removes all of its cards from the Subscriptions feed.
- [ ] Cards of a hidden channel that load on scroll are hidden.
- [ ] A hidden channel stays hidden after a reload and after in-app navigation away and back.
- [ ] `Undo` restores the channel's cards without a reload.
- [ ] `Show` in the popup restores the channel in an open Subscriptions tab without a reload.
- [ ] Turning filtering off shows all cards; turning it on hides them again; rules survive both.
- [ ] Cards of channels without a rule are never hidden.
- [ ] The filter engine has unit tests for: hidden channel, unrelated channel, filtering off.
- [ ] The manifest requests no host access beyond YouTube.

## Open questions

1. **Where does `Hide channel` live?** Injected into YouTube's own `⋮` card menu, or a Hushfeed button of its own on the card (e.g. shown on hover)? The native menu is the more natural place but is the most fragile against YouTube markup changes.
2. **Channel identity.** Rules should be keyed by the stable channel ID (`UC…`). Feed cards may expose only the handle link (`/@handle`). To be verified on the live page in slice 3; if only the handle is available, do we key by handle?
3. **Shorts shelf.** The Subscriptions feed has a separate Shorts shelf. Does hiding a channel hide its Shorts there too, or only regular video cards in v0.1?
4. **Toolchain.** The repo is scaffolded with Plasmo (React, MV3). Stay on Plasmo, or move to plain Vite?
5. **Tests.** Vitest for unit tests? Is an E2E test against live YouTube in scope for 001, or a later spec?
6. **Popup list.** All hidden channels, or only the most recent ones with a link to a full list (which would need the out-of-scope options page)?
