# Soramma Shop

Simple POS, stock and sales reports for small shops, cafés and restaurants. Separate Cloudflare Pages project (like `scan/`, `laundry/`, `finance/`):

- Pages project name: `soramma-shop`, **Root directory** `shop`, **Build output** `public`, no build command.
- D1 database `soramma-shop-db` bound as **`DB`** (Settings → Bindings). Pushing a commit forces a redeploy after adding the binding.
- Custom domain: `shop.soramma.app`.
- First person to open the app creates the **owner (Admin)** account; others sign up with name + phone + password (free trial, owner controls trial days / invitation code / devices / support inbox).
- Data model: one generic table `rec(user_id,id,kind,d,upd,del)` with kinds `product`, `sale`, `customer`, `stock`, `expense`, `prefs`. Stock = opening stock + stock movements − sold quantities (computed on the device). Works offline; changes sync when online.
- Barcode: camera scanning uses the browser `BarcodeDetector` (Chrome / Android); otherwise type the code or use a USB/Bluetooth scanner (it types the code + Enter in the search box).
