/**
 * A channel, as far as the platform exposes it. Usually `id` or `handle` is
 * present. When neither is, the channel is known by its name only, as the
 * co-authors of a collaboration video on YouTube are.
 */
export interface ChannelRef {
  /** Stable channel ID, e.g. `UC…`. */
  id?: string
  /** Channel handle including the `@`, e.g. `@kurzgesagt`. */
  handle?: string
  /**
   * Display name. Used for matching only for channels known by name alone
   * (spec 001, collaboration videos).
   */
  name: string
}

/** A single item in a feed, independent of how the platform renders it. */
export interface FeedItem {
  id: string
  /** The channel that published the item. */
  channel: ChannelRef
  /** Further channels of a collaboration video. */
  collaborators?: ChannelRef[]
}

/** The publishing channel first, then any collaborators. */
export function itemChannels(item: FeedItem): ChannelRef[] {
  return [item.channel, ...(item.collaborators ?? [])]
}

/**
 * Keys a channel can be matched by: its ID and its handle, whichever exist.
 */
export function channelKeys(channel: ChannelRef): string[] {
  return [channel.id, channel.handle].filter(
    (key): key is string => key !== undefined && key !== ""
  )
}

/** Display names compare case- and whitespace-insensitively. */
export function normalizeChannelName(name: string): string {
  return name.normalize("NFC").trim().replace(/\s+/g, " ").toLowerCase()
}

/** Key of a rule for a channel known by name only. */
export function nameKey(name: string): string {
  return `name:${normalizeChannelName(name)}`
}

/**
 * The key a new rule is stored under: the ID when known, otherwise the
 * handle, otherwise the name (spec 001, channel identity).
 */
export function preferredChannelKey(channel: ChannelRef): string {
  const key = channelKeys(channel)[0]
  if (key !== undefined) {
    return key
  }
  if (normalizeChannelName(channel.name) === "") {
    throw new Error("Channel has neither an ID, a handle nor a name")
  }
  return nameKey(channel.name)
}

/** Everything that identifies what a feed item shows, as one string. */
export function itemIdentity(item: FeedItem): string {
  return [
    item.id,
    ...itemChannels(item).map((channel) =>
      [channel.id ?? "", channel.handle ?? "", channel.name].join("/")
    )
  ].join("|")
}
