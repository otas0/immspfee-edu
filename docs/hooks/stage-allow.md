# Stage-allow pre-commit hook

Blind `git add -A` once swept parallel WIP into a red Pages deploy. Staging must go through `scripts/git-stage-allow.sh` (or explicit paths under `scripts/stage-allow.default.list`).

## Enable locally

```bash
# Prefer hooksPath so the tracked hook stays the source of truth:
git config core.hooksPath scripts/githooks

# Or copy once:
# cp scripts/githooks/pre-commit .git/hooks/pre-commit && chmod +x .git/hooks/pre-commit
```

The hook runs on every `git commit`: each **staged** path must match a root in `scripts/stage-allow.default.list`. Failures print the path and point back here.

## Agent / PR checklist

1. Edit only allowlisted trees (or extend `stage-allow.default.list` in the same PR).
2. Stage with:

   ```bash
   bash scripts/git-stage-allow.sh --default
   # or: bash scripts/git-stage-allow.sh path1 path2 …
   ```

3. Do **not** run `git add -A` / `git add --all` / `git add .` in agent scripts (`scripts/lint-teach-layout.mjs` forbids those command forms).
4. Optional: enable `core.hooksPath` as above so a stray `git add` outside the list cannot commit.
5. **Parallel agents:** `--default` can stage *your* allowlisted edits plus another agent’s WIP in the same trees. Always review `git diff --cached --stat` before commit. Unstage foreign paths (`git restore --staged -- …`). Prefer `bash scripts/git-stage-allow.sh -- path1 path2` for infra-only or lesson-only commits so a lesson message never lands on an infra index (and the reverse).

## CI note

Pages / `npm test` do not install git hooks on the runner. CI coverage is the lint forbid on blind git-add-all plus this docs path for humans/agents. A future PR workflow may add an explicit “staged-vs-allowlist” check when PRs are used; `main` push-main stays on allowlist staging locally.
