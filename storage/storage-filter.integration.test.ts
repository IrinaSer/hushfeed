import { describe, expect, it } from "vitest"

import { hideChannelRule } from "../core/channel-rule"
import type { ChannelRef, FeedItem } from "../core/feed-item"
import { createFilterEngine, type FilterEngine } from "../core/filter-engine"
import { ChromeStorageRulesRepository } from "./chrome-rules-repository"
import { ChromeStorageSettingsRepository } from "./chrome-settings-repository"
import { FakeStorageArea } from "./fake-storage-area"

const channel: ChannelRef = { id: "UCaaa", handle: "@a", name: "Channel A" }
const video: FeedItem = { id: "video-1", channel }

/**
 * What the content script will do: keep an engine built from the latest
 * stored state and rebuild it on every change, without reading storage per
 * feed item.
 */
async function watchFilter(area: FakeStorageArea) {
  const rulesRepository = new ChromeStorageRulesRepository(area)
  const settingsRepository = new ChromeStorageSettingsRepository(area)
  let state = {
    rules: await rulesRepository.getRules(),
    enabled: await settingsRepository.isEnabled()
  }
  let engine: FilterEngine = createFilterEngine(state)

  rulesRepository.subscribe((rules) => {
    state = { ...state, rules }
    engine = createFilterEngine(state)
  })
  settingsRepository.subscribe((enabled) => {
    state = { ...state, enabled }
    engine = createFilterEngine(state)
  })

  return { evaluate: (item: FeedItem) => engine.evaluate(item) }
}

describe("storage → filter engine", () => {
  it("applies rules and the switch changed from another context", async () => {
    const area = new FakeStorageArea()
    const filter = await watchFilter(area)
    const popup = {
      rules: new ChromeStorageRulesRepository(area),
      settings: new ChromeStorageSettingsRepository(area)
    }

    expect(filter.evaluate(video)).toBe("show")

    await popup.rules.saveRule(hideChannelRule(channel))
    expect(filter.evaluate(video)).toBe("hide")

    await popup.settings.setEnabled(false)
    expect(filter.evaluate(video)).toBe("show")

    await popup.settings.setEnabled(true)
    expect(filter.evaluate(video)).toBe("hide")

    await popup.rules.deleteRule(channel.id!)
    expect(filter.evaluate(video)).toBe("show")
  })

  it("starts from previously stored state", async () => {
    const area = new FakeStorageArea()
    await new ChromeStorageRulesRepository(area).saveRule(
      hideChannelRule(channel)
    )

    const filter = await watchFilter(area)

    expect(filter.evaluate(video)).toBe("hide")
  })
})
