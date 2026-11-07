# Education promo

A4 briefing sheet for IMMSPFEE Education (classroom edition). Visual language matches `css/edu.css` (white sheet, terracotta accent, phase flow, Avenir/PingFang)—**not** the lab instrument chassis.

| File | Role |
| --- | --- |
| [poster.html](poster.html) | Printable A4 bilingual poster (+ `?speaker=1` 讲解员版) |
| [edu-logo.png](edu-logo.png) | Header wordmark (from `assets/`; max **300px**, aspect 461/123 like `index.html`) |
| [edu-qr.svg](edu-qr.svg) | QR → `https://otas0.github.io/immspfee-edu/` |

## Pages does not host `docs/`

GitHub Pages staging copies `index.html`, `sw.js`, `favicon.ico`, `assets/`, `css/`, `js/` only. **`docs/promo/` is local / repo-only.** Open the poster on the education preview server:

`http://127.0.0.1:4174/docs/promo/poster.html` (`npm start` / `npm run preview`).

Do not expect `https://otas0.github.io/immspfee-edu/docs/promo/poster.html` to exist.

## Preview

| Mode | URL |
| --- | --- |
| Briefing (bilingual, no lang pills) | `http://127.0.0.1:4174/docs/promo/poster.html` |
| Speaker (site-style EN/中文 pills) | `…/poster.html?speaker=1` · `?speaker=1&lang=zh` |

## Print / PDF

1. Prefer **`npm run poster:pdf`** → `.local-shots/poster-a4.pdf` (Chromium, A4, zero margins; gitignored).
2. Or browser Print → Paper **A4** · Scale **100%** · Margins **None**.
3. Speaker PDF: `POSTER_SPEAKER=1 npm run poster:pdf` (optional `POSTER_LANG=zh`).

## Reference shots (gitignored)

```bash
npm run capture:poster
# → .local-shots/poster-a4-reference.png
# → .local-shots/poster-340px-screen.png  (321–360 screen stack check)
```

See [`.local-shots/README.md`](../../.local-shots/README.md). PNGs are never committed.

## Design notes

- Sheet background is **white** (`#ffffff`). Briefing mode has **no** EN/中文 header pills; both languages stay on the page. Speaker mode reuses site pill chrome (`aria-pressed`) to switch language.
- Footer curriculum line: **沪科 / 人教 / University**.
- QR box includes the short path `otas0.github.io/immspfee-edu` for type-in fallback.
- Introduce → Explore → Check → Debug is a printable flow strip (not lab signal bars).

Sibling posters (different brands — do not copy their chassis): lab `physics-demo/poster.html`, buusdo `docs/promo/poster.html`.
