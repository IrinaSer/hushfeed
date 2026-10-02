import type { ChannelRule } from "../core/channel-rule"
import type { RulesRepository, Unsubscribe } from "../core/rules-repository"
import { onKeyChanged, STORAGE_KEYS, type StorageArea } from "./storage-area"

/** Stored shape: rules by channel key, so a channel has at most one rule. */
type StoredRules = Record<string, ChannelRule>

/**
 * Keeps rules in an extension storage area (`chrome.storage.local` in the
 * extension). Changes made from any extension context — popup, content
 * script — reach every subscriber.
 */
export class ChromeStorageRulesRepository implements RulesRepository {
  /** Serialises this instance's read-modify-write cycles. */
  private pending: Promise<unknown> = Promise.resolve()

  constructor(private readonly area: StorageArea) {}

  async getRules(): Promise<ChannelRule[]> {
    return Object.values(await this.read())
  }

  saveRule(rule: ChannelRule): Promise<void> {
    return this.update((rules) => ({ ...rules, [rule.channelKey]: rule }))
  }

  deleteRule(channelKey: string): Promise<void> {
    return this.update((rules) => {
      if (!(channelKey in rules)) {
        return undefined
      }
      const { [channelKey]: _deleted, ...rest } = rules
      return rest
    })
  }

  subscribe(listener: (rules: ChannelRule[]) => void): Unsubscribe {
    return onKeyChanged(this.area, STORAGE_KEYS.rules, (value) =>
      listener(Object.values(parseRules(value)))
    )
  }

  private async read(): Promise<StoredRules> {
    const items = await this.area.get(STORAGE_KEYS.rules)
    return parseRules(items[STORAGE_KEYS.rules])
  }

  /** `change` returns the new rules, or `undefined` to write nothing. */
  private update(
    change: (rules: StoredRules) => StoredRules | undefined
  ): Promise<void> {
    const next = this.pending.then(async () => {
      const updated = change(await this.read())
      if (updated !== undefined) {
        await this.area.set({ [STORAGE_KEYS.rules]: updated })
      }
    })
    this.pending = next.catch(() => undefined)
    return next
  }
}

/** Reads stored rules defensively, dropping entries that are not valid. */
function parseRules(value: unknown): StoredRules {
  if (typeof value !== "object" || value === null) {
    return {}
  }
  const rules: StoredRules = {}
  for (const [key, rule] of Object.entries(value)) {
    if (isChannelRule(rule) && rule.channelKey === key) {
      rules[key] = rule
    }
  }
  return rules
}

function isChannelRule(value: unknown): value is ChannelRule {
  if (typeof value !== "object" || value === null) {
    return false
  }
  const rule = value as Record<string, unknown>
  return (
    typeof rule.channelKey === "string" &&
    rule.channelKey !== "" &&
    typeof rule.channelName === "string" &&
    rule.mode === "hide"
  )
}
