# Git workflow

**Status:** Accepted

**Strategy:** lightweight GitHub Flow / trunk-based development.

## Branches

```text
main
feat/*
fix/*
chore/*
```

Branch names are lowercase kebab-case and describe the change: `feat/filter-engine`, `fix/undo-notice`, `chore/ci-checks`.

## Rules

- `main` must always be releasable: it builds, its checks pass, and the built extension loads and works.
- No `develop` branch.
- No classic `release/*` or `hotfix/*` branches.
- Feature branches are short-lived: one slice of a spec, merged within a day or two.
- Every change reaches `main` through a Pull Request. Direct pushes are rejected by a repository ruleset, for the owner too.
- Merging into `main` does not publish anything. Publishing is a separate, deliberate step (see [Release](#release)).

## Protection of `main`

The `Protect main` ruleset (repository settings → Rules) enforces the rules above: pull requests only, required `build` and `title` checks, squash merge only, no force pushes, no branch deletion. It has no bypass list.

## Pull requests

- A PR references the spec and slice it implements, for example `spec/001-hide-channel.md, slice 2`.
- The PR title follows the commit convention below; the `title` check enforces it.
- The `build` and `title` checks must pass before a PR can be merged. `build` covers formatting, types, unit tests and the production build of the extension.
- PRs are squash-merged, the only merge method the ruleset allows, so `main` keeps one commit per change and the PR title becomes that commit.
- The branch is deleted after merge.

## Commit convention

Close to [Conventional Commits](https://www.conventionalcommits.org/): `<type>: <summary>`, imperative mood, lowercase, no trailing period.

| Type       | Use for                                            |
| ---------- | -------------------------------------------------- |
| `feat`     | user-visible functionality                         |
| `fix`      | bug fixes                                          |
| `style`    | visual refinements without behaviour changes       |
| `refactor` | code restructuring without behaviour changes       |
| `docs`     | specs and documentation                            |
| `chore`    | tooling, configuration, CI, dependencies, releases |

Examples:

```text
feat: add filter engine
feat: hide channel from subscriptions feed
fix: restore cards after undo
style: refine popup spacing
refactor: extract youtube card parser
docs: add hide channel spec
chore: narrow host permissions
chore: release v0.1.0
```

## Release

```text
bump version in a PR → merge into main → tag vX.Y.Z → run "Submit to Web Store" → store review → users
```

- The version lives in `package.json` and follows semver. It is bumped in its own PR, titled `chore: release vX.Y.Z`.
- The merge commit of that PR is tagged `vX.Y.Z`.
- Publishing is done by running the `Submit to Web Store` workflow (`.github/workflows/submit.yml`) by hand on `main`. It builds, packages and submits the extension.
- A release is only made from `main`, and only from a tagged commit.
- Build output (`build/`, packaged zips) is never committed and never uploaded to the store by hand.
- Store review is outside our control: a submitted version reaches users only after the store approves it.

## Setup status

Not yet in place; the rules above apply in full once these are done:

- [x] Local branch renamed from `master` to `main`.
- [x] GitHub repository created and connected as `origin`.
- [x] `Protect main` ruleset configured.
- [x] `build` and `title` checks added as a PR workflow.
- [ ] `SUBMIT_KEYS` secret set and the extension registered in the Chrome Web Store.
