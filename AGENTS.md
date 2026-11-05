# Education edition

This repository is IMMSPFEE Education. Do not point it at the standard lab remote (`otas0/immspfee`).

- English is the source language for README, docs, UI chrome defaults, and new comments. Lesson titles exist in English and Chinese because the textbooks are Chinese.
- Every readout, check, and drawing for a ready lesson comes from the equations in `js/physics/`. Do not add decorative traces or canned answers.
- Do not paint assumption banners, fidelity badges, or “not for engineering use” strips on the stage, the chapter list, or the readout strip. Keep `authority` on the simulation object.
- A queued section stays empty. Do not ship a placeholder animation.
- Nuclear and modern items stay on public teaching relations (half-life, energy levels, mass–energy). Do not add device, yield, or production steps.
- `npm test` must stay green.

## Release

When a task is finished and `npm test` is green, commit and push `main` immediately so GitHub Pages deploys. Do not batch finished tasks. Do not wait to be asked again.

If the test fails, fix it before pushing. Never deploy a red tree.

Before pushing, check the remote. Push to `otas0/immspfee-edu` if the repo has been renamed; otherwise `otas0/immspfee-education`. Prefer `bash scripts/push-main.sh` (HTTP/1.1 + exponential backoff). Otherwise use `git -c credential.helper='!gh auth git-credential'` / a token HTTPS URL. Do not change git config. Do not touch `otas0/immspfee`.

Pages uses `concurrency.cancel-in-progress: true` so the latest main wins. Keep that default. Only consider `cancel-in-progress: false` if a release explicitly needs every intermediate SHA’s live smoke to finish; that is a deliberate trade-off, not the day-to-day path. Do not fire a second finished-task push while a prior Pages run is still queued or in progress—`scripts/push-main.sh` waits for watch before exiting. A cancelled run on an intermediate SHA is that race, not a content failure.

After each push, watch the Pages workflow until it succeeds (`push-main.sh` does this), or report the failure.

Lesson commits contain equations, simulations, curricula, and tests only. Logo commits contain only the logo asset, header CSS, and README URL lines. Never mix them.

Confirm that `https://github.com/otas0/immspfee-education` redirects to the renamed repo once the rename exists. Do not rename the repo if that work is already in progress; just check.
