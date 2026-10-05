import { describe, expect, it } from "vitest"

import { hideChannelRule, type ChannelRule } from "./channel-rule"
import type { ChannelRef, FeedItem } from "./feed-item"
import { createFilterEngine } from "./filter-engine"

const kurzgesagt: ChannelRef = {
  id: "UCsXVk37bltHxD1rDPwtNM8Q",
  handle: "@kurzgesagt",
  name: "Kurzgesagt"
}
const fireship: ChannelRef = {
  id: "UCsBjURrPoezykLs9EqgamOA",
  handle: "@Fireship",
  name: "Fireship"
}

function item(channel: ChannelRef, id = "video-1"): FeedItem {
  return { id, channel }
}

function engine(rules: ChannelRule[], enabled = true) {
  return createFilterEngine({ enabled, rules })
}

describe("createFilterEngine", () => {
  it("hides items from a hidden channel", () => {
    const filter = engine([hideChannelRule(kurzgesagt)])

    expect(filter.evaluate(item(kurzgesagt))).toBe("hide")
    expect(filter.evaluate(item(kurzgesagt, "video-2"))).toBe("hide")
  })

  it("shows items from unrelated channels", () => {
    const filter = engine([hideChannelRule(kurzgesagt)])

    expect(filter.evaluate(item(fireship))).toBe("show")
  })

  it("shows everything when there are no rules", () => {
    expect(engine([]).evaluate(item(kurzgesagt))).toBe("show")
  })

  it("shows everything when filtering is off, keeping the rules", () => {
    const rules = [hideChannelRule(kurzgesagt)]

    expect(engine(rules, false).evaluate(item(kurzgesagt))).toBe("show")
    expect(engine(rules, true).evaluate(item(kurzgesagt))).toBe("hide")
  })

  describe("channel identity", () => {
    it("matches a rule stored by ID when the item exposes only the ID", () => {
      const filter = engine([hideChannelRule(kurzgesagt)])

      expect(
        filter.evaluate(item({ id: kurzgesagt.id, name: "Kurzgesagt" }))
      ).toBe("hide")
    })

    it("matches a rule stored by handle when the item exposes only the handle", () => {
      const filter = engine([
        hideChannelRule({ handle: "@kurzgesagt", name: "Kurzgesagt" })
      ])

      expect(
        filter.evaluate(item({ handle: "@kurzgesagt", name: "Kurzgesagt" }))
      ).toBe("hide")
    })

    it("matches a rule stored by handle when the item exposes both", () => {
      const filter = engine([
        hideChannelRule({ handle: "@kurzgesagt", name: "Kurzgesagt" })
      ])

      expect(filter.evaluate(item(kurzgesagt))).toBe("hide")
    })

    it("does not match a channel with a handle by another channel's name", () => {
      const filter = engine([
        hideChannelRule({ handle: "@kurzgesagt", name: "Kurzgesagt" })
      ])

      expect(
        filter.evaluate(item({ handle: "@someone-else", name: "Kurzgesagt" }))
      ).toBe("show")
    })
  })

  describe("collaboration videos", () => {
    const collab = (...names: string[]): FeedItem => ({
      id: "collab-1",
      channel: { name: names[0] },
      collaborators: names.slice(1).map((name) => ({ name }))
    })

    it("hides a collaboration when its publisher is hidden by name", () => {
      const filter = engine([hideChannelRule(kurzgesagt)])

      expect(filter.evaluate(collab("Kurzgesagt", "Fireship"))).toBe("hide")
    })

    it("hides a collaboration when any collaborator is hidden", () => {
      const filter = engine([hideChannelRule(fireship)])

      expect(filter.evaluate(collab("Kurzgesagt", "Fireship"))).toBe("hide")
    })

    it("matches names regardless of case and spacing", () => {
      const filter = engine([hideChannelRule(fireship)])

      expect(filter.evaluate(collab("Someone", "  fireSHIP "))).toBe("hide")
    })

    it("shows a collaboration of channels that are not hidden", () => {
      const filter = engine([hideChannelRule(fireship)])

      expect(filter.evaluate(collab("Kurzgesagt", "Veritasium"))).toBe("show")
    })

    it("lets a rule created from a collaboration hide the channel's own videos", () => {
      const filter = engine([hideChannelRule({ name: "Kurzgesagt" })])

      expect(filter.evaluate(item(kurzgesagt))).toBe("hide")
      expect(filter.evaluate(collab("Kurzgesagt", "Fireship"))).toBe("hide")
      expect(filter.evaluate(item(fireship))).toBe("show")
    })

    it("shows collaborations when filtering is off", () => {
      const filter = engine([hideChannelRule(fireship)], false)

      expect(filter.evaluate(collab("Kurzgesagt", "Fireship"))).toBe("show")
    })
  })
})
