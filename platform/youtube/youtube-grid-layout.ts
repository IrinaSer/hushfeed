import type { FeedLayout } from "../feed-platform"
import { gridOrder, type GridChild } from "./grid-order"

/**
 * The Subscriptions grid (verified October 2026) is a wrapping flex
 * container: video cards sized `1 / items-per-row` of its width, and shelves
 * (`ytd-rich-section-renderer`) that take a full row. YouTube places shelves
 * after a fixed number of videos, so hiding videos above a shelf leaves the
 * row before it incomplete.
 *
 * This layout moves shelves down with CSS `order` until that row is full.
 * The DOM is not touched, so YouTube's own rendering is unaffected.
 */
const GRID_CARD = "ytd-rich-item-renderer[rendered-from-rich-grid]"
const CARD = "ytd-rich-item-renderer"

export function createYouTubeGridLayout(root: Element): FeedLayout {
  const window = root.ownerDocument.defaultView
  let isHidden: (card: Element) => boolean = () => false
  let frame: number | undefined

  const update = (hidden: (card: Element) => boolean) => {
    isHidden = hidden
    const container = findGridContainer(root)
    if (container === null) {
      return
    }
    const children = [...container.children].filter(
      (child): child is HTMLElement => child instanceof HTMLElement
    )
    const perRow = itemsPerRow(children)
    if (perRow === null) {
      return
    }

    const order = gridOrder(
      children.map(
        (child): GridChild =>
          child.matches(CARD)
            ? { kind: "item", hidden: isHidden(child) }
            : { kind: "barrier" }
      ),
      perRow
    )

    if (order.every((childIndex, position) => childIndex === position)) {
      clearOrder(children)
      return
    }
    // Negative values: children YouTube appends later get the default 0 and
    // stay at the end, where they are in the DOM.
    order.forEach((childIndex, position) => {
      const value = String(position - order.length)
      const child = children[childIndex]
      if (child.style.order !== value) {
        child.style.order = value
      }
    })
  }

  // The number of cards per row follows the window width.
  const onResize = () => {
    if (frame !== undefined) {
      return
    }
    frame = window?.requestAnimationFrame(() => {
      frame = undefined
      update(isHidden)
    })
  }
  window?.addEventListener("resize", onResize)

  return {
    update,
    dispose() {
      window?.removeEventListener("resize", onResize)
      if (frame !== undefined) {
        window?.cancelAnimationFrame(frame)
      }
      const container = findGridContainer(root)
      if (container !== null) {
        clearOrder([...container.children])
      }
    }
  }
}

function findGridContainer(root: Element): Element | null {
  return root.querySelector(GRID_CARD)?.parentElement ?? null
}

/**
 * Cards are sized with `--ytd-rich-grid-items-per-row`, so its value on a
 * card is the number of cards per row. Falls back to the `items-per-row`
 * attribute YouTube sets alongside.
 */
function itemsPerRow(children: Element[]): number | null {
  const card = children.find((child) => child.matches(GRID_CARD))
  if (card === undefined) {
    return null
  }
  const fromStyle = Number.parseInt(
    getComputedStyle(card).getPropertyValue("--ytd-rich-grid-items-per-row"),
    10
  )
  const value = Number.isNaN(fromStyle)
    ? Number.parseInt(card.getAttribute("items-per-row") ?? "", 10)
    : fromStyle
  return value > 0 ? value : null
}

function clearOrder(children: Element[]): void {
  for (const child of children) {
    if (child instanceof HTMLElement && child.style.order !== "") {
      child.style.removeProperty("order")
    }
  }
}
