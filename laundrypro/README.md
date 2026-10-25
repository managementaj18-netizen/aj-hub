# Soramma Laundry (multi-shop, sellable)

Same app as `laundry/`, but every customer signs up with their own shop account:
- own staff, customers, orders, prices (data is separate per shop)
- free trial (default 3 days) that **locks** when it ends; the data is kept
- platform admin (you): menu → "Admin: shops" → extend (+30 days), no limit, disable, delete, trial days, close sign-ups, contact text
- login: owner = phone number + code; staff = `name@shopcode` (e.g. `dara@1234`) + code. The staff login is shown after you add a staff member.
- no offline-mode bypass

The original `laundry/` (single shop, no trial) is untouched.

## Cloudflare setup (same as Shop)
1. D1 database `soramma-laundrypro-db`.
2. Pages project `laundrypro`: connect this repo, root directory `laundrypro`, build output `public`, no build command.
3. Settings → Bindings → D1 → variable `DB` = `soramma-laundrypro-db`, then redeploy.
4. Custom domain, e.g. `laundrypro.soramma.app`.
5. Open the site: the first screen creates the **admin** account (your own).
