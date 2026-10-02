// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { card, fakePlatform, flush } from "./fake-platform"
import { observeFeed } from "./feed-observer"

describe("observeFeed", () => {
  let root: HTMLElement
  let stop: () => void

  beforeEach(() => {
    root = document.createElement("main")
    document.body.append(root)
  })

  afterEach(() => {
    stop?.()
    root.remove()
  })

  function videosOf(cards: Element[]): (string | null)[] {
    return cards.map((element) => element.getAttribute("data-video"))
  }

  it("reports the cards already in the feed", () => {
    root.innerHTML = card("v1", "@a") + card("v2", "@b")
    const onCards = vi.fn()

    stop = observeFeed({ root, platform: fakePlatform, onCards })

    expect(onCards).toHaveBeenCalledTimes(1)
    expect(videosOf(onCards.mock.calls[0][0])).toEqual(["v1", "v2"])
  })

  it("reports cards added later, in one batch per mutation callback", async () => {
    const onCards = vi.fn()
    stop = observeFeed({ root, platform: fakePlatform, onCards })

    const section = document.createElement("section")
    section.innerHTML = card("v1", "@a") + card("v2", "@b")
    root.append(section)
    root.insertAdjacentHTML("beforeend", card("v3", "@c"))
    await flush()

    expect(onCards).toHaveBeenCalledTimes(1)
    expect(videosOf(onCards.mock.calls[0][0])).toEqual(["v1", "v2", "v3"])
  })

  it("reports a card once when several of its nodes change together", async () => {
    root.innerHTML = card("v1")
    const onCards = vi.fn()
    stop = observeFeed({ root, platform: fakePlatform, onCards })
    onCards.mockClear()

    const element = root.querySelector("[data-card]")!
    element.setAttribute("data-channel", "@a")
    element.append(document.createElement("img"))
    element.querySelector("span")!.textContent = "filled in"
    await flush()

    expect(onCards).toHaveBeenCalledTimes(1)
    expect(videosOf(onCards.mock.calls[0][0])).toEqual(["v1"])
  })

  it("reports a card reused for another video", async () => {
    root.innerHTML = card("v1", "@a")
    const onCards = vi.fn()
    stop = observeFeed({ root, platform: fakePlatform, onCards })
    onCards.mockClear()

    root.querySelector("[data-card]")!.setAttribute("data-video", "v9")
    await flush()

    expect(videosOf(onCards.mock.calls[0][0])).toEqual(["v9"])
  })

  it("ignores changes outside cards that add no cards", async () => {
    const onCards = vi.fn()
    stop = observeFeed({ root, platform: fakePlatform, onCards })

    root.append(document.createElement("div"))
    root.setAttribute("data-video", "not-a-card")
    await flush()

    expect(onCards).not.toHaveBeenCalled()
  })

  it("stops reporting after it is stopped", async () => {
    const onCards = vi.fn()
    stop = observeFeed({ root, platform: fakePlatform, onCards })

    stop()
    root.innerHTML = card("v1", "@a")
    await flush()

    expect(onCards).not.toHaveBeenCalled()
  })
})
