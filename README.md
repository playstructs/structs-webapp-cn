# 构装体 — Structs in Chinese

The [structs-webapp](https://github.com/playstructs/structs-webapp) game
client, in Simplified Chinese. structs-webapp is a git submodule
(`structs-webapp/`, following its `main`) and its client is built as it is: its
own JavaScript, page, styles and art, with its webpack configuration as the
starting point. What this repository adds is the Chinese overlay in
[`zh/`](zh/README.md), applied while webpack reads webapp's sources. Nothing in
the submodule is edited, so a newer structs-webapp builds with the same overlay.

Only the client side is used. This site hosts no guild API of its own: the page
talks straight to a guild's API, its GRASS feed and its chain node, wherever the
guild runs them.

Onboarding and tutorial telemetry is reported with the interface name
`gouzhuangti` (`zh/patches.cjs`), so these runs can be told apart from other
clients' in a guild's reports (`?interface_name=gouzhuangti`).

## Setup

```bash
git clone --recurse-submodules <this repository>
npm install          # also installs structs-webapp/src's own dependencies
npm run dev          # http://localhost:5185
```

## Which guild

The site is 画饼集团's (`画饼`, guild `0-16`), the Chinese players' own guild.
[`zh/identity.json`](zh/identity.json) holds its id, the name, tag and motto
sign-up and the tutorial use where webapp says SN Corp, and its sign-up badge.
The id is fixed at build time and never looked up.

Webapp normally asks its guild API which guild it is (`/guild/this`), but 画饼集团
shares SN Corp's API, so the page asks for `/guild/0-16` instead. Before webapp's
code starts, the page reads the guild's `guild.json` (the endpoint the guild set
on chain, `https://huabing.structs.zone/guild.json`, which this site serves from
[`zh/public/guild.json`](zh/public/guild.json)) for its `guild_api`, `grass_nats_websocket` and `client_websocket`
(`zh/runtime/guild.js`). If it can't be read, it uses what it last read, then
the fallback in `webpack.config.js`. Requests carry a bearer token from the
guild's `/api/auth/token` (the same signed login as `/api/auth/login`), since a
guild's session cookie would be third-party here.

Account recovery asks the chain which guild the key's player is in before it
calls the guild API. A player of another guild is moved here first: the key
signs `MsgGuildMembershipJoin` for this guild (allowed when its join minimum is
0), and recovery goes on once the chain shows the move and the guild API knows
the player. Recovery stops instead when the player owns their guild, the guild
asks a join minimum, or the chain can't be read (`zh/runtime/recovery.js`).

| Variable (build time) | Default | |
|---|---|---|
| `ZH_LCD_URL` | `https://public.testnet.structs.network` | the chain node the guild is read from |
| `ZH_GUILD_API` | — | a fixed guild API (a local guild in development), skipping guild.json |
| `ZH_GRASS_URL`, `ZH_CHAIN_WS` | — | override what the guild publishes |

### On chain

| | |
|---|---|
| Guild | `0-16` Huabing Jituan (画饼集团), owned by founder player `1-14689` (`structs1f7h5l7ajp2xt8a6tqxd4edkusgj0eylrsx2d9v`) |
| Primary reactor | `3-2` ChainTools |
| Entry substation | `4-27`, fed by allocation `6-77` from the guild's own stake |
| Joining | open: join minimum 0, invite bypass permissioned |
| Endpoint | `https://huabing.structs.zone/guild.json` |
| Sign-up (TSA) | player `1-14692` (`structs10gakhuwry4ssqn3lfmcl9x5l8flgmwpynnyu8h`), the host's proxy-join signer: 512 (GuildMembership) on `0-16`, 1024 (SubstationConnection) on `4-27` |
| Bank denom | `dabing` / `zhima` (in guild.json) |

It was founded with the Latin tag `HUABING`, the only kind the founding tool
takes; guild.json's `画饼` is the one shown.

Its name is spelled in Latin for now, on chain and in guild.json;
`zh/identity.json` still has 画饼集团 for sign-up and the tutorial.

## Sign-up and the player's key

Sign-up has no recovery key section: once the player has chosen their name,
the page makes their account's key (a mnemonic) and creates the account
straight away, with nothing shown, explained or confirmed, and goes on to the
success screen. If the guild can't create it, the player sees why and can try
again (重试) with the same key (`zh/runtime/account.js`).

The Account page has **下载玩家** (Download Player) where webapp has
Log Out: a text file, `<name>-<player id>.structs-player.txt`, holding the
mnemonic this browser signs with. After sign-up that is the account's own key;
after an account recovery or a device activation it is this browser's device
key, which can recover the player too, for as long as that device stays
registered.

## Building and serving

```bash
npm run build        # dist/
```

`dist/` is a static site: `index.html` (webapp's game page),
`sector-blitz/index.html` and one page per sector (the public Sector Blitz
leaderboard), the bundles in `js/` and webapp's `css/`, `img/`, `lottie/` and
fonts. It uses absolute paths, so serve it from the root of
`huabing.structs.zone`;
`guild.json` must be readable cross-origin (`Access-Control-Allow-Origin: *`),
since other clients read it. GitHub Pages sends that header for every file.
`.github/workflows/pages.yml` publishes `main` to GitHub Pages.

## Updating structs-webapp

```bash
npm run update:webapp
```

This moves the submodule to the latest `main`, installs its dependencies and
runs the audit, which lists what the update touched:

| Report | Meaning | What to do |
|---|---|---|
| `stale` | an entry's English changed upstream, or its art source did | fix the key and translation in `zh/strings/`, or run the script it names |
| `untranslated` | new English a player would read | add it to `zh/strings/` |
| `orphan` | the upstream file is gone | move or delete the strings file |
| `broken`, `mismatch` | a translation no longer fits its code | fix the entry |

`npm test` fails while any remain. Commit the submodule pointer together with
the overlay.

## Licences

structs-webapp is Apache-2.0 (Slow Ninja Inc). Fusion Pixel 12px SC, the Chinese
pixel font that `zh/public/zh/zh.css` gives webapp's fonts, is SIL OFL 1.1; it
comes from the `@fontsource/fusion-pixel-12px-proportional-sc` package, and the
build serves its licence as `zh/fonts/FusionPixel-LICENSE.txt`.
