/**
 * The channel a feed item belongs to, as far as the platform exposes it.
 * At least one of `id` and `handle` is present.
 */
export interface ChannelRef {
  /** Stable channel ID, e.g. `UC…`. */
  id?: string
  /** Channel handle including the `@`, e.g. `@kurzgesagt`. */
  handle?: string
  /** Display name, for UI only. Never used for matching. */
  name: string
}

/** A single item in a feed, independent of how the platform renders it. */
export interface FeedItem {
  id: string
  channel: ChannelRef
}

/**
 * Keys a channel can be matched by: its ID and its handle, whichever exist.
 */
export function channelKeys(channel: ChannelRef): string[] {
  return [channel.id, channel.handle].filter(
    (key): key is string => key !== undefined && key !== ""
  )
}

/**
 * The key a new rule is stored under: the ID when known, otherwise the
 * handle (spec 001, channel identity).
 */
export function preferredChannelKey(channel: ChannelRef): string {
  const key = channelKeys(channel)[0]
  if (key === undefined) {
    throw new Error(`Channel "${channel.name}" has neither an ID nor a handle`)
  }
  return key
}
