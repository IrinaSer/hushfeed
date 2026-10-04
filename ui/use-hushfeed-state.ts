import { useEffect, useState } from "react"

import type { ChannelRule } from "../core/channel-rule"
import type { RulesRepository } from "../core/rules-repository"
import type { SettingsRepository } from "../core/settings-repository"

export interface HushfeedState {
  enabled: boolean
  rules: ChannelRule[]
}

/**
 * The stored rules and on/off switch, kept current while the component is
 * mounted. `null` until the first read finishes.
 */
export function useHushfeedState(
  rules: RulesRepository,
  settings: SettingsRepository
): HushfeedState | null {
  const [state, setState] = useState<HushfeedState | null>(null)

  useEffect(() => {
    let latestRead = 0
    let active = true

    // Re-read both on any change: simple, and the popup is not a hot path.
    // Only the most recent read is applied, so an older one that resolves
    // late cannot overwrite newer state.
    const read = async () => {
      const id = ++latestRead
      try {
        const [enabled, storedRules] = await Promise.all([
          settings.isEnabled(),
          rules.getRules()
        ])
        if (active && id === latestRead) {
          setState({ enabled, rules: storedRules })
        }
      } catch (error) {
        console.error("Hushfeed: could not read settings", error)
      }
    }

    const unsubscribeRules = rules.subscribe(() => void read())
    const unsubscribeSettings = settings.subscribe(() => void read())
    void read()

    return () => {
      active = false
      unsubscribeRules()
      unsubscribeSettings()
    }
  }, [rules, settings])

  return state
}
