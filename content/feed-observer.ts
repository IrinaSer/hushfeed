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
 * searched for cards they contain. Attribute changes and removals outside a
 * card are ignored. A card touched several times in a batch is reported once.
 */
export function observeFeed({
  root,
  platform,
  onCards
}: ObserveFeedOptions): () => void {
  /**
   * `added` nodes may bring new cards and are searched when outside a card;
   * `changed` nodes (attribute changes, removals) only matter inside a card.
   */
  const report = (added: Iterable<Node>, changed: Iterable<Node> = []) => {
    const cards = new Set<Element>()
    const visited = new Set<Element>()

    const visit = (node: Node, search: boolean) => {
      const element = node instanceof Element ? node : node.parentElement
      if (element === null || visited.has(element) || !element.isConnected) {
        return
      }
      visited.add(element)

      const card = platform.cardOf(element)
      if (card !== null) {
        cards.add(card)
      } else if (search && node instanceof Element) {
        for (const found of platform.findCards(element)) {
          cards.add(found)
        }
      }
    }

    for (const node of added) {
      visit(node, true)
    }
    for (const node of changed) {
      visit(node, false)
    }

    if (cards.size > 0) {
      onCards([...cards])
    }
  }

  const observer = new MutationObserver((records) => {
    const added: Node[] = []
    const changed: Node[] = []
    for (const record of records) {
      if (record.type === "childList") {
        added.push(...record.addedNodes)
        if (record.removedNodes.length > 0) {
          changed.push(record.target)
        }
      } else {
        changed.push(record.target)
      }
    }
    report(added, changed)
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
