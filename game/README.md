# Games (static, no account, no database)

**Release plan: one game at a time.** Only `public/` is deployed. Finished games that are not announced yet wait in `public/try-6d7b31c6ea/` (not linked anywhere, only the owner knows the address). To release one: `sh game/release.sh sort` (or `kids`), commit, push.

- Released: Fruit Catch (`/fruit/`), English Friends (`/abc/`)
- Held back: Juice Sort, Animal Friends (private test folder, see below)

- `/` Fruit Catch · ចាប់ផ្លែឈើ
- `/kids/` Animal Friends · មិត្តសត្វ (for small children: pick a cartoon animal, catch its favourite food, silly items bounce away, no losing, a star + confetti every 5 catches, synthesised sounds and soft background music, no ads, no links out except back to the games)
- `/abc/` English Friends · មិត្តអង់គ្លេស (kids learn 36 English words in 6 little stories: farm, fruits, colours, numbers, family, body. The phone says the word, the child taps the picture, then spells short words; no losing, gentle hints, stars, stickers, confetti, soft music; Khmer meaning shown; nothing is sent anywhere)
- `/sort/` Juice Sort · ទឹកផ្លែឈើ (colour-sorting puzzle: pour layers between bottles, levels 1-60+ generated and checked solvable, undo, restart, one extra bottle per level, progress saved)

# Fruit Catch · ចាប់ផ្លែឈើ

A small casual game (static page, no account, no database). Drag a finger (or use the arrow keys) to catch falling fruit in the basket; avoid the bugs. 3 lives, levels every 10 points, gold pineapple +5, best score saved on the phone, Khmer / English, sound on/off, pause, share score. Works offline once opened (PWA).

Art is plain emoji and the mechanic is generic; nothing is copied from another game.

## Cloudflare setup (no database needed)
1. Pages project `game`: connect this repo, root directory `game`, build output `public`, no build command.
2. Optional custom domain, e.g. `play.soramma.app`.

Tests: `node tests/gate_test.js` (what is public), `node tests/game_test.js`, `node tests/sort_test.js`, `node tests/kids_test.js`, `node tests/abc_test.js` (Playwright; controls, scoring, lives, level-up, pause, game over, best score).

## Visitor counter (owner only)
- Games send anonymous events (`visit`, `play`, `install`, `share`, `fb`) to `/api/hit` (`game/public/track.js`). Only a random id made in the phone is stored — no name, number or IP.
- Owner page: `https://play.soramma.app/admin.html` (needs the secret `ADMIN_CODE`).
- Cloudflare setup for project **game** (one time): Settings → Bindings → add **D1 database**, variable name `DB`, pick the existing shared database `soramma-laundrypro-db` (tables are prefixed `gm_`); Settings → Variables and Secrets → add secret `ADMIN_CODE`; then redeploy.
- Use `?s=name` on a link to label where it was shared (e.g. `play.soramma.app/?s=fb-post1`).
- Put the Facebook Page link in `FB` at the top of `game/public/track.js` to turn the "coming soon" line into a tap-to-follow link that is counted.
- Tests: `node game/tests/stats_test.mjs`, `node game/tests/stats_e2e.js`.

## English Friends: human voice
- The game plays recorded words: first recordings made on this phone (`abc/record.html`, stored on the phone only), then the bundled files `abc/audio/*.mp3` (synthetic fallback), then the phone's own voice.
- To ship a real human voice to everyone: record the 36 words with `abc/record.html`, tap export, send `english-friends-voice.json`; convert with ffmpeg into `abc/audio/<word>.mp3`.
- Tests: `node tests/abc_rec_test.js`.

## Home page, names and privacy (Fruit Catch)
- Home page: your name, best score, Play, Shop, 🏆 Leaderboard, 🤝 Challenge a friend. The leaderboard (today / this week / all time, top 10) is PUBLIC BUT ANONYMOUS: rows show 🥇🥈🥉/#N, a "?" Player, level (from the score) and score, plus how many players there are and how many reached each level (chips like "Lv 5: 3", from `dist` in `/api/top`); only your own row shows your name. After a game you see your place and the number of players. Every score is saved even with no name; names (if typed) are stored server-side and only the owner sees them (`/api/top` returns names only with the owner code).
- Scores are sent to `/api/score` after a game if the player typed a name (nickname only). A score must be possible for the time played (max about 15 points per second) and one phone may send 60 per day. Anyone can still forge a request, so this is a friendly board, not a verified contest: do not give money prizes without checking the top scores by hand.
- Remove a name: `curl -X POST https://play.soramma.app/api/score-delete -H 'x-admin-code: <ADMIN_CODE>' -d '{"name":"BadName"}'`.
- Cambodia time (UTC+7) decides the day; the week starts on Monday.
- Tests: `node game/tests/score_test.mjs`, `node game/tests/home_e2e.js`, `node game/tests/challenge_test.js`.

## Addresses: one address per game, no combined list
- `fruit.soramma.app` -> Fruit Catch; `english.soramma.app` -> English Friends. Add each as a **custom domain of the Pages project "game"**; `game/functions/_middleware.js` serves that game's folder at the root of its own address (the data service `/api/*` and `track.js` are shared). Add a new game by adding one line to `HOSTS` and the domain.
- Old path style keeps working: `play.soramma.app/fruit/`, `play.soramma.app/abc/`; `play.soramma.app/` and old challenge/post links (`?c=`, `?s=`) open Fruit Catch. `admin.html` stays on `play.soramma.app`.
- The games do not link to each other (no combined list).
- Tests: `node game/tests/host_test.mjs`, `node game/tests/host_e2e.js`.

## Owner page (`play.soramma.app/admin.html`)
- One private page for the owner (secret `ADMIN_CODE`): every game and app in one list with status (released / held back / not set up), an Open button each, visitor and play numbers per game, per-day and per-source charts, and the Fruit Catch leaderboard with a ✕ button to remove a name.
- The list of apps/games (including the private test addresses) lives in `game/functions/api/[[path]].js` (`OWNER`) and is only sent to someone who knows the code; the public page file contains no private addresses. Update `OWNER` when a game is released or an app is added.
- Tests: `node game/tests/owner_e2e.js`. Note: the test servers must serve folder addresses (`/fruit/`).

## Fruit Catch: coins, upgrade shop, ready-made messages
- Coins: +1 per fruit, +3 per golden pineapple, plus 1 per 20 points at the end of a game; kept on the phone only (`fc_coins`).
- Upgrade shop (bought items last ONE game only; one purchase each; first-time prices heart 80 / basket 150 / magnet 220, rising on every re-buy (x1.5, x2.25) until the game is closed; heart +2 lives, basket +24%, magnet radius 150): extra starting lives (+1 per level), bigger basket (+12% per level), magnet (pulls nearby fruit, never bugs; radius 90 / 150 / 220 px). Continue after game over costs 80 / 120 / 200 coins (1st / 2nd / 3rd in the same game).
- Fairness note: upgrades help players score more on the shared leaderboard; the server still rejects scores impossible for the time played. If this feels unfair, give upgrades their own board or switch them off for ranked play.
- Messages: the challenge link can carry one of 4 ready-made messages (`m=0..3`), no free text, so there is nothing to moderate.
- Design: sun, drifting clouds, mountains, hills, mango trees, flowers behind the game.
- Test: `node game/tests/shop_test.js`.

## Android / Google Play (prepared, not published)
`game/android/` holds the Google Play kit for Fruit Catch: step-by-step `README.md`, store texts `listing.md`, screenshots and feature graphic (`store/`), and `make-store-assets.js`. The privacy policy is the page `/privacy/`. Publishing needs the owner's Play developer account.

## Own artwork (Fruit Catch)
`public/fruit/art.js` draws every fruit, creature and the basket as SVG in one style (fruit = smiling face, creatures = angry eyes). The game turns them into images; if one fails to load it falls back to the emoji. Test: `tests/art_test.js`. To add a creature: add an `A.name=wrap(...)` drawing and an entry in `ARTMAP` (emoji → name).

## Levels and creatures (Fruit Catch)
Level starts at score 5·n·(n-1): Lv2 10, Lv3 30, Lv4 60, Lv5 100, Lv6 150, Lv7 210, Lv8 280, Lv9 360, Lv10 450, Lv11 550, Lv12 660, Lv14 910 (580 points = Lv11). Only 6 kinds of creature, all falling STRAIGHT down (no swaying): Lv1 caterpillar, Lv3 ant (fast), Lv5 bee, Lv7 spider (fast), Lv8 (280 points) snake, Lv10 (450 points) dragon (costs 2 lives). Only the 3 newest kinds fall at once. From Lv8 they also fall in groups of 2-3 (chance grows with level), and their share of what falls grows from 12% (Lv1) to 38% (Lv14) (`badP()`), plus swarm waves. Creature drawings are bigger (72 px) with a white glow so they show on day, night and storm. Zones: meadow, forest from Lv8 (coins x2), deep forest from Lv11 (x3), dark jungle from Lv14 (x4). Weather builds up: night at Lv11, at Lv12 the sky clouds over with a light drizzle and faint far thunder, at Lv14 the real storm (`wlevel()`). Table: `BADS`, `levelFor()` in `public/fruit/index.html`.

## Smoothness and mood (Fruit Catch)
- Speed: fruit starts at 180 px/s (Lv1) and grows +30 px/s per level up to Lv14; creatures also arrive faster (spawn gap 0.76 s at Lv1 down to 0.30 s).
- Phones stuttered because a big animated SVG scenery was redrawn every frame. While you play the scenery no longer sways (`#wrap.playing`), the drawings are copied once to small canvases (`SPC`), and clouds/scene are separate layers.
- Zones now change the whole mood: meadow = day; forest (Lv8) = evening with falling leaves; deep forest (Lv11) = quiet night with moon, stars and fireflies; dark jungle (Lv14) = storm with rain, lightning flashes and thunder. Code: `ambInit/ambStep/ambDraw/flashDraw/thunder` in `public/fruit/index.html`. Not measured on a real phone.

## Music tempo (Fruit Catch)
Tempo rises a little at every level: 104 beats/min at Lv1 to 192 at Lv14 (`bpm()`), then stays.

## Rhythm (Fruit Catch)
Fruit speed = 150 + 36 per level px/s (to Lv14); spawn gap 0.73 s (Lv1) to 0.26 s. Creature share rises from 12% (Lv1) to 38% (Lv14) (`badP()`). Every 20-30 s a short wave: fruit shower (Lv2+, 4 s, only fruit, some golden) or swarm (Lv5+, 3.5 s, mostly creatures); code in `waveStep()`.
