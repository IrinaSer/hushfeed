export type GridChild =
  /** A video card, laid out `perRow` to a row. */
  | { kind: "item"; hidden: boolean }
  /** Anything that takes a full row of its own, e.g. a shelf. */
  | { kind: "barrier" }

/**
 * The visual order of a wrapping flex grid in which hidden items leave no
 * holes.
 *
 * The grid lays items `perRow` to a row and breaks rows at barriers. When
 * hidden items leave the row before a barrier incomplete, the barrier is
 * moved down until enough of the following items have filled that row.
 * Items never move up past one another, so the feed keeps its order.
 *
 * Returns the DOM indices of `children` in visual order.
 */
export function gridOrder(
  children: readonly GridChild[],
  perRow: number
): number[] {
  const order: number[] = []
  let pending: number[] = []
  let filled = 0

  children.forEach((child, index) => {
    if (child.kind === "barrier") {
      if (filled === 0) {
        order.push(index)
      } else {
        pending.push(index)
      }
      return
    }

    order.push(index)
    if (!child.hidden) {
      filled = (filled + 1) % perRow
      if (filled === 0 && pending.length > 0) {
        order.push(...pending)
        pending = []
      }
    }
  })

  return [...order, ...pending]
}
