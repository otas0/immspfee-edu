# IMMSPFEE Education

Classroom edition of IMMSPFEE. Lessons follow a textbook, one section at a time. The standard lab stays in its own repository ([otas0/immspfee](https://github.com/otas0/immspfee)) and is not this site.

This edition: [github.com/otas0/immspfee-edu](https://github.com/otas0/immspfee-edu) · [otas0.github.io/immspfee-edu](https://otas0.github.io/immspfee-edu/)

Every mapped lesson in Shanghai junior, Shanghai senior, PEP junior grade 8, and University physics draws readouts, checks, and the mistake overlay from the governing equations in `js/physics/`. The chapter tree shows only lesson titles—no Ready, Exam, or N/N chips. A section that is only queued stays empty on the stage; this tree currently has no queued secondary lessons. Textbook edition notes live under About in the teach column, not in the header.

## 中文说明（镜像）

IMMSPFEE 教育版：按教材一节一节上课。标准实验室在独立仓库 [otas0/immspfee](https://github.com/otas0/immspfee)，不是本站。

本版地址：[github.com/otas0/immspfee-edu](https://github.com/otas0/immspfee-edu) · [otas0.github.io/immspfee-edu](https://otas0.github.io/immspfee-edu/)

沪科初中、沪科高中、人教八年级，以及「大学物理」（地区标签「大学」）里已映射的节，读数、判定和排故叠层都来自 `js/physics/` 中的方程。章节树只显示节名；大学目录按学科折叠。仅排队的节舞台保持空白；当前树无排队的中学节。教材版次说明在授课栏的 About，不在顶栏。界面默认英文，可切中文。

## Run

```bash
npm test
npm start
```

Open http://127.0.0.1:4174/ . Deep link: `#/sh-junior/shj-4-4a/explore`.

Each new browser tab hard-boots once (clears this site’s Cache Storage and reopens with a fresh query) so a stale module cannot sit next to a newer curriculum. If the chapter list and the stage still disagree after a deploy, close the tab and open the site again, or hard-refresh once. When a new service worker is waiting, the page shows a bilingual “Site updated / Reload” bar instead of auto-reloading—click Reload rather than waiting for an automatic refresh. Add `?dev` to surface module import failures as a toast. Opening a lesson also prefetches the other simulations in that volume so Explore does not flash an empty stage.

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
- Shanghai senior, 沪科版 (2021). Compulsory 1–3 and elective 2 follow the published contents; elective 1 and 3 stay a chapter map. Mapped sections mount equation-backed simulations.
- PEP junior grade 8 (2024 contents). Cross-subject practicals stay on the tree with equation-backed sims where the relation is public.
- University physics (region label 大学; not a fourth textbook volume). Classical mechanics, electromagnetism, thermal/statistical physics, quantum physics, waves, optics, and relativity each mount public teaching relations (plane wave and displacement current, ideal gas and Carnot, infinite well and tunneling, Ising Metropolis with Onsager Tc, Maxwell speeds, Fourier square wave, membrane modes, Malus, thin film phase switch, laser cavity spacing, hydrogen radial density, coupled pendula, simultaneity ruler, Bell singlet correlation, Stern–Gerlach probabilities, and related forms).
