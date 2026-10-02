import type { FeedItem } from "../core/feed-item"
import type { FeedPlatform } from "../platform/feed-platform"

/**
 * A platform with trivial markup, for tests:
 * `<div data-card data-video="v1" data-channel="@a" data-name="A">`.
 * A card without `data-channel` is not filled in yet.
 */
export const fakePlatform: FeedPlatform & { parsed: number } = {
  parsed: 0,
  findCards(root) {
    const cards = [...root.querySelectorAll("[data-card]")]
    return root.matches("[data-card]") ? [root, ...cards] : cards
  },
  cardOf(node) {
    return node.closest("[data-card]")
  },
  parseCard(card): FeedItem | null {
    fakePlatform.parsed += 1
    const handle = card.getAttribute("data-channel")
    const id = card.getAttribute("data-video")
    if (handle === null || id === null) {
      return null
    }
    return {
      id,
      channel: { handle, name: card.getAttribute("data-name") ?? handle }
    }
  },
  watchedAttributes: ["data-video", "data-channel"]
}

export function card(video: string, channel?: string): string {
  const channelAttribute =
    channel === undefined ? "" : ` data-channel="${channel}"`
  return `<div data-card data-video="${video}"${channelAttribute}><span>${video}</span></div>`
}

/** Lets pending MutationObserver callbacks and promises run. */
export function flush(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0))
}
