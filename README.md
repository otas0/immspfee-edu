# IMMSPFEE Education

Classroom edition of IMMSPFEE. Lessons follow a textbook, one section at a time. The standard lab stays in its own repository ([otas0/immspfee](https://github.com/otas0/immspfee)) and is not this site.

This edition: [github.com/otas0/immspfee-edu](https://github.com/otas0/immspfee-edu) · [otas0.github.io/immspfee-edu](https://otas0.github.io/immspfee-edu/)

Shanghai junior chapters 4–7 were the first complete slice. Chapters 2, 8, and the melting curve, plus the grade-9 circuit, now run from the same rule: readouts, checks, and the mistake overlay come from the governing equations. The 2021 沪科 compulsory books and elective 2 are sectioned from the published contents; the v–t area, horizontal projectile, and energy track are the first senior simulations. PEP grade 8 follows the 2024 contents. The university list is still entrances, and classical mechanics is the one with simulations. A section that is only mapped does not draw a stand-in animation.

## Run

```bash
npm test
npm start
```

Open http://127.0.0.1:4174/ . Deep link: `#/sh-junior/shj-4-4a/explore`.

Each new browser tab hard-boots once (clears this site’s Cache Storage and reopens with a fresh query) so a stale module cannot sit next to a newer curriculum. If the chapter list and the stage still disagree after a deploy, close the tab and open the site again, or hard-refresh once.

Switch the textbook in the header. Shanghai junior and PEP junior share one simulation pool; only the chapter order changes. Language is English by default, with 中文 for the same chrome.

## A lesson

Each ready lesson has four steps:

1. Introduce — what the section is asking
2. Explore — parameters and dragging
3. Check — questions whose correct option is computed from the current state
4. Debug — a common mistake drawn next to the equation, not instead of it

Queued sections stay on the tree with the relation they will use. The stage stays empty.

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
- Shanghai senior, 沪科版 compulsory and elective, mapped from the chapter list for this edition. Simulations are not built yet.
- PEP junior grade 8 in the 2011-standards order. The 2024 PEP reprint is not this tree.
- University entrances (mechanics, electromagnetism, thermal physics, quantum physics, waves, optics). Not a fourth textbook volume.
