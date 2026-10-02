import type { PlasmoCSConfig } from "plasmo"

import { startFeedFilter } from "../content/feed-filter"
import {
  findSubscriptionsFeed,
  onYouTubeNavigation,
  youtubePlatform
} from "../platform/youtube/youtube-platform"
import { createChromeStorage } from "../storage"

export const config: PlasmoCSConfig = {
  matches: ["https://www.youtube.com/*"],
  run_at: "document_idle"
}

/**
 * The user may land on any YouTube page and reach Subscriptions later, so
 * the filter starts the first time the feed is rendered. YouTube keeps the
 * feed page in the DOM after navigating away, so the filter keeps running and
 * the feed is already filtered on the way back.
 */
let started = false

function startWhenFeedIsOpen(): void {
  if (started) {
    return
  }
  const root = findSubscriptionsFeed(document)
  if (root === null) {
    return
  }
  started = true
  const storage = createChromeStorage()
  void startFeedFilter({
    root,
    platform: youtubePlatform,
    rules: storage.rules,
    settings: storage.settings
  })
}

onYouTubeNavigation(document, startWhenFeedIsOpen)
startWhenFeedIsOpen()
