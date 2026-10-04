import { describe, expect, it } from "vitest"

import { gridOrder, type GridChild } from "./grid-order"

/** `v` visible item, `h` hidden item, `|` barrier. */
function grid(layout: string): GridChild[] {
  return [...layout.replace(/\s/g, "")].map((char) =>
    char === "|" ? { kind: "barrier" } : { kind: "item", hidden: char === "h" }
  )
}

describe("gridOrder", () => {
  it("keeps the DOM order when nothing is hidden", () => {
    expect(gridOrder(grid("vvv vvv | vvv"), 3)).toEqual([
      0, 1, 2, 3, 4, 5, 6, 7, 8, 9
    ])
  })

  it("keeps the DOM order when hidden items still leave full rows", () => {
    expect(gridOrder(grid("vvh vvh vv | vvv"), 3)).toEqual([
      0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11
    ])
  })

  it("moves a barrier down until the row before it is full", () => {
    // The case seen on YouTube: 6 items, 2 hidden, then the Shorts shelf.
    //          0 1 2 3 4 5 6 7 8 9
    const children = grid("v v h h v v | v v v")

    expect(gridOrder(children, 3)).toEqual([0, 1, 2, 3, 4, 5, 7, 8, 6, 9])
  })

  it("counts only visible items when filling the row", () => {
    //          0 1 2 3 4 5 6 7 8
    const children = grid("v v v v | h v h v")

    expect(gridOrder(children, 3)).toEqual([0, 1, 2, 3, 5, 6, 7, 8, 4])
  })

  it("moves consecutive barriers together", () => {
    //          0 1 2 3 4 5
    const children = grid("v | | v v v")

    expect(gridOrder(children, 3)).toEqual([0, 3, 4, 1, 2, 5])
  })

  it("leaves a barrier at the end when there is nothing to fill the row", () => {
    expect(gridOrder(grid("v v |"), 3)).toEqual([0, 1, 2])
  })

  it("follows the number of items per row", () => {
    //          0 1 2 3 4
    const children = grid("v v | v v")

    expect(gridOrder(children, 2)).toEqual([0, 1, 2, 3, 4])
    expect(gridOrder(children, 4)).toEqual([0, 1, 3, 4, 2])
  })
})
