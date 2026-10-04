import type { ChannelRule } from "./channel-rule"
import {
  channelKeys,
  itemChannels,
  nameKey,
  normalizeChannelName,
  type ChannelRef,
  type FeedItem
} from "./feed-item"

export type FilterDecision = "show" | "hide"

export interface FilterEngine {
  evaluate(item: FeedItem): FilterDecision
}

export interface FilterState {
  enabled: boolean
  rules: readonly ChannelRule[]
}

/**
 * Builds an engine for one snapshot of the filter state. Rules are indexed
 * once, so evaluating a feed item is a few lookups, not a scan. Rebuild the
 * engine when the state changes.
 *
 * An item is hidden when any of its channels has a hide rule. A channel
 * matches a rule:
 * - by ID or handle, when it has them;
 * - by name, against rules created for a channel known by name only;
 * - when it is itself known by name only, by name against any rule's
 *   channel name.
 */
export function createFilterEngine({
  enabled,
  rules
}: FilterState): FilterEngine {
  if (!enabled) {
    return { evaluate: () => "show" }
  }

  const rulesByKey = new Map(rules.map((rule) => [rule.channelKey, rule]))
  const rulesByName = new Map(
    rules.map((rule) => [normalizeChannelName(rule.channelName), rule])
  )

  const ruleFor = (channel: ChannelRef): ChannelRule | undefined => {
    const keys = channelKeys(channel)
    if (keys.length === 0) {
      return rulesByName.get(normalizeChannelName(channel.name))
    }
    return [...keys, nameKey(channel.name)]
      .map((key) => rulesByKey.get(key))
      .find((found) => found !== undefined)
  }

  return {
    evaluate(item) {
      return itemChannels(item).some(
        (channel) => ruleFor(channel)?.mode === "hide"
      )
        ? "hide"
        : "show"
    }
  }
}
