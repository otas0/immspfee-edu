# Education promo

A4 briefing sheet for IMMSPFEE Education (classroom edition). Pure white sheet and logo top bar, black ink only—**not** the lab instrument chassis (no cream paper).

| File | Role |
| --- | --- |
| [poster.html](poster.html) | Printable A4 bilingual poster (+ `?speaker=1` 讲解员版) |
| [poster-copy.js](poster-copy.js) | Bilingual copy table (single source) |
| [poster-books.json](poster-books.json) | Coverage line from curricula (`npm run sync:poster-books`) |
| [edu-logo.png](edu-logo.png) | Header wordmark (from `assets/`) |
| [edu-qr.svg](edu-qr.svg) | QR → `https://otas0.github.io/immspfee-edu/` |

## Pages does not host `docs/`

GitHub Pages staging copies `index.html`, `sw.js`, `favicon.ico`, `assets/`, `css/`, `js/` only. **`docs/promo/` is local / repo-only.** Open:

`http://127.0.0.1:4174/docs/promo/poster.html` (`npm start`).

Do not expect `https://otas0.github.io/immspfee-edu/docs/promo/poster.html`.

## Preview

| Mode | URL |
| --- | --- |
| Briefing (bilingual, no lang pills) | `…/poster.html` |
| Speaker (site-style EN/中文 pills, larger QR) | `…/poster.html?speaker=1` · `&lang=zh` |

## Print / PDF (A4 打全)

Physical printers often keep a non-zero margin even when the dialog says “None”. The sheet uses a **6mm safe inset** (`--safe`) so content is not cropped.

1. Prefer **`npm run poster:pdf`** → `.local-shots/poster-a4.pdf` (Chromium, one page; gitignored).
2. Or browser Print → **A4 · Scale 100% · Margins None**.
3. `npm run capture:poster` asserts **1 PDF page**, books row visible, no pane clip, and writes `.local-shots/poster-a4-fit.json`.

Speaker PDF: `POSTER_SPEAKER=1 POSTER_LANG=zh npm run poster:pdf`.

If Chromium is missing, `poster:pdf` prints install steps for `/tmp/pw-shot` or `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH`.

## Reference shots (gitignored) — local 对照

After any poster/logo/QR edit, regenerate and eyeball-diff (never commit PNGs/PDF):

```bash
npm start                   # :4174
npm run sync:poster-books   # refresh coverage line from js/curricula
npm run capture:poster
# → .local-shots/poster-a4-reference.png
# → .local-shots/poster-340px-screen.png
# → .local-shots/poster-speaker-zh.png
# → .local-shots/poster-a4.pdf + poster-a4-fit.json
# Open PNGs: brand ≤300px; 340px one-column; no horizontal overflow.
```

See [`.local-shots/README.md`](../../.local-shots/README.md) (**Poster baseline 对照**).

## QR / live site

Typed short path and QR target: `https://otas0.github.io/immspfee-edu/` (verify with `curl -sI`). Pages does not serve this poster HTML.

Sibling posters (different brands — do not copy their chassis): lab `physics-demo/poster.html`, buusdo `docs/promo/poster.html`. Lint: `npm run lint:poster` bans Space Grotesk / IBM Plex.
