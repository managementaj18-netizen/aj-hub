# S&A Hub (soramma.app)

Landing page that gathers every Soramma app (Laundry, Scan, Finance, ...). Static page, no database.

## Cloudflare setup (once)
1. Workers & Pages → Create → **Pages** → Connect to Git → repo `aj-hub`.
2. Project name `soramma-hub`, branch `main`, framework **None**, build command empty,
   **build output directory `public`**, **root directory `sa-hub`**.
3. After the first deploy: Custom domains → **Set up a custom domain** → `soramma.app` (and optionally `www.soramma.app`).
   Remove any old DNS record for `soramma.app` / `www` if Cloudflare asks.

## Add a new app
Edit the `APPS` list at the top of the script in `public/index.html` (name, address, icon file, km/en text).
