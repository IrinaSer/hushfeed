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
   * Attributes whose change means a card now shows a different item, e.g.
   * when the platform reuses a card element for another video.
   */
  watchedAttributes: string[]
}
