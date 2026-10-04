import type { ChannelRule } from "../core/channel-rule"
import type { RulesRepository } from "../core/rules-repository"
import type { SettingsRepository } from "../core/settings-repository"
import { useHushfeedState } from "./use-hushfeed-state"

export interface PopupProps {
  rules: RulesRepository
  settings: SettingsRepository
}

export function Popup({ rules, settings }: PopupProps) {
  const state = useHushfeedState(rules, settings)

  if (state === null) {
    return <main className="popup" aria-busy="true" />
  }

  const hidden = sortByName(state.rules)

  const setEnabled = (enabled: boolean) => {
    settings.setEnabled(enabled).catch((error: unknown) => {
      console.error("Hushfeed: could not change filtering", error)
    })
  }

  const show = (rule: ChannelRule) => {
    rules.deleteRule(rule.channelKey).catch((error: unknown) => {
      console.error("Hushfeed: could not show the channel", error)
    })
  }

  return (
    <main className="popup">
      <header className="header">
        <h1 className="title">Hushfeed</h1>
        <label className="switch">
          <span className="switch-label">
            {state.enabled ? "Filtering on" : "Filtering off"}
          </span>
          <input
            type="checkbox"
            role="switch"
            checked={state.enabled}
            onChange={(event) => setEnabled(event.target.checked)}
          />
        </label>
      </header>

      {hidden.length === 0 ? (
        <p className="empty">
          No hidden channels yet. In your YouTube Subscriptions feed, hover over
          a video and choose <strong>Hide channel</strong>.
        </p>
      ) : (
        <section aria-labelledby="hidden-heading">
          <h2 id="hidden-heading" className="count">
            {hidden.length === 1
              ? "1 channel hidden"
              : `${hidden.length} channels hidden`}
          </h2>
          <ul className="channels">
            {hidden.map((rule) => (
              <li key={rule.channelKey} className="channel">
                <span className="channel-name" title={rule.channelKey}>
                  {rule.channelName}
                </span>
                <button
                  type="button"
                  className="show"
                  aria-label={`Show ${rule.channelName}`}
                  onClick={() => show(rule)}>
                  Show
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  )
}

function sortByName(rules: ChannelRule[]): ChannelRule[] {
  return [...rules].sort((a, b) =>
    a.channelName.localeCompare(b.channelName, undefined, {
      sensitivity: "base"
    })
  )
}
