// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from "vitest"

import { findNotice, showNotice } from "./notice"

describe("showNotice", () => {
  afterEach(() => {
    vi.useRealTimers()
    document.body.innerHTML = ""
  })

  it("shows the message and the action", () => {
    showNotice(document, {
      message: "Channel hidden",
      actionLabel: "Undo",
      onAction: () => undefined
    })

    const notice = findNotice(document)
    expect(notice?.message).toBe("Channel hidden")
    expect(notice?.action.textContent).toBe("Undo")
  })

  it("runs the action once and closes", () => {
    const onAction = vi.fn()
    showNotice(document, { message: "m", actionLabel: "a", onAction })

    findNotice(document)!.action.click()

    expect(onAction).toHaveBeenCalledTimes(1)
    expect(findNotice(document)).toBeNull()
  })

  it("closes by itself after a while", () => {
    vi.useFakeTimers()
    showNotice(document, {
      message: "m",
      actionLabel: "a",
      onAction: () => undefined,
      durationMs: 1000
    })

    vi.advanceTimersByTime(999)
    expect(findNotice(document)).not.toBeNull()
    vi.advanceTimersByTime(1)
    expect(findNotice(document)).toBeNull()
  })

  it("replaces the previous notice", () => {
    showNotice(document, {
      message: "first",
      actionLabel: "a",
      onAction: () => undefined
    })
    showNotice(document, {
      message: "second",
      actionLabel: "a",
      onAction: () => undefined
    })

    expect(document.querySelectorAll("hushfeed-notice")).toHaveLength(1)
    expect(findNotice(document)?.message).toBe("second")
  })
})
