import type { ChannelRef, FeedItem } from "../../core/feed-item"
import type { FeedPlatform } from "../feed-platform"
import { createYouTubeGridLayout } from "./youtube-grid-layout"

/**
 * YouTube markup, verified on the Subscriptions feed (October 2026):
 *
 * - every card, regular video or Short, is a `ytd-rich-item-renderer`;
 * - a regular video card links to `/watch?v=<id>` and to its channel, as
 *   `/@handle` or, for channels without a handle, `/channel/UC…`;
 * - a Short card links to `/shorts/<id>` only and names no channel;
 * - a collaboration video card has an avatar stack instead of one avatar
 *   and no channel link: the channels are plain text in the metadata row,
 *   publisher first, e.g. `Vsevsad` and `и CookingTime` ("and", localised).
 *
 * Content scripts see the DOM only, not YouTube's page data, so the channel
 * comes from these links and texts.
 */
const CARD = "ytd-rich-item-renderer"
const VIDEO_LINK = 'a[href^="/watch?"], a[href^="/shorts/"]'
const CHANNEL_LINK = 'a[href^="/@"], a[href^="/channel/UC"]'
const COLLAB_AVATARS = "yt-avatar-stack-view-model"
const METADATA_ROW = ".ytContentMetadataViewModelMetadataRow"
const METADATA_TEXT = ".ytContentMetadataViewModelMetadataText"

export const youtubePlatform: FeedPlatform = {
  findCards(root) {
    return root.matches(CARD) ? [root] : [...root.querySelectorAll(CARD)]
  },

  cardOf(node) {
    return node.closest(CARD)
  },

  parseCard(card): FeedItem | null {
    const videoHref = card.querySelector(VIDEO_LINK)?.getAttribute("href")
    const id = videoHref ? parseVideoId(videoHref) : null
    if (id === null) {
      return null
    }

    const channelLink = card.querySelector(CHANNEL_LINK)
    if (channelLink !== null) {
      const channel = parseChannelLink(
        channelLink.getAttribute("href") ?? "",
        channelLink.textContent ?? ""
      )
      return channel === null ? null : { id, channel }
    }

    if (card.querySelector(COLLAB_AVATARS) !== null) {
      const [channel, ...collaborators] = parseCollaborators(card)
      return channel === undefined ? null : { id, channel, collaborators }
    }

    return null
  },

  actionAnchor(card) {
    return card.querySelector(":scope > #content") ?? card
  },

  watchedAttributes: ["href"],

  createLayout: createYouTubeGridLayout
}

export function parseVideoId(href: string): string | null {
  const url = new URL(href, "https://www.youtube.com")
  if (url.pathname === "/watch") {
    return url.searchParams.get("v") || null
  }
  const short = /^\/shorts\/([^/]+)/.exec(url.pathname)
  return short ? short[1] : null
}

/**
 * Reads a channel link. Handles are case-insensitive on YouTube and may be
 * percent-encoded (non-Latin handles), so they are decoded and lowercased to
 * get one key per channel.
 */
export function parseChannelLink(
  href: string,
  text: string
): ChannelRef | null {
  const path = new URL(href, "https://www.youtube.com").pathname
  const name = text.trim()

  const handle = /^\/(@[^/]+)/.exec(path)
  if (handle) {
    const key = safeDecode(handle[1]).toLowerCase()
    return { handle: key, name: name || key }
  }

  const id = /^\/channel\/(UC[\w-]+)/.exec(path)
  if (id) {
    return { id: id[1], name: name || id[1] }
  }

  return null
}

/**
 * Reads the channel names of a collaboration card: the leading texts of the
 * metadata row, up to the first one with an `aria-label` (views, date). Every
 * name after the first starts with a localised "and", which is dropped.
 */
export function parseCollaborators(card: Element): ChannelRef[] {
  const row = card.querySelector(METADATA_ROW)
  if (row === null) {
    return []
  }
  const names: string[] = []
  for (const text of row.querySelectorAll(METADATA_TEXT)) {
    if (text.hasAttribute("aria-label")) {
      break
    }
    const content = (text.textContent ?? "").trim()
    const name =
      names.length === 0 ? content : content.replace(/^\S+\s+/, "").trim()
    if (name !== "") {
      names.push(name)
    }
  }
  return names.map((name) => ({ name }))
}

function safeDecode(value: string): string {
  try {
    return decodeURIComponent(value)
  } catch {
    return value
  }
}

/** The Subscriptions feed page, once YouTube has rendered it. */
export function findSubscriptionsFeed(document: Document): Element | null {
  return document.querySelector('ytd-browse[page-subtype="subscriptions"]')
}

/**
 * Calls `listener` after every in-app navigation. YouTube is a single-page
 * app and dispatches this event when a page has been rendered, including the
 * first one.
 */
export function onYouTubeNavigation(
  document: Document,
  listener: () => void
): () => void {
  document.addEventListener("yt-navigate-finish", listener)
  return () => document.removeEventListener("yt-navigate-finish", listener)
}
