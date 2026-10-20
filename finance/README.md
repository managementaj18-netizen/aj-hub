# Soramma Finance

Separate Cloudflare Pages project (like `scan/` and `laundry/`):

- Pages project name: `soramma-finance`, **Root directory** `finance`, **Build output** `public`, no build command.
- D1 database `soramma-finance-db` bound as **`DB`** (Settings → Bindings). Pushing a commit forces a redeploy after adding the binding.
- Custom domain: `finance.soramma.app`.
- First person to open the app creates the **owner (Admin)** account; others sign up with name + phone + password (free trial, owner controls trial days / invitation code / devices / support inbox).
- Data model: one generic table `rec(user_id,id,kind,d,upd,del)` with kinds `contact`, `invoice`, `txn`, `account`, `prefs`; the client computes reports (P&L, VAT, receivables/payables, balances). USD and KHR are kept separate.
