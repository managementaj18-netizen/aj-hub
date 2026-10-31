# Soramma Family

Share location inside a family. Everyone agrees first, can pause at any time, and a paused member is invisible (the stored position is deleted at once).

- Create a family (phone + password) → you get a 6-digit invite code → relatives join with the code.
- Map (OpenStreetMap + Leaflet) and a People list with "last seen", "Open in Google Maps".
- Khmer / English. Up to 20 people per family.
- Limit: it is a web app, so a position is sent only while the app is open (optional "keep the screen on"). For background tracking a native app would be needed.

## Cloudflare setup (same as Shop)
1. D1 database `soramma-family-db`.
2. Pages project `family`: connect this repo, root directory `family`, build output `public`, no build command.
3. Settings → Bindings → D1 → variable `DB` = `soramma-family-db`, then redeploy.
4. Custom domain, e.g. `family.soramma.app`.

Tests: `tests/` (API with a D1 shim, Playwright e2e, map test).
