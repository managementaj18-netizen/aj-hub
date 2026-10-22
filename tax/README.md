# A&J Tax

Cambodian tax helper for A&J Kampot Boutique (internal, separate from the Soramma apps).
Monthly return (B17 / B20 / B24 / B25 → B27), annual profit tax, payroll salary tax. All rates and formulas are editable in the **Rates** tab.

Cloudflare setup (same as the Shop app):
1. D1 database `aj-tax-db`.
2. Pages project `aj-tax`: connect this repo, root directory `tax`, build output `public`, no build command.
3. Settings → Bindings → D1 → variable `DB` = `aj-tax-db`; then redeploy.
4. Custom domain `tax.ajkampotboutique.org`.
5. Open the site and create the owner account (signup stays closed).
