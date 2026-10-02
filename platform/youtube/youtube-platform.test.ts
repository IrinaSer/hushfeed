// @vitest-environment happy-dom
import { describe, expect, it } from "vitest"

import {
  parseChannelLink,
  parseVideoId,
  youtubePlatform
} from "./youtube-platform"

/**
 * Trimmed copies of real Subscriptions feed cards (October 2026), with
 * styling markup removed and neutral names.
 */
function videoCard(videoId: string, channelHref: string, channelName: string) {
  return `
    <ytd-rich-item-renderer>
      <div id="content">
        <yt-lockup-view-model>
          <div class="ytLockupViewModelHost content-id-${videoId}">
            <a href="/watch?v=${videoId}" class="ytLockupViewModelContentImage">
              <yt-thumbnail-view-model></yt-thumbnail-view-model>
            </a>
            <div class="ytLockupViewModelMetadata">
              <yt-lockup-metadata-view-model>
                <h3><a href="/watch?v=${videoId}"><span>Video title</span></a></h3>
                <yt-content-metadata-view-model>
                  <div class="ytContentMetadataViewModelMetadataRow">
                    <span><span><a href="${channelHref}">${channelName}</a></span></span>
                    <span>1.2K views</span>
                  </div>
                </yt-content-metadata-view-model>
              </yt-lockup-metadata-view-model>
            </div>
          </div>
        </yt-lockup-view-model>
      </div>
    </ytd-rich-item-renderer>`
}

function shortCard(videoId: string) {
  return `
    <ytd-rich-item-renderer>
      <div id="content">
        <ytm-shorts-lockup-view-model-v2>
          <ytm-shorts-lockup-view-model>
            <a href="/shorts/${videoId}"><img alt=""></a>
            <h3><a href="/shorts/${videoId}"><span>Short title</span></a></h3>
          </ytm-shorts-lockup-view-model>
        </ytm-shorts-lockup-view-model-v2>
      </div>
    </ytd-rich-item-renderer>`
}

function render(html: string): HTMLElement {
  const root = document.createElement("div")
  root.innerHTML = html
  return root
}

describe("youtubePlatform", () => {
  it("finds every card in the feed", () => {
    const root = render(
      videoCard("aaaaaaaaaaa", "/@one", "One") + shortCard("bbbbbbbbbbb")
    )

    expect(youtubePlatform.findCards(root)).toHaveLength(2)
  })

  it("finds the card a node belongs to", () => {
    const root = render(videoCard("aaaaaaaaaaa", "/@one", "One"))
    const title = root.querySelector("h3 span")!

    expect(youtubePlatform.cardOf(title)?.tagName).toBe(
      "YTD-RICH-ITEM-RENDERER"
    )
    expect(youtubePlatform.cardOf(root)).toBeNull()
  })

  it("reads a video card with a channel handle", () => {
    const [card] = youtubePlatform.findCards(
      render(videoCard("aaaaaaaaaaa", "/@One", "Channel One"))
    )

    expect(youtubePlatform.parseCard(card)).toEqual({
      id: "aaaaaaaaaaa",
      channel: { handle: "@one", name: "Channel One" }
    })
  })

  it("reads a video card of a channel without a handle", () => {
    const [card] = youtubePlatform.findCards(
      render(
        videoCard("aaaaaaaaaaa", "/channel/UCmKurapML4BF9Bjtj4RbvXw", "Two")
      )
    )

    expect(youtubePlatform.parseCard(card)).toEqual({
      id: "aaaaaaaaaaa",
      channel: { id: "UCmKurapML4BF9Bjtj4RbvXw", name: "Two" }
    })
  })

  it("cannot attribute a Short to a channel", () => {
    const [card] = youtubePlatform.findCards(render(shortCard("bbbbbbbbbbb")))

    expect(youtubePlatform.parseCard(card)).toBeNull()
  })

  it("does not read a card that is not filled in yet", () => {
    const [card] = youtubePlatform.findCards(
      render("<ytd-rich-item-renderer></ytd-rich-item-renderer>")
    )

    expect(youtubePlatform.parseCard(card)).toBeNull()
  })
})

describe("parseVideoId", () => {
  it("reads watch and Shorts links", () => {
    expect(parseVideoId("/watch?v=kC_v3ufGoGs&t=10")).toBe("kC_v3ufGoGs")
    expect(parseVideoId("/shorts/abcDEF12345")).toBe("abcDEF12345")
  })

  it("rejects other links", () => {
    expect(parseVideoId("/watch")).toBeNull()
    expect(parseVideoId("/@channel")).toBeNull()
  })
})

describe("parseChannelLink", () => {
  it("decodes and lowercases handles", () => {
    expect(
      parseChannelLink("/@%D0%9A%D0%B0%D0%BD%D0%B0%D0%BB", "Канал")
    ).toEqual({ handle: "@канал", name: "Канал" })
    expect(parseChannelLink("/@MixedCase/videos", "Mixed")).toEqual({
      handle: "@mixedcase",
      name: "Mixed"
    })
  })

  it("reads channel IDs", () => {
    expect(parseChannelLink("/channel/UC123-abc_DEF", "")).toEqual({
      id: "UC123-abc_DEF",
      name: "UC123-abc_DEF"
    })
  })

  it("keeps a malformed handle as it is", () => {
    expect(parseChannelLink("/@bad%E0", "Bad")).toEqual({
      handle: "@bad%e0",
      name: "Bad"
    })
  })

  it("rejects links that are not channels", () => {
    expect(parseChannelLink("/feed/channels", "Channels")).toBeNull()
  })
})
