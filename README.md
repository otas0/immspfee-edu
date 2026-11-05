# IMMSPFEE Education

Classroom edition of IMMSPFEE. Lessons follow a textbook, one section at a time. The standard lab stays in its own repository ([otas0/immspfee](https://github.com/otas0/immspfee)) and is not this site.

This edition: [github.com/otas0/immspfee-edu](https://github.com/otas0/immspfee-edu) · [otas0.github.io/immspfee-edu](https://otas0.github.io/immspfee-edu/)

Every mapped lesson in Shanghai junior, Shanghai senior, PEP junior grade 8, and the university entrances is Ready: readouts, checks, and the mistake overlay come from the governing equations in `js/physics/`. A section that is only queued would stay empty; this tree currently has no queued secondary lessons.

## Run

```bash
npm test
npm start
```

Open http://127.0.0.1:4174/ . Deep link: `#/sh-junior/shj-4-4a/explore`.

Each new browser tab hard-boots once (clears this site’s Cache Storage and reopens with a fresh query) so a stale module cannot sit next to a newer curriculum. If the chapter list and the stage still disagree after a deploy, close the tab and open the site again, or hard-refresh once. When a new service worker is waiting, the page shows a bilingual “Site updated / Reload” bar instead of auto-reloading. Add `?dev` to surface module import failures as a toast. Opening a ready lesson also prefetches the other ready simulations in that volume so Explore does not flash an empty stage.

Switch the textbook in the header (narrow screens use a one-line book dropdown). Shanghai junior and PEP junior share one simulation pool; only the chapter order changes. Language is English by default, with 中文 for the same chrome.

## A lesson

Each ready lesson has four steps:

1. Introduce — what the section is asking
2. Explore — parameters and dragging
3. Check — questions whose correct option is computed from the current state
4. Debug — a common mistake drawn next to the equation, not instead of it

## Layout

| Path | Role |
|---|---|
| `js/curricula/` | Region → book → chapter → section → lesson |
| `js/physics/` | Equations used by the checks and the pictures |
| `js/sims/` | Canvas, parameters, checks, mistake overlay |
| `js/app.js` | Shell, hash route, phase machine |

Authorities for the equations are on each simulation (`authority`). They are not printed as banners on the stage.

## Books in this edition

- Shanghai junior, 沪科版五四制 (2024), Shanghai Science and Technology Publishers. Contents titles for the 17 chapters match the published books. Rectilinear propagation is a chapter opening before §4.1, because the 2024 contents page titles that section “光的反射”.
- Shanghai senior, 沪科版 (2021). Compulsory 1–3 and elective 2 follow the published contents; elective 1 and 3 stay a chapter map. Ready simulations cover the mapped sections.
- PEP junior grade 8 (2024 contents). Cross-subject practicals stay on the tree with equation-backed sims where the relation is public.
- University physics · entrances (not a fourth textbook volume). Classical mechanics, electromagnetism, thermal/statistical physics, quantum physics, waves, and optics each mount public teaching relations (plane wave and displacement current, ideal gas and Carnot, infinite well and tunneling, Ising Metropolis, Maxwell speeds, Fourier square wave, membrane modes, Malus, thin film, laser cavity spacing, Bell singlet correlation, Stern–Gerlach probabilities, and related forms).
