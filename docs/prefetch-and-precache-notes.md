# Prefetch / PRECACHE product notes (2026-11-06)

## University first-open

Subject volumes (`uni-cm` … `uni-rel`) bound idle prefetch to the active subject. Measure with `npm run bench:uni-first` (also written into the Pages job summary). Browser Network: open `#/university/uni-cm-1/introduce` cold and confirm chapter sims load first; optics / Ising groups must not appear until another volume is opened.

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
| `deploy-pages` bump | Latest still **v5.0.1**; DEP0040 soft until upstream v5.0.2+ |
| Minkowski γ/Δt sticky | [#1](https://github.com/otas0/immspfee-edu/issues/1) unchecked — β only |
| Close #1 as not planned | Only after explicit product “no” |
| OFFLINE_FIRST flip PR | ADR 001 gates 1–5 unmet |
| True L di/dt sim | See `docs/defer-eddy-inductance.md` |
| cancel+queued dual URLs | Still no live pair; paste into `docs/pages-cancel-race.md` when seen |
