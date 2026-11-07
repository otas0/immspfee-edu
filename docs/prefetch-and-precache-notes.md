# Prefetch / PRECACHE product notes (2026-11-06)

## University first-open

Subject volumes (`uni-cm` … `uni-rel`) bound idle prefetch to the active subject. Measure with `npm run bench:uni-first` (also written into the Pages job summary beside Network probes).

```bash
npm run probe:uni-prefetch                 # uni-cm-1 → advance only
PROBE_LESSON=uni-qm-1 npm run probe:uni-prefetch  # stat (+ uni); no optics
```

Pages capture job prints both probes next to the bench JSON so volume-split prefetch stays visible in the summary.

## Circuit layout locks

| Starter | Explore layout control |
| --- | --- |
| ohm / household | `lockLayout: true` — no starter jump at all |
| series / parallel | `blockHousehold: true` — half-lock: may switch series↔parallel↔ohm, never household |

Do not half-lock ohm further: it is already fully locked.

## Minkowski sticky (#1)

Weekly check: if [#1](https://github.com/otas0/immspfee-edu/issues/1) gains a checked product box, extend γ/Δt sticky (schema → smoke → paint). If product says no, close as not planned. Until then β-only.

## `phase.js` / `rel.js` vs SW PRECACHE

**Decision: stay off PRECACHE.** Same rationale as ADR 001 for `ui-chrome` / `uni-fold`:

- Loaded on demand through stamped `registry.js` → group modules.
- Putting phase/rel on PRECACHE would widen first install for every visitor who never opens melting or length-contraction.
- Revisit only if offline-first first paint must include those lessons without a network round-trip (product ask + ADR flip template).

## PEP「测量」— balance / thermometer

- `pep-1-1` Length and time: **ruler + stopwatch only** (matches the section title).
- Thermometer already mounts under temperature (`pep-3-1a`); balance under mass (`pep-6-1a`).
- **Do not** hang balance/thermometer beside length-and-time — wrong chapter mapping.

## Gate holds (do not ship until product)

| Item | Hold |
| --- | --- |
| `deploy-pages` bump | Latest still **v5.0.1**; **#433 still open / unmerged** (re-checked 2026-11-07 late) — hold pin; **bump the day #433 merges** and confirm DEP0040 gone in deploy logs |
| `ubuntu-24.04` → 26 | Pin stays; on runner-images announcement change: `npm run probe:ubuntu26` then dry-branch Pages (`runs-on: ubuntu-latest`) before moving main |
| Minkowski γ/Δt sticky | [#1](https://github.com/otas0/immspfee-edu/issues/1) still open / checkboxes unchecked — β only |
| Close #1 as not planned | Only after explicit product “no” |
| OFFLINE_FIRST flip PR | **Gate 1 unmet** — do **not** open flip PR until product explicit yes; local only `npm run offline-first:sidebranch` |
| Safari 真机 320 | Computer Use ACL still required for 真机 topH / 「人教」abbrev confirm |
| hard-boot e2e soft→hard | Capture job stays `continue-on-error` until repo var `HARD_BOOT_E2E_STRICT=true` (flip after ≥3 green `hard_boot_e2e` runs) |
| Disk-stamp e2e preview | Optional `HARD_BOOT_E2E_DISK_STAMP=1` → `scripts/e2e-disk-stamp-preview.sh` (:4175); default remains Playwright route-stamp |
| True L di/dt sim | See `docs/defer-eddy-inductance.md` |
| cancel+queued dual URLs | Still no live pair; paste into `docs/pages-cancel-race.md` when seen |
| SW Reload analytics | No product telemetry yet — DOM/CSSOM smoke only (`smoke-hard-boot`); true “did users click?” needs product ask |
