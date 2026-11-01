# Soramma Translate (Khmer ↔ English) — record now, translate later

- Record a voice or type text. With no internet the item is kept in a queue on the phone (IndexedDB). When the phone is online again (or the app is opened) the queue is sent automatically: speech → text (Workers AI Whisper) → translation (Workers AI m2m100) → shown, can be read aloud with the phone's own voice (Khmer voice may be missing on some phones).
- Voice is converted to 16 kHz mono WAV in the phone, so it works on any device. Up to 2 minutes per recording.
- Protected by a secret access code (`ACCESS_CODE`), so nobody else can use the free AI allowance. Without that secret every request is refused.

## Honest limits
- Needs internet to translate; offline it can only record and keep the queue.
- The quality of Khmer speech recognition and Khmer translation has NOT been verified (tests use a mock AI). Try it with real sentences first.
- Free Workers AI allowance: about 10,000 neurons/day (check the live pricing page).

## Cloudflare setup
1. Pages project `translate`: connect this repo, root directory `translate`, build output `public`, no build command. No D1 database is needed.
2. Settings → Bindings → Add → **Workers AI**, variable name `AI`.
3. Settings → Variables and secrets → Add → type **Secret**, name `ACCESS_CODE`, value = a code you choose (give it only to people you trust).
4. Redeploy (Deployments → Retry deployment).
5. Open the site, type the code once, then try a short sentence.

Tests: `node tests/api.test.mjs` (mock AI) and `node tests/e2e.js` (Playwright with a fake microphone: offline queue, auto-send when back online).
