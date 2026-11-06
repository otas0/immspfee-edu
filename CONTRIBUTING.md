# Contributing (education edition)

Linked from the top of [README.md](README.md).

- Stage with `bash scripts/git-stage-allow.sh --default` (never blind `git add -A`). Optional: `git config core.hooksPath scripts/githooks` — see [docs/hooks/stage-allow.md](docs/hooks/stage-allow.md).
- Local health: `npm run doctor` (not on Pages). Doctor fixtures (no server): `DOCTOR_FIXTURE=auto-ensure-0` · `auto-ensure-1` (mock ensure) · `missing-ready`.
- Minkowski sticky γ/Δt: wait for product confirmation on [issue #1](https://github.com/otas0/immspfee-edu/issues/1) before changing the sticky map or painting hi (map+smoke first, paint `hi` last).
- Offline-first PRECACHE flip: [ADR 001](docs/adr/001-ui-chrome-precache.md) + `npm run offline-first:dry-run` (`OFFLINE_FIRST_FIXTURE=1` / `OFFLINE_FIRST_REALTREE=1`; optional `OFFLINE_FIRST_REQUIRE_MP=1`). **Do not open a real flip PR until ADR gates are checked.** Local rehearsal: `npm run offline-first:sidebranch`.
- Pages cancel race: [docs/pages-cancel-race.md](docs/pages-cancel-race.md) (paste dual run URLs when a real cancelled+queued pair appears).
- deploy-pages DEP0040: stay on `@actions/deploy-pages@v5` until [actions/deploy-pages#413](https://github.com/actions/deploy-pages/issues/413) ships v5.0.2+; bump only after confirming the punycode warning is gone (separate from push-watch flake soft-ok).
- `push-main` watch: `PAGES_CONCL_POLLS="tries delay"` (default `5 2`); `PUSH_PRECLEAR_PROXY=0` skips proxy preclear; `PUSH_MAIN_DEBUG=1` for completed-heartbeat suppress noise; soft-ok summary must contain `soft_ok_jobs_flake` (demo: `.local-shots/push-main-soft-ok-demo.md` via `PUSH_WATCH_FLAKE_FIXTURE=1`).
