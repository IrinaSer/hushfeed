import { hideChannelRule } from "../core/channel-rule"
import { channelKeys } from "../core/feed-item"
import {
  createFilterEngine,
  type FilterEngine,
  type FilterState
} from "../core/filter-engine"
import type { RulesRepository } from "../core/rules-repository"
import type { SettingsRepository } from "../core/settings-repository"
import type { FeedPlatform } from "../platform/feed-platform"
import {
  installPageStyle,
  setCardHidden,
  showAllCards
} from "./card-visibility"
import { observeFeed } from "./feed-observer"
import {
  ensureHideButton,
  removeAllHideButtons,
  removeHideButton
} from "./hide-button"
import { showNotice } from "./notice"

export interface FeedFilterOptions {
  root: Element
  platform: FeedPlatform
  rules: RulesRepository
  settings: SettingsRepository
}

/**
 * Keeps the feed in `root` in line with the stored rules: hides cards as they
 * load, and re-applies the rules to the cards on the page whenever the rules
 * or the on/off switch change. While filtering is on, every card the platform
 * can attribute to a channel gets a `Hide channel` button.
 *
 * Storage is read once at start and then only through change notifications;
 * evaluating a card never touches storage.
 */
export async function startFeedFilter({
  root,
  platform,
  rules: rulesRepository,
  settings: settingsRepository
}: FeedFilterOptions): Promise<() => void> {
  let state: FilterState | undefined
  /** Changes notified before the initial read finished. */
  let early: Partial<FilterState> = {}
  let engine: FilterEngine | undefined
  /** Bumped on every state change, so cards are re-evaluated once per state. */
  let version = 0
  /** What each card was last evaluated as: state version + item identity. */
  const evaluated = new WeakMap<Element, string>()

  const document = root.ownerDocument

  const hideChannelOf = async (card: Element) => {
    // Read the card again: the platform may have reused it since it was
    // last evaluated.
    const item = platform.parseCard(card)
    if (item === null) {
      return
    }
    const rule = hideChannelRule(item.channel)
    try {
      await rulesRepository.saveRule(rule)
    } catch (error) {
      console.error("Hushfeed: could not hide the channel", error)
      return
    }
    showNotice(document, {
      message: "Channel hidden",
      actionLabel: "Undo",
      onAction: () => {
        rulesRepository.deleteRule(rule.channelKey).catch((error: unknown) => {
          console.error("Hushfeed: could not undo hiding the channel", error)
        })
      }
    })
  }

  const apply = (cards: Iterable<Element>) => {
    if (engine === undefined || state === undefined) {
      return
    }
    for (const card of cards) {
      const item = platform.parseCard(card)
      if (item === null) {
        continue
      }
      // Before the signature check: the platform may re-render a card and
      // drop the button without changing what the card shows.
      const anchor = platform.actionAnchor(card)
      if (state.enabled) {
        ensureHideButton(anchor, () => void hideChannelOf(card))
      } else {
        removeHideButton(anchor)
      }
      const signature = [version, item.id, ...channelKeys(item.channel)].join(
        "|"
      )
      if (evaluated.get(card) === signature) {
        continue
      }
      evaluated.set(card, signature)
      setCardHidden(card, engine.evaluate(item) === "hide")
    }
  }

  const update = (change: Partial<FilterState>) => {
    if (state === undefined) {
      early = { ...early, ...change }
      return
    }
    state = { ...state, ...change }
    engine = createFilterEngine(state)
    version += 1
    apply(platform.findCards(root))
  }

  // Subscribe before reading, so a change made in between is not lost.
  const unsubscribeRules = rulesRepository.subscribe((rules) =>
    update({ rules })
  )
  const unsubscribeSettings = settingsRepository.subscribe((enabled) =>
    update({ enabled })
  )
  const [enabled, rules] = await Promise.all([
    settingsRepository.isEnabled(),
    rulesRepository.getRules()
  ])
  // A notification is at least as new as the read it raced with.
  state = { enabled, rules, ...early }
  engine = createFilterEngine(state)

  const removeStyle = installPageStyle(document)
  const stopObserving = observeFeed({ root, platform, onCards: apply })

  return () => {
    stopObserving()
    unsubscribeRules()
    unsubscribeSettings()
    showAllCards(root)
    removeAllHideButtons(root)
    removeStyle()
  }
}
