# Pages `cancel-in-progress` — observation note

Workflow concurrency keeps `cancel-in-progress: true` (latest `main` wins).

## Local fixture (already covered)

`PUSH_RESUME_FIXTURE=1` feeds `pick_latest_run_id_for_sha` two runs with the **same** `headSha` and different `createdAt`; the newer `databaseId` wins. That models the cancelled+queued pair without hitting the live Actions API.

## Live observation (optional, when a real race appears)

When a finished-task push lands while a prior Pages run is still `queued` / `in_progress`:

1. Note both run URLs for the same short SHA (or prior SHA cancelled + new SHA queued).
2. Confirm `push-main.sh` watches the **newest** run id for `HEAD` (not the cancelled sibling).
3. A cancelled intermediate SHA is a concurrency race, not a content failure — do not open a fix issue solely for `cancelled`.

Do not change `cancel-in-progress` to `false` unless a release explicitly needs every intermediate SHA’s live smoke to finish.
