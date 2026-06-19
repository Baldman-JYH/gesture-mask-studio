# GitHub Support Sensitive Data Cleanup Request

Repository: `Baldman-JYH/gesture-mask-studio`

Repository URL: `https://github.com/Baldman-JYH/gesture-mask-studio`

Sensitive path removed from history:

- `assets/analysis/`

Reason:

- The path contained analysis artifacts with sensitive information. The files have already been removed from the latest branch trees and from rewritten local/remote branch history.

Tool and command used:

- `git-filter-repo` 2.47.0
- `python -m git_filter_repo --sensitive-data-removal --invert-paths --path assets/analysis/ --force`

First Changed Commit reported by git-filter-repo:

- `3774e09930636b3658a6763e59811290a14a932c`

Writable branches already force-pushed after history rewrite:

- `main`: `5e6c7e7` -> `365d2b1`, then documentation commit `5084f7a`
- `codex/fix-3d-template-dedupe`: `ef50df4` -> `481bad7`
- `feat/spatial-template-mvp`: `1564095` -> `179d584`

Verification already completed:

- `git ls-tree -r --name-only origin/main assets/analysis` returns 0 files.
- `git for-each-ref` and `git ls-tree` checks on current local refs return no `assets/analysis` hits.
- `git log --all --name-only -- assets/analysis` returns no output in the cleaned local repository.
- GitHub Contents API for `repos/Baldman-JYH/gesture-mask-studio/contents/assets/analysis` returns 404 on the default branch.

Read-only GitHub PR refs still pointing to old commits:

- PR #1: `https://github.com/Baldman-JYH/gesture-mask-studio/pull/1`
  - Title: `Add spatial template MVP`
  - State: merged
  - Ref: `refs/pull/1/head`
  - Old head commit: `156409593d720a7a127bac824976a07bd40e9dda`
  - Before local cleanup, this commit tree contained 570 files under `assets/analysis`.

- PR #2: `https://github.com/Baldman-JYH/gesture-mask-studio/pull/2`
  - Title: `[codex] Fix 3D template hand anchoring`
  - State: merged
  - Ref: `refs/pull/2/head`
  - Old head commit: `ef50df4b1d7016e19bb66878a41ede40193871c9`
  - Before local cleanup, this commit tree contained 570 files under `assets/analysis`.

Requested GitHub Support action:

- Remove or dereference the stale PR refs and any cached views that still expose commits containing `assets/analysis/`.
- Run GitHub-side garbage collection or the appropriate sensitive-data cleanup process so the old objects become inaccessible from GitHub.

Additional note:

- If any credentials were present in the removed artifacts, they should be considered compromised and rotated independently of repository cleanup.
