// @vitest-environment happy-dom
import { afterEach, describe, expect, it } from "vitest"

import { createYouTubeGridLayout } from "./youtube-grid-layout"

/** `v` visible card, `h` hidden card, `|` shelf. */
function renderGrid(layout: string): HTMLElement {
  const root = document.createElement("ytd-browse")
  const contents = document.createElement("div")
  contents.id = "contents"
  for (const char of layout.replace(/\s/g, "")) {
    const child =
      char === "|"
        ? document.createElement("ytd-rich-section-renderer")
        : document.createElement("ytd-rich-item-renderer")
    if (char !== "|") {
      child.setAttribute("rendered-from-rich-grid", "")
      child.setAttribute("items-per-row", "3")
      child.toggleAttribute("data-test-hidden", char === "h")
    }
    contents.append(child)
  }
  root.append(contents)
  document.body.append(root)
  return root
}

const isHidden = (card: Element) => card.hasAttribute("data-test-hidden")

function visualOrder(root: Element): string {
  const children = [...root.querySelector("#contents")!.children]
  return children
    .map((child, index) => ({
      child,
      index,
      order: Number((child as HTMLElement).style.order || 0)
    }))
    .sort((a, b) => a.order - b.order || a.index - b.index)
    .map(({ child }) =>
      child.tagName === "YTD-RICH-SECTION-RENDERER"
        ? "|"
        : isHidden(child)
          ? "h"
          : "v"
    )
    .join("")
}

describe("createYouTubeGridLayout", () => {
  afterEach(() => {
    document.body.innerHTML = ""
  })

  it("moves a shelf down so the row before it is full", () => {
    const root = renderGrid("vvhhvv|vvv")
    const layout = createYouTubeGridLayout(root)

    layout.update(isHidden)

    expect(visualOrder(root)).toBe("vvhhvvvv|v")
  })

  it("leaves the DOM order alone when no row is broken", () => {
    const root = renderGrid("vvv|vvv")
    const layout = createYouTubeGridLayout(root)

    layout.update(isHidden)

    const styled = [...root.querySelectorAll("#contents > *")].filter(
      (child) => (child as HTMLElement).style.order !== ""
    )
    expect(styled).toEqual([])
  })

  it("restores the DOM order once the row is full again", () => {
    const root = renderGrid("vvhhvv|vvv")
    const layout = createYouTubeGridLayout(root)
    layout.update(isHidden)

    layout.update(() => false)

    expect(visualOrder(root)).toBe("vvhhvv|vvv")
    expect(
      [...root.querySelectorAll("#contents > *")].every(
        (child) => (child as HTMLElement).style.order === ""
      )
    ).toBe(true)
  })

  it("undoes its changes when disposed", () => {
    const root = renderGrid("vvhhvv|vvv")
    const layout = createYouTubeGridLayout(root)
    layout.update(isHidden)

    layout.dispose()

    expect(
      [...root.querySelectorAll("#contents > *")].every(
        (child) => (child as HTMLElement).style.order === ""
      )
    ).toBe(true)
  })

  it("does nothing on a page without a grid", () => {
    const root = document.createElement("div")
    document.body.append(root)

    expect(() => createYouTubeGridLayout(root).update(isHidden)).not.toThrow()
  })
})
