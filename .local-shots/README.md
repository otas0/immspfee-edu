# Local viewport captures

PNGs here are **not** committed (see `.gitignore`). Regenerate after chrome or projectile layout changes.

| File | Viewport | Expect |
| --- | --- | --- |
| `340px-projectile-ellipsis.png` | **340×720** (321–360 band) | Projectile **stacked** teachPanel (`w <= 360`); book-select still **`text-overflow: ellipsis`** (clip only at `@media (max-width: 320px)`). |
| `320px-pep-zh-book.png` | 320×720, `lang=zh` | 「人教版初中物理」 fully visible; computed `text-overflow: clip`. |
| `320px-projectile-stack.png` | 320×720 | Strobe path above stacked x–t · y–t panel. |

Suggested capture (with preview on `:4174`):

```bash
bash scripts/ensure-dev-server.sh --no-exec
# Playwright or browser: width 340 → #/sh-senior/shs-5-1a/introduce
# Save as .local-shots/340px-projectile-ellipsis.png
```

Policy is also noted in `AGENTS.md` (321–360px bullet).
