import type { ChannelRule } from "./channel-rule"

export type Unsubscribe = () => void

/**
 * Where channel rules are kept. The rest of the code depends on this
 * interface, never on a concrete storage API.
 */
export interface RulesRepository {
  getRules(): Promise<ChannelRule[]>
  /** Adds the rule, or replaces the rule with the same `channelKey`. */
  saveRule(rule: ChannelRule): Promise<void>
  /** Removes the rule for the channel. Does nothing if there is none. */
  deleteRule(channelKey: string): Promise<void>
  /** Calls `listener` with the full rule list after every change. */
  subscribe(listener: (rules: ChannelRule[]) => void): Unsubscribe
}

/** Keeps rules in memory. For tests and as a reference implementation. */
export class InMemoryRulesRepository implements RulesRepository {
  private readonly rules = new Map<string, ChannelRule>()
  private readonly listeners = new Set<(rules: ChannelRule[]) => void>()

  constructor(initialRules: readonly ChannelRule[] = []) {
    for (const rule of initialRules) {
      this.rules.set(rule.channelKey, { ...rule })
    }
  }

  async getRules(): Promise<ChannelRule[]> {
    return this.snapshot()
  }

  async saveRule(rule: ChannelRule): Promise<void> {
    this.rules.set(rule.channelKey, { ...rule })
    this.notify()
  }

  async deleteRule(channelKey: string): Promise<void> {
    if (this.rules.delete(channelKey)) {
      this.notify()
    }
  }

  subscribe(listener: (rules: ChannelRule[]) => void): Unsubscribe {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  private snapshot(): ChannelRule[] {
    return [...this.rules.values()].map((rule) => ({ ...rule }))
  }

  private notify(): void {
    for (const listener of this.listeners) {
      listener(this.snapshot())
    }
  }
}
