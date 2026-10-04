import type { FeedItem } from "../core/feed-item"

/**
 * Everything Hushfeed needs to know about one platform's feed markup. The
 * rest of the content script works through this interface only, so a markup
 * change on the platform is fixed in its implementation alone.
 */
export interface FeedPlatform {
  /** Feed cards inside `root`, including `root` itself if it is one. */
  findCards(root: Element): Element[]
  /** The card that contains `node`, or `null` when it is not inside one. */
  cardOf(node: Element): Element | null
  /**
   * Reads a card into a feed item. Returns `null` while the card is not
   * filled in yet; it is read again on its next change.
   */
  parseCard(card: Element): FeedItem | null
  /**
   * The element inside a card that Hushfeed's own controls are added to. It
   * should cover the card's thumbnail, whose top-right corner holds the
   * `Hide channel` button.
   */
  actionAnchor(card: Element): Element
  /**
   * Attributes whose change means a card now shows a different item, e.g.
   * when the platform reuses a card element for another video.
   */
  watchedAttributes: string[]
  /**
   * Optional fix-ups for the platform's layout, for when hiding cards breaks
   * it. Created once per feed root.
   */
  createLayout?(root: Element): FeedLayout
}

export interface FeedLayout {
  /** Called after card visibility may have changed. */
  update(isHidden: (card: Element) => boolean): void
  /** Undoes every change the layout made. */
  dispose(): void
}
