import type { ChannelRule } from "./channel-rule"
import { channelKeys, type FeedItem } from "./feed-item"

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
 * once, so evaluating a feed item is a lookup, not a scan. Rebuild the engine
 * when the state changes.
 */
export function createFilterEngine({
  enabled,
  rules
}: FilterState): FilterEngine {
  if (!enabled) {
    return { evaluate: () => "show" }
  }

  const rulesByKey = new Map(rules.map((rule) => [rule.channelKey, rule]))

  return {
    evaluate(item) {
      const rule = channelKeys(item.channel)
        .map((key) => rulesByKey.get(key))
        .find((found) => found !== undefined)

      return rule?.mode === "hide" ? "hide" : "show"
    }
  }
}
