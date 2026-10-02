import { preferredChannelKey, type ChannelRef } from "./feed-item"

/**
 * What to do with a channel's items. Spec 001 only hides; snooze and custom
 * rules extend this union in later specs.
 */
export type RuleMode = "hide"

export interface ChannelRule {
  /** Channel ID when known, otherwise the handle. */
  channelKey: string
  /** Display name at the time the rule was created, for the popup list. */
  channelName: string
  mode: RuleMode
}

export function hideChannelRule(channel: ChannelRef): ChannelRule {
  return {
    channelKey: preferredChannelKey(channel),
    channelName: channel.name,
    mode: "hide"
  }
}
