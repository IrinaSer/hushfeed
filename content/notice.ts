const NOTICE_TAG = "hushfeed-notice"
const DEFAULT_DURATION_MS = 6000

const NOTICE_STYLE = `
.notice {
  position: fixed;
  left: 24px;
  bottom: 24px;
  z-index: 2147483647;
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px 16px;
  border-radius: 8px;
  font: 400 14px/20px Roboto, Arial, sans-serif;
  color: #fff;
  background: #0f0f0f;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
}
button {
  font: 500 14px/20px Roboto, Arial, sans-serif;
  color: #3ea6ff;
  background: none;
  border: 0;
  padding: 0;
  cursor: pointer;
}
button:focus-visible { outline: 2px solid #3ea6ff; outline-offset: 2px; }
`

export interface NoticeOptions {
  message: string
  actionLabel: string
  onAction: () => void
  durationMs?: number
}

/**
 * Shows a short notice with one action at the bottom of the page. A new
 * notice replaces the previous one. Returns a function that dismisses it.
 */
export function showNotice(
  document: Document,
  {
    message,
    actionLabel,
    onAction,
    durationMs = DEFAULT_DURATION_MS
  }: NoticeOptions
): () => void {
  document.querySelector(NOTICE_TAG)?.remove()

  const host = document.createElement(NOTICE_TAG)
  const shadow = host.attachShadow({ mode: "open" })
  shadow.innerHTML = `<style>${NOTICE_STYLE}</style><div class="notice" role="status"><span></span><button type="button"></button></div>`
  shadow.querySelector("span")!.textContent = message
  const button = shadow.querySelector("button")!
  button.textContent = actionLabel

  const timer = setTimeout(() => dismiss(), durationMs)
  const dismiss = () => {
    clearTimeout(timer)
    host.remove()
  }
  button.addEventListener("click", () => {
    dismiss()
    onAction()
  })

  document.body.append(host)
  return dismiss
}

/** The notice on the page, for tests. */
export function findNotice(
  document: Document
): { message: string; action: HTMLButtonElement } | null {
  const shadow = document.querySelector(NOTICE_TAG)?.shadowRoot
  if (!shadow) {
    return null
  }
  return {
    message: shadow.querySelector("span")!.textContent ?? "",
    action: shadow.querySelector("button")!
  }
}
