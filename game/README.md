# Games (static, no account, no database)

- `/` Fruit Catch · ចាប់ផ្លែឈើ
- `/sort/` Juice Sort · ទឹកផ្លែឈើ (colour-sorting puzzle: pour layers between bottles, levels 1-60+ generated and checked solvable, undo, restart, one extra bottle per level, progress saved)

# Fruit Catch · ចាប់ផ្លែឈើ

A small casual game (static page, no account, no database). Drag a finger (or use the arrow keys) to catch falling fruit in the basket; avoid the bugs. 3 lives, levels every 10 points, gold pineapple +5, best score saved on the phone, Khmer / English, sound on/off, pause, share score. Works offline once opened (PWA).

Art is plain emoji and the mechanic is generic; nothing is copied from another game.

## Cloudflare setup (no database needed)
1. Pages project `game`: connect this repo, root directory `game`, build output `public`, no build command.
2. Optional custom domain, e.g. `play.soramma.app`.

Tests: `node tests/game_test.js`, `node tests/sort_test.js` (Playwright; controls, scoring, lives, level-up, pause, game over, best score).
