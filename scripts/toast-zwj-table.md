# toastErrorDetail ZWJ / code-point truncation

`toastErrorDetail(err, maxLen, opts)` prefers `Intl.Segmenter` graphemes; with `{ forceCodePoints: true }` (or no Segmenter) it truncates by Unicode code point and **peels trailing ZWJ** (`U+200D`) before the ellipsis.

| Input (conceptual) | maxLen | Path | Expected shape |
| --- | ---: | --- | --- |
| `👨‍👩‍👧` ×5 | 3 | Segmenter | 2 family graphemes + `…` |
| `👨‍👩‍👧` ×5 | 3 | `forceCodePoints` | ends with `…`, **never** `ZWJ…` |
| `🏴‍☠️` ×4 | 3 | Segmenter | 2 flag graphemes + `…` |
| `🏴‍☠️` ×2 | 3 | `forceCodePoints` | ends with `…`, **never** `ZWJ…` |
| `汉` ×80 | 5 | either | `汉汉汉汉…` (4 + ellipsis) |

Flag code points (for the forceCodePoints path): `🏴` (U+1F3F4) · ZWJ · `☠` (U+2620) · VS16 (U+FE0F).

Covered by `scripts/smoke-layout.mjs` (Ising toast / ZWJ block).
