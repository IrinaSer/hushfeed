// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it } from "vitest"

import type { ChannelRule } from "../core/channel-rule"
import { InMemoryRulesRepository } from "../core/rules-repository"
import { InMemorySettingsRepository } from "../core/settings-repository"
import { isCardHidden } from "./card-visibility"
import { card, fakePlatform, flush } from "./fake-platform"
import { startFeedFilter } from "./feed-filter"

const hideA: ChannelRule = { channelKey: "@a", channelName: "A", mode: "hide" }

describe("startFeedFilter", () => {
  let root: HTMLElement
  let rules: InMemoryRulesRepository
  let settings: InMemorySettingsRepository
  let stop: (() => void) | undefined

  beforeEach(() => {
    root = document.createElement("main")
    document.body.append(root)
    rules = new InMemoryRulesRepository()
    settings = new InMemorySettingsRepository()
  })

  afterEach(() => {
    stop?.()
    stop = undefined
    root.remove()
  })

  async function start() {
    stop = await startFeedFilter({
      root,
      platform: fakePlatform,
      rules,
      settings
    })
  }

  function hidden(): (string | null)[] {
    return fakePlatform
      .findCards(root)
      .filter(isCardHidden)
      .map((element) => element.getAttribute("data-video"))
  }

  it("hides cards of hidden channels already on the page", async () => {
    await rules.saveRule(hideA)
    root.innerHTML = card("v1", "@a") + card("v2", "@b") + card("v3", "@a")

    await start()

    expect(hidden()).toEqual(["v1", "v3"])
  })

  it("hides cards of hidden channels that load later", async () => {
    await rules.saveRule(hideA)
    await start()

    root.insertAdjacentHTML("beforeend", card("v1", "@a") + card("v2", "@b"))
    await flush()

    expect(hidden()).toEqual(["v1"])
  })

  it("hides a card once it is filled in", async () => {
    await rules.saveRule(hideA)
    root.innerHTML = card("v1")
    await start()
    expect(hidden()).toEqual([])

    root.querySelector("[data-card]")!.setAttribute("data-channel", "@a")
    await flush()

    expect(hidden()).toEqual(["v1"])
  })

  it("re-evaluates a card reused for another channel", async () => {
    await rules.saveRule(hideA)
    root.innerHTML = card("v1", "@a")
    await start()

    const element = root.querySelector("[data-card]")!
    element.setAttribute("data-video", "v2")
    element.setAttribute("data-channel", "@b")
    await flush()

    expect(hidden()).toEqual([])
  })

  it("applies rule changes to cards on the page without a reload", async () => {
    root.innerHTML = card("v1", "@a") + card("v2", "@b")
    await start()

    await rules.saveRule(hideA)
    expect(hidden()).toEqual(["v1"])

    await rules.deleteRule(hideA.channelKey)
    expect(hidden()).toEqual([])
  })

  it("shows everything while filtering is off and hides again when on", async () => {
    await rules.saveRule(hideA)
    root.innerHTML = card("v1", "@a")
    await start()

    await settings.setEnabled(false)
    expect(hidden()).toEqual([])

    await settings.setEnabled(true)
    expect(hidden()).toEqual(["v1"])
  })

  it("starts with filtering off when it was turned off", async () => {
    await rules.saveRule(hideA)
    await settings.setEnabled(false)
    root.innerHTML = card("v1", "@a")

    await start()

    expect(hidden()).toEqual([])
  })

  it("does not re-read cards that did not change", async () => {
    root.innerHTML = card("v1", "@a") + card("v2", "@b")
    await start()
    fakePlatform.parsed = 0

    root.append(document.createElement("div"))
    root.querySelector("span")!.textContent = "re-rendered"
    await flush()

    expect(fakePlatform.parsed).toBe(1)
  })

  it("keeps a change notified while starting", async () => {
    root.innerHTML = card("v1", "@a")
    const starting = startFeedFilter({
      root,
      platform: fakePlatform,
      rules,
      settings
    })
    await rules.saveRule(hideA)
    stop = await starting

    expect(hidden()).toEqual(["v1"])
  })

  it("shows all cards and stops filtering when stopped", async () => {
    await rules.saveRule(hideA)
    root.innerHTML = card("v1", "@a")
    await start()

    stop!()
    stop = undefined
    root.insertAdjacentHTML("beforeend", card("v2", "@a"))
    await flush()

    expect(hidden()).toEqual([])
    expect(document.getElementById("hushfeed-style")).toBeNull()
  })
})
