# Local viewport captures

PNGs here are **not** committed (see `.gitignore`). Regenerate after chrome or projectile layout changes.

| File | Viewport | Expect |
| --- | --- | --- |
| `340px-projectile-ellipsis.png` | **340×720** (321–360 band) | Projectile **stacked** teachPanel (`w <= 360`); book-select still **`text-overflow: ellipsis`** (clip only at `@media (max-width: 320px)`). |
| `340px-zh-long-title-ellipsis.png` | **340×720**, `lang=zh` | Force a long selected label (e.g. 「沪科版初中物理（上海科学技术出版社·五四制全日制…）」). Expect **`text-overflow: ellipsis`** and canvas `measureText` width + padding **>** select `clientWidth` (`scrollWidth` on `<select>` is often equal to `clientWidth` even when truncated). |
| `320px-pep-zh-book.png` | 320×720, `lang=zh` | 「人教版初中物理」 fully visible; computed `text-overflow: clip`. |
| `320px-projectile-stack.png` | 320×720 | Strobe path above stacked x–t · y–t panel. |

Suggested capture (with preview on `:4174`):

```bash
bash scripts/ensure-dev-server.sh --no-exec
# 340px band (short title may still fit — pad the selected <option> to force ellipsis):
#   width 340 → #/sh-junior/… or #/sh-senior/shs-5-1a/introduce, lang=zh
#   option text ← 「沪科版初中物理（上海科学技术出版社·五四制·2024）」
#   Save as .local-shots/340px-zh-long-title-ellipsis.png
```

Policy is also noted in `AGENTS.md` (321–360px bullet).
