const HIDDEN_ATTRIBUTE = "data-hushfeed-hidden"
const STYLE_ID = "hushfeed-style"

/**
 * Adds the stylesheet that hides marked cards. Cards stay in the DOM, so
 * showing them again needs no reload.
 */
export function installCardStyle(document: Document): () => void {
  if (document.getElementById(STYLE_ID) !== null) {
    return () => undefined
  }
  const style = document.createElement("style")
  style.id = STYLE_ID
  style.textContent = `[${HIDDEN_ATTRIBUTE}] { display: none !important; }`
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
