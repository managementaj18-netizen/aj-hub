# Soramma Scan on iPhone — owner steps (on your Mac)

**Ready:** the iPhone project (`ios/`), a 1024 px icon, camera/photo permission texts, `npm run web` (packs the Scan screens inside the app), the privacy page (https://scan.soramma.app/privacy/), account deletion inside the app, and CORS on the Scan API so the app can talk to https://scan.soramma.app.

**NOT ready yet (do not submit to App Review before this):** the paid subscription. Apple requires **In-App Purchase** for paying inside an iPhone app. Plan: one subscription group with two auto-renewing plans, both with Apple's own **7-day free trial**: **Monthly USD 4.99** (ID `scan_monthly`) and **Yearly USD 39.99** (ID `scan_yearly`, about 33% cheaper). Owner receives about 85% after Apple's 15% (Small Business Program). Per-country prices can be set lower later (for example Cambodia). Not built; needs the steps below plus code (planned with RevenueCat). Until then use this project only for TestFlight tests with friends.

The project was generated on Linux and never opened in Xcode, so the first build may show small warnings.

## Part 1 — build and test (same as Fruit Catch)
1. On the Mac: Xcode + Node.js installed. Download the repo ZIP from GitHub, open Terminal in `scan/ios-app`.
2. `npm install` → `npm run sync` → `npm run open`
3. Xcode: target **App** → **Signing & Capabilities** → *Automatically manage signing* → Team = you. Bundle Identifier `com.soramma.scan` (change here and in `capacitor.config.json` if taken, then `npm run sync`).
4. Plug in the iPhone → ▶ Run. Check: sign up / sign in, **camera scan works**, scan saved, menu → **Delete my account** works (use a test account).

## Part 2 — App Store Connect (once)
1. **Agreements, Tax, and Banking** → accept the *Paid Apps* agreement, add bank account and tax forms (needed to sell anything; takes days).
2. My Apps → + → New App: iOS, name **Soramma Scan**, bundle ID above, SKU `soramma-scan-1`.
3. App → **Monetization → Subscriptions** → create group **Soramma Scan** → add subscription **Monthly** (ID `scan_monthly`), duration 1 month, price **USD 4.99**; add a second one **Yearly** (ID `scan_yearly`), duration 1 year, price **USD 39.99**. For each add **Introductory offer: Free, 7 days**, for new subscribers. Add localized name/description. Add a review screenshot of the paywall (after we build it).
4. Join the **Small Business Program** (Apple takes 15% instead of 30%): developer.apple.com → App Store Small Business Program.
5. Privacy policy URL: https://scan.soramma.app/privacy/ · App Privacy: data collected = name, phone number, user content (scans); linked to the user; not used for tracking.
6. Review notes: give Apple a demo account (name + password) and say the camera is only used to scan documents.
