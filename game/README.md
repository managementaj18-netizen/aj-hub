# Games (static, no account, no database)

**Release plan: one game at a time.** Only `public/` is deployed. Finished games that are not announced yet wait in `public/try-6d7b31c6ea/` (not linked anywhere, only the owner knows the address). To release one: `sh game/release.sh sort` (or `kids`), commit, push.

- Released: Fruit Catch (`/`), English Friends (`/abc/`)
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

## Home page, names and leaderboard (Fruit Catch)
- Home page: your name, best score, Play, 🏆 Leaderboard (today / this week / all time, top 10 + your place), 🤝 Challenge a friend (shares your best score as a link).
- Scores are sent to `/api/score` after a game if the player typed a name (nickname only). A score must be possible for the time played (max about 15 points per second) and one phone may send 60 per day. Anyone can still forge a request, so this is a friendly board, not a verified contest: do not give money prizes without checking the top scores by hand.
- Remove a name: `curl -X POST https://play.soramma.app/api/score-delete -H 'x-admin-code: <ADMIN_CODE>' -d '{"name":"BadName"}'`.
- Cambodia time (UTC+7) decides the day; the week starts on Monday.
- Tests: `node game/tests/score_test.mjs`, `node game/tests/home_e2e.js`, `node game/tests/challenge_test.js`.
