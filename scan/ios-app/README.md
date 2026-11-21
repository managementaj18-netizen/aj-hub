# S&A Doc Scan on iPhone — owner steps (on your Mac)

**Ready:** the iPhone project (`ios/`), a 1024 px icon, camera/photo permission texts, `npm run web` (packs the Scan screens inside the app), the privacy page (https://scan.soramma.app/privacy/), account deletion inside the app, and CORS on the Scan API so the app can talk to https://scan.soramma.app.

## VERSION 1 = FREE (do this first)
Plan: put the app on the App Store **free** first, to learn whether Apple approves it. A free app needs only the **Free Apps Agreement (already Active)**. You do NOT need the Paid Apps Agreement, ABN/GST proof, tax forms, subscription products or RevenueCat for version 1. The app already behaves as free: requests from the iPhone app (header `x-app: ios`) are never locked by the trial (the server ignores the trial for the app while the Cloudflare variable `IOS_FREE` is not `0`). The website keeps its own trial.

**Free version = which features?** The iPhone build hides the Pro features: the **Report** tab and the business name/details/logo fields (flag `SA_HIDE_PRO`, set by `npm run web`; the website is unchanged). Free: scan ID / passport / document, import, library, plain PDF, auto-delete, support. Pro (planned for 1.1, with subscription): unlimited library (a free cap of about 20 scans is NOT built yet), Guest report, business logo/details on PDF. For 1.1 build with `HIDE_PRO=0 npm run sync`.

Version 1 steps: Part 1 (build and test), then Part 2 steps **2 and 5 only** (create the app, privacy policy and review notes), then upload with Xcode, TestFlight with friends, then **Add for Review**. Use the free texts in `listing-apple.md` (no subscription wording).

Later, to start charging: do Part 2 steps 1, 3, 4 and Part 3 (ABN/GST, Paid Apps Agreement, subscription products, RevenueCat), put the RevenueCat key in `iap-config.json`, set the Cloudflare variable `IOS_FREE` = `0`, and release version 1.1.

## Later: subscription (built, NOT tested on a real iPhone)
Apple In-App Purchase through RevenueCat. How it works: a new user gets the **free trial from the server (set "trial days" = 7 in the Scan admin settings)**. When the trial ends the app shows the subscription screen (Monthly **USD 4.99**, Yearly **USD 39.99**, Restore purchases, Terms and Privacy links). After a purchase the app asks the server (`POST /api/iap/refresh`), the server asks RevenueCat and extends the account. The same account then works on the website too. Create the two Apple products **without** an Apple free-trial offer (the 7 days are given by the server; two trials in a row would be confusing). The iPhone app never shows how to pay outside Apple. Owner receives about 85% after Apple's 15% (Small Business Program).

**Do not submit to App Review before the steps in Part 3 are done and you tested a purchase in TestFlight/Sandbox.**

The project was generated on Linux and never opened in Xcode, so the first build may show small warnings.

## Part 1 — build and test (same as Fruit Catch)
1. On the Mac: Xcode + Node.js installed. Download the repo ZIP from GitHub, open Terminal in `scan/ios-app`.
2. `npm install` → `npm run sync` → `npm run open`
3. Xcode: target **App** → **Signing & Capabilities** → *Automatically manage signing* → Team = you. Bundle Identifier `com.soramma.scan` (change here and in `capacitor.config.json` if taken, then `npm run sync`).
4. Plug in the iPhone → ▶ Run. Check: sign up / sign in, **camera scan works**, scan saved, menu → **Delete my account** works (use a test account).

## Part 2 — App Store Connect (once)
1. **Agreements, Tax, and Banking** → accept the *Paid Apps* agreement, add bank account and tax forms (needed to sell anything; takes days).
2. My Apps → + → New App: iOS, name **S&A Doc Scan**, bundle ID above, SKU `soramma-scan-1`.
3. App → **Monetization → Subscriptions** → create group **S&A Doc Scan** → add subscription **Monthly** (ID `scan_monthly`), duration 1 month, price **USD 4.99**; add a second one **Yearly** (ID `scan_yearly`), duration 1 year, price **USD 39.99**. Do NOT add an introductory offer (the server gives the 7 free days). Add localized name/description. Add a review screenshot of the subscription screen (take it from the app).
4. Join the **Small Business Program** (Apple takes 15% instead of 30%): developer.apple.com → App Store Small Business Program.
5. Privacy policy URL: https://scan.soramma.app/privacy/ · App Privacy: data collected = name, phone number, user content (scans); linked to the user; not used for tracking.
6. Review notes: give Apple a demo account (name + password) and say the camera is only used to scan documents.

## Part 3 — RevenueCat (free until USD 2,500 income per month)
1. revenuecat.com → sign up → **Create project** "S&A Doc Scan" → **Add app** → Apple App Store → bundle ID `com.soramma.scan`. Follow its steps for the **App Store Connect API key / In-App Purchase key** (it explains where to make them in App Store Connect).
2. **Products**: add `scan_monthly` and `scan_yearly`. **Entitlements**: create one called exactly **`pro`** and attach both products. **Offerings**: open the `default` offering, add two packages (Monthly and Annual) with the two products, and make it *current*.
3. Copy the **Public SDK key for Apple** (starts with `appl_`) into `scan/ios-app/iap-config.json` (`revenueCatPublicKey`). It is not secret.
4. Copy the **Secret API key (V1)** from RevenueCat → Project settings → API keys. In Cloudflare → Pages project **scan** → Settings → Variables and secrets → add Secret **`RC_SECRET`** with that value (never put it in the code or in chat) → redeploy.
5. In the Scan app: menu → Settings → trial days = 7.
6. Rebuild: `npm run sync`, Xcode ▶ Run on the iPhone, make a **Sandbox tester** (App Store Connect → Users and Access → Sandbox) and test: sign up, let the trial end (set trial days = 1 for the test, or ask me), buy, restore.
