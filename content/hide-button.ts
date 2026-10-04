import { ANCHOR_ATTRIBUTE, HIDE_BUTTON_TAG } from "./card-visibility"

/**
 * The button lives in a shadow root, so YouTube's styles do not reach it and
 * its styles do not leak into the page.
 */
const BUTTON_STYLE = `
button {
  font: 500 12px/1 Roboto, Arial, sans-serif;
  color: #fff;
  background: rgba(0, 0, 0, 0.8);
  border: 0;
  border-radius: 4px;
  padding: 6px 8px;
  cursor: pointer;
}
button:hover { background: rgba(0, 0, 0, 0.9); }
button:focus-visible { outline: 2px solid #fff; outline-offset: 1px; }
`

/** Adds the `Hide channel` button to `anchor` unless it is already there. */
export function ensureHideButton(anchor: Element, onHide: () => void): void {
  if (anchor.querySelector(`:scope > ${HIDE_BUTTON_TAG}`) !== null) {
    return
  }
  const host = anchor.ownerDocument.createElement(HIDE_BUTTON_TAG)
  const shadow = host.attachShadow({ mode: "open" })
  shadow.innerHTML = `<style>${BUTTON_STYLE}</style><button type="button">Hide channel</button>`
  shadow.querySelector("button")!.addEventListener("click", (event) => {
    // Keep YouTube from treating the click as a click on the card.
    event.preventDefault()
    event.stopPropagation()
    onHide()
  })
  anchor.setAttribute(ANCHOR_ATTRIBUTE, "")
  anchor.append(host)
}

export function removeHideButton(anchor: Element): void {
  anchor.querySelector(`:scope > ${HIDE_BUTTON_TAG}`)?.remove()
}

export function removeAllHideButtons(root: ParentNode): void {
  for (const button of root.querySelectorAll(HIDE_BUTTON_TAG)) {
    button.remove()
  }
  for (const anchor of root.querySelectorAll(`[${ANCHOR_ATTRIBUTE}]`)) {
    anchor.removeAttribute(ANCHOR_ATTRIBUTE)
  }
}

/** The button inside `anchor`, for tests. */
export function findHideButton(anchor: Element): HTMLButtonElement | null {
  return (
    anchor
      .querySelector(`:scope > ${HIDE_BUTTON_TAG}`)
      ?.shadowRoot?.querySelector("button") ?? null
  )
}
