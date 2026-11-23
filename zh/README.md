# The Chinese overlay

Everything in this directory is applied to the `structs-webapp` submodule as it
is built. Nothing in the submodule is edited.

| Path | What it is |
|---|---|
| `strings/<upstream path>.json` | Chinese for one upstream file: `{"exact source text": "replacement"}` |
| `patches.cjs` | Changes that are not text: the guild connection, the telemetry name, date locale, translating struct-type data where it is read |
| `identity.json` | The guild this site is: id, name, tag, motto, badge. `@GUILD@`, `@TAG@`, `@MOTTO@` and `@BADGE@` in a strings file stand for these |
| `runtime/` | Loaded before webapp's entry: `__zh.t()` with `terms.json` (Chinese for game data from the guild API), `__zh.guild` (`guild.js`, the services of the guild the page plays through), `__zh.recovery` (`recovery.js`, moving a recovered player of another guild into it) and `__zh.account` (`account.js`, sign-up without the recovery key, Download Player) |
| `public/` | Static files served over webapp's: `zh/zh.css` (Chinese faces for webapp's fonts), the Chinese banner frames in `lottie/`, 画饼集团's badge and logo in `zh/img/` and its `guild.json` (guild `0-16`'s on-chain endpoint, `https://huabing.structs.zone/guild.json`) |
| `art/logo.py` | Draws the guild's badge and logo from its tag, after webapp's SN Corp badge (needs Pillow, fonttools, brotli) |
| `art/banners.py` | Draws those banner frames from webapp's (needs Pillow, fonttools, brotli); `banners.json` records which upstream frames they replace |
| `page.cjs` | Renders webapp's Twig page (`templates/`) to `index.html` |
| `loader.cjs`, `translate.cjs` | Apply `patches.cjs` then `strings/` to each source file webpack reads |
| `audit.cjs` | Reports stale entries, English still on screen and translations that don't fit their code |
| `GLOSSARY.md` | The words and voice to use |

## Writing a strings file

`strings/js/view_models/signup/IncomingCall1ViewModel.js.json`:

```json
{
  "'Incoming Call'": "'来电'",
  "<strong>Alert:</strong> Priority Call": "<strong>警报：</strong>紧急来电",
  "$keep": ["SN Corp"]
}
```

- A key is text copied exactly from the upstream file, and every occurrence in
  that file is replaced, in one pass, longest key first. Include enough around
  it (quotes, tags) that it can only match what a player reads, never an id,
  class, selector, event name, storage key or anything compared or sent to the
  guild or the chain.
- Keep `${…}` expressions, tags, attributes and the surrounding quotes; reorder
  them as Chinese needs. Translate readable attributes (`title`,
  `placeholder`, `alt`, `aria-label`, `data-sui-tooltip`).
- Text that is also used as a value in code (`STRUCT_TYPES` names, for one)
  stays English. Translate it where it is shown instead, calling the runtime:
  `"${structType.type}</div>": "${__zh.t(structType.type)}</div>"`, and add
  the word to `runtime/terms.json`. Not in `js/workers/` or what it imports: the
  task worker has no `__zh`.
- Upstream text built from fragments, or plural `s`, or a/an: handle it in the
  key so the result is correct Chinese.
- `${…}` must match its key exactly, but for the text inside `hl('…')`,
  `hint('…')` and `highlight('…')`, which is translated (see `js/tutorial/TutorialCopy.js.json`).
- `$keep` lists English left as is on purpose (names, units), as the audit prints them, so the
  audit stops reporting them. `keep.json` is the same list for every file.
- Only Chinese characters and the punctuation in `public/zh/zh.css`'s `unicode-range`
  are set in the pixel font. The audit reports any other new character.

Check a file as you go:

```bash
node zh/audit.cjs js/view_models/signup/IncomingCall1ViewModel.js
```

## Game data

`runtime/terms.json` follows the struct-type text guilds serve (structs-pg's
`struct_type` migrations). When a guild sends wording it doesn't have, the page
shows the English and logs `[zh] no Chinese for game data …` once.

## Regenerating the art

Only needed when the audit reports a banner frame as stale:

```bash
python3 -m pip install fonttools brotli pillow
python3 zh/art/banners.py
```
