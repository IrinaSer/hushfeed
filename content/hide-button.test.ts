// @vitest-environment happy-dom
import { describe, expect, it, vi } from "vitest"

import {
  ensureHideButton,
  findHideButton,
  removeAllHideButtons,
  removeHideButton
} from "./hide-button"

function anchor(): HTMLElement {
  const element = document.createElement("div")
  document.body.append(element)
  return element
}

describe("hide button", () => {
  it("adds one labelled button however often it is ensured", () => {
    const element = anchor()

    ensureHideButton(element, () => undefined)
    ensureHideButton(element, () => undefined)

    expect(element.querySelectorAll("hushfeed-hide-button")).toHaveLength(1)
    expect(findHideButton(element)?.textContent).toBe("Hide channel")
    expect(findHideButton(element)?.type).toBe("button")
  })

  it("calls back on click without letting the click reach the card", () => {
    const element = anchor()
    const onHide = vi.fn()
    const onCardClick = vi.fn()
    element.addEventListener("click", onCardClick)
    ensureHideButton(element, onHide)

    findHideButton(element)!.click()

    expect(onHide).toHaveBeenCalledTimes(1)
    expect(onCardClick).not.toHaveBeenCalled()
  })

  it("removes the button from one anchor or from the whole page", () => {
    const first = anchor()
    const second = anchor()
    ensureHideButton(first, () => undefined)
    ensureHideButton(second, () => undefined)

    removeHideButton(first)
    expect(findHideButton(first)).toBeNull()
    expect(findHideButton(second)).not.toBeNull()

    removeAllHideButtons(document.body)
    expect(findHideButton(second)).toBeNull()
    expect(second.hasAttribute("data-hushfeed-anchor")).toBe(false)
  })
})
