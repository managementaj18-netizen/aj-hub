# Fruit Catch on Google Play (Android) — step by step

Everything here is prepared. What only the owner can do: create the Play developer account, pay the fee, upload.
Facts to re-check before paying (they change): the list of supported countries, the fee (about USD 25 once) and the testing rule for new personal accounts (12 testers for 14 days).

## What is ready in this folder
| File | Use |
|---|---|
| `store/en-*.png`, `store/km-*.png` | 4 phone screenshots per language, 1080x1920 (Play needs 2 to 8) |
| `store/feature-graphic.png` | Feature graphic 1024x500 (required) |
| `listing.md` | Name, short and full description (English + Khmer), category, Data safety answers |
| `../public/privacy/index.html` | Privacy policy page → https://play.soramma.app/privacy/ (after deploy) |
| `make-store-assets.js` | Re-makes the screenshots and graphic if the game design changes |
| `../public/fruit/icon-512.png` | App icon 512x512 (already used by the game) |

## App facts
- App name: **Fruit Catch · ចាប់ផ្លែឈើ**
- Package ID (cannot change later): `com.soramma.fruitcatch`
- Start URL: `https://play.soramma.app/fruit/`
- Colors: theme `#1f6f4a`, background `#143d2b`; portrait only.
- Free, no ads, no purchases.

## Steps for the owner
1. **Check the country.** Play Console Help → "Supported locations for developer and merchant registration". Free apps only need "developer registration".
2. **Create the developer account** at play.google.com/console. Use a real name/address matching your ID. Pay the fee. Verify identity (can take days).
3. **Deploy the privacy page.** Merge the PR, then open https://play.soramma.app/privacy/ and check it loads.
4. **Make the Android file (AAB) with PWABuilder** (no coding, no installs):
   - Open pwabuilder.com, enter `https://play.soramma.app/fruit/`, press Start.
   - Fix anything it marks red. Then "Package for stores" → **Android** → Google Play.
   - Package ID `com.soramma.fruitcatch`, name `Fruit Catch`, version 1 / 1.0.0. Choose "Create new signing key". Generate.
   - Download the ZIP. It has the `.aab` file, the **signing key** and `assetlinks.json`. **Keep the signing key and its password safe — losing them means you cannot update the app.**
5. **Create the app in Play Console** → Create app → Fruit Catch, Game, Free. Fill in the listing from `listing.md`, upload icon, feature graphic and screenshots, add the privacy policy link.
6. **Upload the .aab** to a **Closed testing** track and add 12+ testers (their Gmail addresses). Keep them opted in for 14 days (only if the new-personal-account rule applies to you). Ask friends to install from the opt-in link.
7. **Make the app open full screen (remove the browser bar).** In Play Console → Test and release → App integrity → App signing, copy the **SHA-256 certificate fingerprint** (and the one from the PWABuilder key). Send me both. I will publish them at `https://play.soramma.app/.well-known/assetlinks.json`. Without this file the app still works but shows a browser address bar at the top.
8. **Questionnaires**: Content rating (IARC), Data safety, Target audience, Ads = No. Answers are suggested in `listing.md`. Answer honestly and re-read each question.
9. After the test, apply for production in Play Console, wait for Google's review (usually days).

## What I could not check from here
- I did not build the .aab or run it on an Android phone. Please test the installed app yourself (sound, touch, language, link to Facebook Page).
- I did not read Google's own help pages; the testing rule and fees came from web articles. Confirm on the Play Console Help site.
- English Friends and later games can use the same steps with another package ID and start URL.
