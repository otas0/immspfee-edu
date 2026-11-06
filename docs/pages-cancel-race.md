# Pages `cancel-in-progress` — observation note

Workflow concurrency keeps `cancel-in-progress: true` (latest `main` wins).

## Local fixture (already covered)

`PUSH_RESUME_FIXTURE=1` feeds `pick_latest_run_id_for_sha` two runs with the **same** `headSha` and different `createdAt`; the newer `databaseId` wins. That models the cancelled+queued pair without hitting the live Actions API.

`PUSH_WATCH_FLAKE_FIXTURE=1` covers a different false-red: jobs / run-view API miss **after** deploy already `completed/success` in a last-good heartbeat → soft exit 0 (`soft_ok_jobs_flake`). That is **not** a cancel race.

## API flake ≠ cancel (false-red)

Seen on `5e80be1` / run `42193209859`: heartbeats showed deploy+capture success, then a late `(jobs unavailable)` / empty `gh run view` conclusion made `push-main` exit 1 even though Pages had already succeeded.

`push-main.sh` now:

- Treats `(jobs unavailable)` as a **transient** miss (does not wipe last-good Heartbeats rows).
- Soft-oks when conclusion poll is empty but last-good already has `deploy=completed/success`.
- Polls `gh run view` conclusion several times before a hard exit 1.
- Dumps artifact browse/api URLs only after conclusion (or soft-ok) is decided.

Do not open a content-failure issue for this pattern; re-check the run URL. Keep DEP0040 / `deploy-pages` #413 bump tracking separate from push-watch flake work.

## Live observation (optional, when a real race appears)

When a finished-task push lands while a prior Pages run is still `queued` / `in_progress`:

1. Note both run URLs for the same short SHA (or prior SHA cancelled + new SHA queued).
2. Confirm `push-main.sh` watches the **newest** run id for `HEAD` (not the cancelled sibling).
3. A cancelled intermediate SHA is a concurrency race, not a content failure — do not open a fix issue solely for `cancelled`.

### Check log (2026-11-06)

- Scanned last 30 `pages.yml` runs on `otas0/immspfee-edu`: **no** `headSha` with 2+ runs (no live cancelled+queued pair in that window). Fixture coverage remains the authority until a real race appears — paste run URLs here when it does.
- Redirect retries diag on [run 42227103682](https://github.com/otas0/immspfee-edu/actions/runs/42227103682) (`a1f7c89`): `RR="0"` (numeric, non-empty) — empty-string `::warning` did **not** fire. Good wiring check for the non-empty path.

Do not change `cancel-in-progress` to `false` unless a release explicitly needs every intermediate SHA’s live smoke to finish.
