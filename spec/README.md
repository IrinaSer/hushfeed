# Specs

This project uses spec-driven development (SDD): behaviour is described in a spec first, then implemented against it.

## Layout

```text
spec/
├── README.md          this file: how specs work
├── git-workflow.md    process spec: branches, commits, release
└── NNN-<slug>.md      feature specs, numbered in creation order
```

## Index

| Spec                              | Title        | Status      |
| --------------------------------- | ------------ | ----------- |
| [git-workflow](./git-workflow.md) | Git workflow | Accepted    |
| [001](./001-hide-channel.md)      | Hide channel | In progress |

## Status lifecycle

```text
Draft → Accepted → In progress → Done
```

- **Draft** — being discussed; open questions may remain.
- **Accepted** — the owner approved it; implementation may start.
- **In progress** — at least one slice is merged.
- **Done** — every acceptance criterion is checked off.

## Rules

1. No feature work starts from a `Draft` spec.
2. A spec describes **what** and **why**, plus the constraints that matter. It prescribes **how** only where the choice is deliberate.
3. If implementation reveals that the spec is wrong, change the spec in the same PR as the code. The spec and `main` must not disagree.
4. Anything not covered by the spec and not obviously implied is out of scope. Ask rather than invent — this applies to content, URLs and assets in particular.
5. Every PR names the spec and the slice it implements.
6. A spec is implemented in small slices, each of which leaves `main` releasable (see [git-workflow](./git-workflow.md)).
