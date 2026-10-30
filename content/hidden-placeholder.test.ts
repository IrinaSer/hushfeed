// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { findPlaceholder, showPlaceholder } from "./hidden-placeholder"

describe("showPlaceholder", () => {
  let anchor: HTMLElement

  beforeEach(() => {
    vi.useFakeTimers()
    anchor = document.createElement("div")
    document.body.append(anchor)
  })

  afterEach(() => {
    vi.useRealTimers()
    document.body.innerHTML = ""
  })

  function show(
    overrides: Partial<Parameters<typeof showPlaceholder>[1]> = {}
  ) {
    const options = {
      message: "Channel A hidden",
      actionLabel: "Undo",
      onAction: vi.fn(),
      onExpire: vi.fn(),
      durationMs: 1000,
      ...overrides
    }
    const remove = showPlaceholder(anchor, options)
    return { ...options, remove }
  }

  it("covers the card with the message and the action, focused", () => {
    show()

    const placeholder = findPlaceholder(anchor)
    expect(placeholder?.message).toBe("Channel A hidden")
    expect(placeholder?.action.textContent).toBe("Undo")
    expect(anchor.hasAttribute("data-hushfeed-anchor")).toBe(true)
    expect(placeholder?.host.shadowRoot?.activeElement).toBe(
      placeholder?.action
    )
  })

  it("runs the action once and goes away", () => {
    const { onAction, onExpire } = show()

    findPlaceholder(anchor)!.action.click()
    vi.advanceTimersByTime(1000)

    expect(onAction).toHaveBeenCalledTimes(1)
    expect(onExpire).not.toHaveBeenCalled()
    expect(findPlaceholder(anchor)).toBeNull()
  })

  it("goes away by itself after a while", () => {
    const { onExpire } = show()

    vi.advanceTimersByTime(999)
    expect(findPlaceholder(anchor)).not.toBeNull()
    vi.advanceTimersByTime(1)

    expect(findPlaceholder(anchor)).toBeNull()
    expect(onExpire).toHaveBeenCalledTimes(1)
  })

  it("stays while the pointer is on it and restarts the wait after", () => {
    const { onExpire } = show()
    const host = findPlaceholder(anchor)!.host

    host.dispatchEvent(new PointerEvent("pointerenter"))
    vi.advanceTimersByTime(5000)
    expect(findPlaceholder(anchor)).not.toBeNull()

    host.dispatchEvent(new PointerEvent("pointerleave"))
    vi.advanceTimersByTime(1000)
    expect(onExpire).toHaveBeenCalledTimes(1)
  })

  it("keeps clicks from reaching the card", () => {
    const onCardClick = vi.fn()
    anchor.addEventListener("click", onCardClick)
    show()

    findPlaceholder(anchor)!.host.dispatchEvent(
      new MouseEvent("click", { bubbles: true })
    )
    findPlaceholder(anchor)!.action.click()

    expect(onCardClick).not.toHaveBeenCalled()
  })

  it("can be removed without calling back", () => {
    const { remove, onAction, onExpire } = show()

    remove()
    vi.advanceTimersByTime(1000)

    expect(findPlaceholder(anchor)).toBeNull()
    expect(onAction).not.toHaveBeenCalled()
    expect(onExpire).not.toHaveBeenCalled()
  })
})
