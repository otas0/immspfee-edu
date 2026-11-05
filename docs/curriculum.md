# Curriculum data

A book is a tree:

`region → book → volume → chapter → section → lesson`

A lesson is either `ready` or `queued`.

- `ready` names a simulation id in `js/sims/registry.js` and a `preset` that is merged onto that simulation’s parameters.
- `queued` has `sim: null` and a one-line `intent` naming the relation to implement later. The stage does not draw it.

The same simulation id can appear in more than one book. Shanghai junior and PEP junior both use `convex-lens`; the thin-lens equation is not copied.

## Shanghai junior chapters 4–7

These sections are the first complete pass. Each one has at least one ready lesson with introduce → explore → check → debug.

| Chapter | What is running |
|---|---|
| 4 Light | Pinhole (similar triangles), reflection, plane mirror, Snell, thin lens, spectacle correction |
| 5 Force | Moment, Hooke, weight, collinear resultant, two-force equilibrium, Coulomb friction, cart and block |
| 6 Density and pressure | ρ = m/V, cylinder lab, p = F/A, ρgh and a U-tube, Torricelli, continuity plus Bernoulli |
| 7 Buoyancy | Pressure difference on a cube, weighing method, Archimedes, float / suspend / sink |

## Shanghai junior chapter 10

Specific heat is ready. Two samples share one heat input, and each temperature rise is ΔT = Q / (c m). The other sections of that chapter stay queued.

## Adding a section

1. Add the section to the book module under `js/curricula/`.
2. If the simulation already exists, set `sim` and a preset. Do not fork the equation.
3. If it does not, add a queued lesson with the relation in `intent`.
4. A new simulation needs a pure function in `js/physics/`, a canvas in `js/sims/`, and a case in `scripts/test-edu.mjs` with a known numerical result.
