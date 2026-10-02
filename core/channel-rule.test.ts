import { describe, expect, it } from "vitest"

import { hideChannelRule } from "./channel-rule"

describe("hideChannelRule", () => {
  it("keys the rule by channel ID when it is known", () => {
    expect(
      hideChannelRule({ id: "UC123", handle: "@channel", name: "Channel" })
    ).toEqual({ channelKey: "UC123", channelName: "Channel", mode: "hide" })
  })

  it("falls back to the handle when the ID is unknown", () => {
    expect(hideChannelRule({ handle: "@channel", name: "Channel" })).toEqual({
      channelKey: "@channel",
      channelName: "Channel",
      mode: "hide"
    })
  })

  it("rejects a channel with neither ID nor handle", () => {
    expect(() => hideChannelRule({ name: "Channel" })).toThrow()
  })
})
