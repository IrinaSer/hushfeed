const HIDDEN_ATTRIBUTE = "data-hushfeed-hidden"
const STYLE_ID = "hushfeed-style"

export const ANCHOR_ATTRIBUTE = "data-hushfeed-anchor"
export const HIDE_BUTTON_TAG = "hushfeed-hide-button"
export const PLACEHOLDER_TAG = "hushfeed-placeholder"

/**
 * Page-level styles: hiding marked cards, placing the `Hide channel` button
 * in the top-right corner of its card (shown on hover or keyboard focus), and
 * laying the undo placeholder over a whole card. Cards stay in the DOM, so
 * showing them again needs no reload.
 */
const PAGE_STYLE = `
[${HIDDEN_ATTRIBUTE}] { display: none !important; }
[${ANCHOR_ATTRIBUTE}] { position: relative; }
${HIDE_BUTTON_TAG} {
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 10;
  opacity: 0;
  transition: opacity 0.15s;
}
[${ANCHOR_ATTRIBUTE}]:hover > ${HIDE_BUTTON_TAG},
${HIDE_BUTTON_TAG}:focus-within { opacity: 1; }
${PLACEHOLDER_TAG} {
  position: absolute;
  inset: 0;
  z-index: 11;
}
`

export function installPageStyle(document: Document): () => void {
  if (document.getElementById(STYLE_ID) !== null) {
    return () => undefined
  }
  const style = document.createElement("style")
  style.id = STYLE_ID
  style.textContent = PAGE_STYLE
  ;(document.head ?? document.documentElement).append(style)
  return () => style.remove()
}

export function setCardHidden(card: Element, hidden: boolean): void {
  card.toggleAttribute(HIDDEN_ATTRIBUTE, hidden)
}

export function isCardHidden(card: Element): boolean {
  return card.hasAttribute(HIDDEN_ATTRIBUTE)
}

/** Shows every card Hushfeed has hidden. */
export function showAllCards(root: ParentNode): void {
  for (const card of root.querySelectorAll(`[${HIDDEN_ATTRIBUTE}]`)) {
    card.removeAttribute(HIDDEN_ATTRIBUTE)
  }
}
