# Fruit Catch on iPhone (App Store) — steps for the owner (on your Mac)

**What is ready:** the iPhone project (`ios/`), the game files packed inside it (`npm run web` makes them), the app icon 1024x1024, the start-up picture, App Store screenshots (`store/`), the App Store texts (`listing-apple.md`) and a privacy page (https://play.soramma.app/privacy/).
**What I could NOT do (needs your Mac and your Apple account):** build the app in Xcode, run it on an iPhone, create your Apple account, upload to Apple. The project was generated on Linux and never opened in Xcode, so the first build may show small errors: copy the red error text to me and I will fix it.
Facts to re-check on Apple's own pages before paying: the yearly fee (about USD 99), the screenshot sizes, the age-rating questions, review time.

## Part 1 — once only
1. **Apple Developer account** → developer.apple.com/programs → Enroll. Choose *Individual* (your real name, ID document, two-factor Apple ID). Pay the yearly fee. Wait until Apple says "active" (can take days).
2. On the Mac install **Xcode** (Mac App Store, big download) and **Node.js** (nodejs.org, the LTS button).
3. Get the project: on GitHub open the repository `aj-hub` → green **Code** → **Download ZIP** → unzip. Open **Terminal** and go to `game/ios-app` inside it (type `cd ` then drag the folder into Terminal, press Enter).

## Part 2 — build and test on your iPhone
```
npm install
npm run sync
npm run open
```
Xcode opens. Then:
1. Click **App** (blue icon, top left) → target **App** → **Signing & Capabilities** → tick *Automatically manage signing* → **Team** = your name.
2. The **Bundle Identifier** is `com.soramma.fruitcatch`. It must be unique in the whole world; if Xcode says it is taken, change it here AND in `capacitor.config.json` (`appId`), then run `npm run sync` again.
3. Plug in your iPhone (trust the computer), choose it at the top, press **▶ Run**. On the iPhone: Settings → General → VPN & Device Management → trust your developer name.
4. **Check on the phone:** game starts, touch moves the basket smoothly, **sound and music work**, shop, **Leaderboard** shows players, **Challenge a friend** share sheet shows a link `https://play.soramma.app/fruit/?c=...`, the "follow Page Soramma" line opens Facebook (if it does nothing, tell me), airplane mode: the game still plays, no strip at the top/bottom, only portrait.

## Part 3 — App Store Connect
1. appstoreconnect.apple.com → **My Apps** → **+** → New App: Platform iOS, name **Fruit Catch**, language English, bundle ID from above, SKU `fruitcatch1`.
2. In Xcode: top menu **Product → Archive**. When it finishes: **Distribute App → App Store Connect → Upload**. Wait about 10–30 minutes until the build appears in App Store Connect.
3. **TestFlight** tab: add friends/family with iPhones as testers and let them try it first (Apple's own testing tool). Ask them: does it open, play, sound?
4. Fill the app page with the texts in `listing-apple.md` and upload the screenshots from `store/` (use the 6.9" set, and the 6.5" set if Apple asks).
5. Answer the questions (age rating, App Privacy, review notes) with the suggestions in `listing-apple.md`. Answer honestly and re-read each question.
6. Price: Free. Press **Add for Review** → **Submit**. Apple answers in days.

## If Apple rejects it
The most common reason for apps like this is guideline **4.2 "minimum functionality"** (looks like a website in an app). Send me Apple's message. Things I can add: Game Center leaderboard, haptic feedback (phone vibration), a better "review notes" explanation. Do not resubmit unchanged.

## Notes
- The game files are copied INTO the app, so it opens fast and plays without internet. Leaderboard, share link and visit counts use https://play.soramma.app.
- Every time the game changes, run `npm run sync` again, archive and upload a new build (increase the *Build* number in Xcode).
- English Friends needs its own project (other bundle ID) and is a children's app (Apple's Kids rules are stricter). Not done yet.
- Selling coins later requires Apple's In-App Purchase and a server account (name + PIN). Not built.
