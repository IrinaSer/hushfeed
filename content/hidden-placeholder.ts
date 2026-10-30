import { ANCHOR_ATTRIBUTE, PLACEHOLDER_TAG } from "./card-visibility"

const DEFAULT_DURATION_MS = 8000

/**
 * Lives in a shadow root, like the hide button. Colours come from YouTube's
 * theme variables, which pass into shadow roots, so the placeholder matches
 * both the light and the dark theme; the fallbacks are the light theme.
 */
const PLACEHOLDER_STYLE = `
.placeholder {
  box-sizing: border-box;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 16px;
  border-radius: 12px;
  border: 1px solid var(--yt-spec-10-percent-layer, rgba(0, 0, 0, 0.1));
  background: var(--yt-spec-base-background, #fff);
  color: var(--yt-spec-text-primary, #0f0f0f);
  font: 500 16px/22px Roboto, Arial, sans-serif;
  text-align: center;
}
.message { overflow-wrap: anywhere; }
button {
  font: 500 14px/36px Roboto, Arial, sans-serif;
  padding: 0 16px;
  border: 0;
  border-radius: 18px;
  background: var(--yt-spec-badge-chip-background, rgba(0, 0, 0, 0.05));
  color: var(--yt-spec-text-primary, #0f0f0f);
  cursor: pointer;
}
button:hover { background: var(--yt-spec-10-percent-layer, rgba(0, 0, 0, 0.1)); }
button:focus-visible {
  outline: 2px solid var(--yt-spec-call-to-action, #065fd4);
  outline-offset: 2px;
}
`

export interface PlaceholderOptions {
  message: string
  actionLabel: string
  onAction: () => void
  /** Called when the placeholder goes away by itself. */
  onExpire: () => void
  durationMs?: number
}

/**
 * Covers `anchor` (a card) with a message and one action, at the spot the
 * user just clicked. It goes away by itself after a while, but not while the
 * pointer is on it. Focus moves to the action, since the button that was
 * clicked is gone, so keyboard users undo with Enter. Focus does not pause
 * the timer: it is always on the action, so the placeholder would never go.
 *
 * Returns a function that removes it without calling back.
 */
export function showPlaceholder(
  anchor: Element,
  {
    message,
    actionLabel,
    onAction,
    onExpire,
    durationMs = DEFAULT_DURATION_MS
  }: PlaceholderOptions
): () => void {
  const host = anchor.ownerDocument.createElement(PLACEHOLDER_TAG)
  const shadow = host.attachShadow({ mode: "open" })
  shadow.innerHTML = `<style>${PLACEHOLDER_STYLE}</style><div class="placeholder" role="status"><span class="message"></span><button type="button"></button></div>`
  shadow.querySelector(".message")!.textContent = message
  const button = shadow.querySelector("button")!
  button.textContent = actionLabel

  let timer: ReturnType<typeof setTimeout> | undefined

  const remove = () => {
    clearTimeout(timer)
    host.remove()
  }
  const startTimer = () => {
    clearTimeout(timer)
    timer = setTimeout(() => {
      remove()
      onExpire()
    }, durationMs)
  }

  host.addEventListener("pointerenter", () => clearTimeout(timer))
  host.addEventListener("pointerleave", startTimer)
  // Clicks on the placeholder must not open the video underneath.
  host.addEventListener("click", (event) => {
    event.preventDefault()
    event.stopPropagation()
  })
  button.addEventListener("click", () => {
    remove()
    onAction()
  })

  anchor.setAttribute(ANCHOR_ATTRIBUTE, "")
  anchor.append(host)
  button.focus()
  startTimer()
  return remove
}

/** The placeholder inside `root`, for tests. */
export function findPlaceholder(
  root: ParentNode
): { message: string; action: HTMLButtonElement; host: Element } | null {
  const host = root.querySelector(PLACEHOLDER_TAG)
  const shadow = host?.shadowRoot
  if (!host || !shadow) {
    return null
  }
  return {
    host,
    message: shadow.querySelector(".message")!.textContent ?? "",
    action: shadow.querySelector("button")!
  }
}
