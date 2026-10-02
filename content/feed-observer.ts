import type { FeedPlatform } from "../platform/feed-platform"

export interface ObserveFeedOptions {
  root: Element
  platform: FeedPlatform
  /** Called with each distinct card that appeared or changed. */
  onCards(cards: Element[]): void
}

/**
 * Reports feed cards as they appear or change, starting with the ones
 * already in `root`.
 *
 * The whole feed is never re-queried on a mutation. Each batch of mutation
 * records is reduced to the cards it touches: a node inside a card resolves
 * to that card with one `closest` lookup, and only nodes outside any card are
 * searched for cards they contain. A card touched several times in a batch
 * is reported once.
 */
export function observeFeed({
  root,
  platform,
  onCards
}: ObserveFeedOptions): () => void {
  const report = (nodes: Iterable<Node>) => {
    const cards = new Set<Element>()
    const searched = new Set<Element>()

    for (const node of nodes) {
      const element = node instanceof Element ? node : node.parentElement
      if (element === null || searched.has(element) || !element.isConnected) {
        continue
      }
      searched.add(element)

      const card = platform.cardOf(element)
      if (card !== null) {
        cards.add(card)
      } else if (node instanceof Element) {
        for (const found of platform.findCards(element)) {
          cards.add(found)
        }
      }
    }

    if (cards.size > 0) {
      onCards([...cards])
    }
  }

  const observer = new MutationObserver((records) => {
    report(
      records.flatMap((record) =>
        record.type === "childList" ? [...record.addedNodes] : [record.target]
      )
    )
  })
  observer.observe(root, {
    childList: true,
    subtree: true,
    attributes: platform.watchedAttributes.length > 0,
    attributeFilter:
      platform.watchedAttributes.length > 0
        ? platform.watchedAttributes
        : undefined
  })

  report([root])

  return () => observer.disconnect()
}
