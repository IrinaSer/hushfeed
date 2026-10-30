import { hideChannelRule } from "../core/channel-rule"
import { itemIdentity } from "../core/feed-item"
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
  isCardHidden,
  setCardHidden,
  showAllCards
} from "./card-visibility"
import { observeFeed } from "./feed-observer"
import { showPlaceholder } from "./hidden-placeholder"
import {
  ensureHideButton,
  removeAllHideButtons,
  removeHideButton
} from "./hide-button"

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
 * Hiding a channel hides its cards at once, except the one clicked: that one
 * shows an undo placeholder until it expires, so the undo is where the user
 * is looking.
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
  const layout = platform.createLayout?.(root)

  /** The card showing the undo placeholder, if any. */
  let placeholder: {
    card: Element
    /** What the card showed when clicked; a reused card drops the placeholder. */
    identity: string
    channelKey: string
    /** Whether the rule is stored, so its absence means it was removed. */
    saved: boolean
    remove: () => void
  } | null = null

  /** Forgets the placeholder; its card is evaluated afresh by the caller. */
  const dropPlaceholder = (): Element | null => {
    if (placeholder === null) {
      return null
    }
    const { card, remove } = placeholder
    placeholder = null
    remove()
    evaluated.delete(card)
    return card
  }

  const hideChannelOf = async (card: Element) => {
    // Read the card again: the platform may have reused it since it was
    // last evaluated.
    const item = platform.parseCard(card)
    if (item === null) {
      return
    }
    const rule = hideChannelRule(item.channel)
    const previous = dropPlaceholder()
    if (previous !== null) {
      apply([previous])
    }

    const anchor = platform.actionAnchor(card)
    removeHideButton(anchor)
    const current = {
      card,
      identity: itemIdentity(item),
      channelKey: rule.channelKey,
      saved: false,
      remove: showPlaceholder(anchor, {
        message: `${rule.channelName} hidden`,
        actionLabel: "Undo",
        onAction: () => {
          dropPlaceholder()
          rulesRepository
            .deleteRule(rule.channelKey)
            .catch((error: unknown) => {
              console.error(
                "Hushfeed: could not undo hiding the channel",
                error
              )
              apply([card])
            })
        },
        onExpire: () => {
          if (placeholder === current) {
            apply([dropPlaceholder()!])
          }
        }
      })
    }
    // Set before saving: the save notifies synchronously in some storages,
    // and the clicked card must not be hidden under the placeholder.
    placeholder = current

    try {
      await rulesRepository.saveRule(rule)
      current.saved = true
    } catch (error) {
      console.error("Hushfeed: could not hide the channel", error)
      if (placeholder === current) {
        apply([dropPlaceholder()!])
      }
    }
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
      if (placeholder?.card === card) {
        if (state.enabled && itemIdentity(item) === placeholder.identity) {
          setCardHidden(card, false)
          continue
        }
        dropPlaceholder()
      }
      // Before the signature check: the platform may re-render a card and
      // drop the button without changing what the card shows.
      const anchor = platform.actionAnchor(card)
      if (state.enabled) {
        ensureHideButton(anchor, () => void hideChannelOf(card))
      } else {
        removeHideButton(anchor)
      }
      const signature = `${version}|${itemIdentity(item)}`
      if (evaluated.get(card) === signature) {
        continue
      }
      evaluated.set(card, signature)
      setCardHidden(card, engine.evaluate(item) === "hide")
    }
    layout?.update(isCardHidden)
  }

  const update = (change: Partial<FilterState>) => {
    if (state === undefined) {
      early = { ...early, ...change }
      return
    }
    state = { ...state, ...change }
    engine = createFilterEngine(state)
    version += 1
    const current = placeholder
    if (
      current !== null &&
      (!state.enabled ||
        (current.saved &&
          !state.rules.some((rule) => rule.channelKey === current.channelKey)))
    ) {
      dropPlaceholder()
    }
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
    layout?.dispose()
    dropPlaceholder()
    showAllCards(root)
    removeAllHideButtons(root)
    removeStyle()
  }
}
