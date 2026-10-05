# Beta Drips for Android

This JavaScript Expo Android app has a branded home screen and Google authentication using the website's existing Supabase project. Catalogue screens, shared-cart synchronization and checkout remain later bricks. The authentication APK was rebuilt and installed on the physical phone. User-verified Google sign-in, saved-account restoration, local sign-out isolation and cancellation/retry results are documented below.

## Files and concepts

- `App.js`: the home and account screen, including Google sign-in, account name/email, app-local sign-out and accessible loading/error messages. It reuses the website's colours and safe-area/scroll handling.
- `index.js`: registers App with Expo as the application entry point.
- `app.json`: Android-only configuration, display name **Beta Drips**, Android application ID `com.betadrips.app`, and custom URL scheme `betadrips`. Browser and SecureStore plugins support the authentication callback and encrypted storage/backup exclusion rules.
- `package.json` and `package-lock.json`: mobile dependencies and reproducible npm installation, separate from the website's dependencies. Use Node 22.13+ (verified here with 22.23.2).
- `eas.json`: a development profile with `developmentClient: true`, internal distribution and Android APK output. It is configuration only; no Expo project has been linked, no account login is needed for local compilation and no cloud build has been started.
- `.gitignore`: dependencies, local environment files, Expo caches, generated native folders, exported bundles, APK/AAB output and signing material stay out of Git.
- `assets/` and `LICENSE`: assets and license supplied by the official Expo blank template. Launcher artwork is still template artwork; the home-screen BD mark is native text and styling.
- `android-env.sh` and the repository `.nvmrc`: activate the pinned Node version and Android tools for the current terminal, respecting configured tool locations.

## Install on a physical Android phone locally

1. Use Node 22 and JDK 17 with the Android command-line SDK; Android Studio and an emulator are optional for a physical phone. The installed SDK 57 / React Native 0.86.3 configuration requires platform `android-36`, Build Tools `36.0.0` and NDK `27.1.12297006`. React Native's source-build configuration specifies CMake `3.30.5`; SDK packages may also install the Android Gradle plugin's default CMake when a module leaves its version unspecified. From the repository root, run `source mobile/android-env.sh`. This activates the `.nvmrc` Node version and sets Java/SDK paths in the current Bash terminal without editing your shell startup files. The helper expects Java at `~/.local/share/beta-drips/jdk-17` and the SDK at `~/Android/Sdk`.
2. Enable Developer options and USB debugging on your phone. Connect with a USB data cable, unlock the phone and accept its debugging authorization prompt.
3. From a terminal in `mobile/`, run:

   ```sh
   npm ci
   adb devices
   npm run android
   ```

   `adb devices` should show the phone as `device`, not `unauthorized`. The Android script runs `expo run:android --device`: select your physical phone. It generates the ignored `android/` project, compiles and installs a local debug development build and starts Metro. This does not start an EAS cloud build. The first compilation downloads Android/Gradle dependencies.
4. Confirm the launcher name is **Beta Drips** and the home screen shows **Exceptional fashion. Nigerian brands.** Check the layout with large text enabled.
5. On later sessions, start the JavaScript server with:

   ```sh
   npm start
   ```

   Keep the computer and phone on the same trusted network and open the installed development app. If using USB for Metro connectivity, `adb reverse tcp:8081 tcp:8081` lets the phone reach the computer's port 8081.
6. With the development app and Metro running, check the registered scheme without any authentication:

   ```sh
   adb shell am start -W -a android.intent.action.VIEW -d 'betadrips://auth/callback' com.betadrips.app
   ```

   This should open the app. It does not sign in; that callback handling belongs to a later brick. Rebuild the native app after changing schemes or adding native libraries. JavaScript-only screen changes use Metro refresh.

The future mobile app may contain Supabase's public URL and publishable key, but private Supabase/Google/Mailgun credentials must remain server-side. An APK and any `EXPO_PUBLIC_*` variables can be inspected by its users. This brick contains no credentials or environment configuration. The URL scheme enables app opening; it does not prove authentication or authorize data access.

## Verified results for this brick

- Expo SDK **57.0.26**, React Native **0.86.3**, React **19.2.3**; `expo-dev-client` **57.0.19** and `react-native-safe-area-context` **5.7.0** were selected by `expo install` for SDK 57. Exact resolved versions are locked in `package-lock.json`.
- Online `expo install --check` passed. Expo Doctor passed **21/21 checks**.
- `expo config --type introspect` passed and confirmed the Beta Drips name, Android-only target, package ID and a native Android intent-filter entry for `betadrips`.
- Android JavaScript/Hermes export passed (589 modules). Export output stays in ignored `dist/`; this is not an APK or a tested phone installation.
- The root website production build and existing 29 mocked/component/static-SQL test cases passed with Node 22.23.2 after adding the mobile app.
- Secret-pattern and exact local-private-value checks found no matches in project files; mobile ignore checks passed. No private environment values were copied into mobile.
- `npm audit` reported **23 dependency-tree findings: 7 moderate, 16 high**, with vulnerable leaf dependencies including braces, node-forge and uuid. Suggested major Expo/React Native downgrades do not preserve SDK 57 compatibility; no forced changes were made. This audit remains unresolved and must be reviewed before production use. Expo compatibility checks do not establish that the dependency tree is vulnerability-free.

Native compilation, APK installation and rendered home-screen launch on a physical phone also passed; the separate evidence appears below. Pending: icon reopening, accessibility/large-text review and the future `betadrips://auth/callback` check. No cloud build, Expo account linking, push or deployment occurred. The preceding shared-cart commit is `34301e8`.

## Checks

Run `npm run check` to validate SDK-compatible dependency versions and `npm run export:android` to bundle JavaScript for Android. Native compilation, phone installation and URL opening must be tested separately; a successful bundle is not an installed APK.

Official setup references consulted: [blank JavaScript template](https://docs.expo.dev/more/create-expo/), [SDK compatibility](https://docs.expo.dev/versions/latest/), [development client](https://docs.expo.dev/versions/latest/sdk/dev-client/), [local Android compilation](https://docs.expo.dev/guides/local-app-development/), [custom URL scheme](https://docs.expo.dev/linking/into-your-app/), [EAS development profile](https://docs.expo.dev/build/eas-json/).

## Local prerequisites setup

The repository `.nvmrc` pins Node **22.23.2**. Node 18 and nvm's global default are preserved. `android-env.sh` activates the project tools only in the terminal where it is sourced; opening a new terminal requires sourcing it again. It respects `NVM_DIR`, `JAVA_HOME` and `ANDROID_HOME` (or `ANDROID_SDK_ROOT` when `ANDROID_HOME` is unset). The user-relative Java/SDK paths documented above are defaults, not required installation locations. Set `JAVA_HOME` and `ANDROID_HOME` to your own installations before sourcing if they differ. The legacy `ANDROID_SDK_ROOT` alias is kept consistent with `ANDROID_HOME`. Shell configuration files remain untouched; the helper does not install tools or accept licences.

Installed and verified: Node 22.23.2, Temurin Java/javac 17.0.20.1, and Android command-line tools (`sdkmanager` 22.0). JDK and SDK tools downloads matched their official SHA-256 checksums. SDK tools run with Java 17 and print a deprecation notice recommending the newer Android CLI. The user reports personally accepting all package licences. Installation and `sdkmanager --list_installed` confirmed platform android-36 (revision 2), Build Tools 36.0.0, NDK 27.1.12297006, CMake 3.30.5 and platform-tools 37.0.1. `adb version` passed (ADB 1.0.41 / platform-tools 37.0.1). Phone authorization, native build and launch were subsequently verified below. No Studio or emulator was installed.

Google requires personal agreement to its [SDK download terms](https://developer.android.com/studio#command-tools). After the command-line tools are installed, review and accept package licences yourself:

```sh
source mobile/android-env.sh
sdkmanager --sdk_root="$ANDROID_HOME" --licenses
```

The required package installation command, after licence acceptance, is:

```sh
sdkmanager --sdk_root="$ANDROID_HOME" --install "platform-tools" "platforms;android-36" "build-tools;36.0.0" "ndk;27.1.12297006" "cmake;3.30.5"
```

No emulator/system-image package is needed. These user-owned installations require no sudo. If ADB later reports a Linux USB permissions error, Ubuntu's packaged udev rules can be installed by you with `sudo apt-get install android-sdk-platform-tools-common`; do not run ADB as root or grant every user unrestricted USB access.

Connect an unlocked phone with USB debugging enabled, then run `adb devices -l`. Accept the computer's RSA authorization prompt on the phone. `device` means authorized, `unauthorized` means the phone still needs approval, and no entry usually requires checking the data cable, USB mode or debugging setting. USB debugging gives the authorized computer powerful access to the phone; authorize only a computer you trust and revoke debugging authorizations when needed.

Reference checks: [Expo SDK 57 build environment](https://docs.expo.dev/build-reference/infrastructure/) uses Java 17 and NDK 27.1.12297006. [Android SDK Manager documentation](https://developer.android.com/tools/sdkmanager) describes CLI-only package installation and interactive licence acceptance. It now recommends the newer Android CLI, but still documents `sdkmanager`, which this setup uses as requested.

## First physical-phone build

Initial checks confirmed an authorized Xiaomi M2006C3MG phone, about 2.9 GiB available RAM, full 2 GiB swap and 58 GiB free disk. Expo generated the ignored `android/` project without changing package.json. Its local `gradle.properties` was adjusted to one worker, parallel builds disabled, a 1536 MiB heap and in-process Kotlin compilation. These settings are local generated files and must be reapplied if `android/` is regenerated.

Build: `npx expo run:android --device M2006C3MG --no-bundler` compiled the phone's armeabi-v7a architecture successfully in **59m 34s** (326 tasks). The debug APK is at `android/app/build/outputs/apk/debug/app-debug.apk`, approximately 47 MiB. Gradle installed additional dependency-required Build Tools 35.0.0 and CMake 3.22.1 using the accepted licences. Deprecation and device-only 32-bit warnings were emitted; this is not a Play Store release build.

Installation: Expo's first attempt could not install because the phone disconnected by the end of compilation. After reconnection, ADB confirmed `device` status and `adb install -r android/app/build/outputs/apk/debug/app-debug.apk` returned `Success`. `adb shell pm path com.betadrips.app` independently confirmed the installed package. The existing APK was reused without rebuilding.

Launch: `adb reverse tcp:8081 tcp:8081` succeeded and its mapping was listed. Metro's status endpoint reported running. Opening the development-client URL returned Android `Status: ok` for `com.betadrips.app/.MainActivity`; the foreground activity check confirmed it. Metro bundled index.js successfully (717 modules, 12.855 seconds). Visual inspection of an ADB screenshot then confirmed the BD mark, Beta Drips heading, “Exceptional fashion. Nigerian brands.” and welcome text on the physical phone. Installation and rendered home-screen launch are separately verified; icon reopening, larger text and future authentication callbacks are not claimed tested.

Development server: Metro started successfully with `npx expo start --dev-client --localhost --max-workers 1`. The completed Gradle daemon was stopped to free memory. Keep the Metro terminal running while using the development app. For future sessions, from the repository root:

```sh
source mobile/android-env.sh
adb reverse tcp:8081 tcp:8081
cd mobile
npx expo start --dev-client --localhost --max-workers 1
```

Open **Beta Drips** from the phone's app icon, then select the development server or enter `http://127.0.0.1:8081` in the development launcher. USB forwarding requires the phone to stay connected; reapply `adb reverse` after reconnecting. A development build uses Metro for its JavaScript; stopping that terminal prevents loading/reloading the home screen. No authentication, catalogue or cart features were added, and no commit or push occurred.

## Foundation commit review

Secret patterns and two local private configuration values were checked against all 95 nonignored project files with no matches; private values were not printed. No user-specific absolute paths or phone serials were found in foundation files. Ignore checks passed for dependencies, generated native projects, Expo caches, bundles, APK/AAB files, local environment files and signing material; none are commit candidates.

The portable helper passed Bash syntax, real Node/tool activation and repeated sourcing without duplicate PATH entries. Configured Java/SDK paths containing spaces and the legacy SDK_ROOT fallback also passed isolated shell checks; those override checks stubbed nvm and are not evidence of another machine's SDK installation. The website production build and existing three automated test files passed with Node 22.23.2 (mocked/component/static-SQL checks, not a live database check). Offline Expo dependency validation reported dependencies up to date but warned that offline validation is unreliable; earlier online Expo validation and the actual native build remain the stronger evidence. No dependency fixes or app features were added. The user authorized the foundation commit; no push or deployment is authorized.

## Google sign-in brick

The app uses the existing Supabase project and its Google provider; signing into the same Google identity uses the same Supabase account as the website. No database migration or backend endpoint change is needed for this brick.

### Public configuration and redirect

An ignored `mobile/.env` was configured from only the website's `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`, renamed to Expo's public variable names. No private settings were copied. On another machine, copy `.env.example` to `.env` and fill in the same project's public URL and modern `sb_publishable_…` key. The app rejects secret keys and legacy JWT keys. Restart Metro after changing environment values. All `EXPO_PUBLIC_*` values are bundled into the app and readable by its users; never put server credentials in them.

In the existing Supabase project, open **Authentication → URL Configuration → Redirect URLs** and add exactly:

```text
betadrips://auth/callback
```

Keep every existing website redirect and Site URL unchanged. Do not add the app scheme to Google's web OAuth redirects: Google's callback stays the existing Supabase `/auth/v1/callback` URL. Supabase completes the Google flow and redirects back to the app. No Supabase/Google dashboard changes were performed by the coding agent.

### Changed files and security concepts

- `lib/publicConfig.mjs` and `.env.example`: validate public configuration and document placeholders. Local `.env` remains ignored.
- `lib/supabase.js`: one client, same Supabase SDK version as the website (2.117.2), PKCE, persisted sessions, auto-refresh, native URL detection disabled and the installed SDK's built-in session coordination (its explicit lock option is deprecated). The account UI uses the session's profile for display; future protected operations still require server authentication and ownership checks.
- `lib/crypto.js`: Expo Crypto supplies secure random values and SHA-256 through the WebCrypto subset required by Supabase. A TextEncoder polyfill supports Hermes. Browser launch refuses a URL whose PKCE challenge method is not S256; there is no plain-PKCE fallback.
- `lib/secureStorage.mjs`: native SecureStore holds sessions and PKCE data. Large values are encoded into small encrypted chunks; a new manifest is published only after every chunk is saved, preserving the previous readable value if a write fails. Per-key queues prevent refresh writes from removing chunks during a read. Missing/corrupt data is an error, not a silently empty session. Android SecureStore uses the Keystore and its config plugin excludes secure data from device backup. Interrupted writes may leave unreachable encrypted chunks; uninstalling the Android app removes its local data.
- `lib/authController.mjs`: Google sign-in in a system-browser custom tab, exact callback validation, pending-attempt persistence for cold starts, one code exchange for duplicate Android deliveries, timeout/cancellation/error states and local-scope sign-out. Callback URLs must contain an authorization code, not session tokens. Supabase verifies that code with the locally stored PKCE verifier. Supabase manages its bounded verifier slots; canceled/expired app attempts are ignored. No token, callback URL, code or raw provider error is logged/displayed.
- `lib/useMobileAuth.js`: wires the controller to React, Linking and AppState; restores stored sessions and starts refresh only while active. Listeners/refresh are cleaned up on unmount. SDK events update the account after refresh or session loss without awaiting more auth calls inside SDK callbacks. A stale restoration result cannot overwrite a newer account event.
- `App.js`: account name/email, Google button and sign-out; operation controls stay disabled while restoring, opening the browser, exchanging or signing out. Cancellation is distinct from failure. Permanent session loss asks for sign-in; failed sign-out keeps the account visible for retry.
- `app.json`, `package.json`, `package-lock.json`: SDK-compatible native modules/config plugins and the mobile test script. Existing generated Android files remain ignored. `tests/auth.test.mjs` tests the actual controller/storage code with injected platform dependencies, plus an offline real-Supabase-SDK PKCE check.

Mobile sign-out explicitly calls `signOut({ scope: 'local' })`. This revokes the mobile session's refresh token rather than all sessions for that account, so the website should remain signed in. Browser Google cookies may still exist; signing out of Beta Drips does not sign out of Google itself. A custom app scheme routes a callback but does not authorize an account: the PKCE verifier and Supabase's exchange provide that protection.

### Verification and remaining phone tests

Automated: 18 mobile test cases passed in one Node test file. They cover strict callbacks/public-key validation, large Unicode storage and partial-write recovery, corrupted/missing chunks, browser success/cancel/failure, concurrent callback deduplication, cold-start recovery, expired/failed exchange, foreground refresh, session loss, local sign-out/retry and stale restoration. Browser/native storage/network operations are mocked; the installed Supabase SDK test generates and verifies an S256 challenge using Node crypto without a network request. These tests do not establish that Android Keystore, native crypto, Google or live Supabase work on a phone.

Online Expo dependency validation passed; Expo Doctor passed **21/21 checks** after identical expo-constants copies were deduplicated. Config introspection confirmed `betadrips` and SecureStore's Android backup-rule references. Android JavaScript/Hermes export passed. The website production build and three existing automated test files passed separately. The last installation audit still reported 23 dependency findings (7 moderate, 16 high); no forced audit fixes were made.

The APK installed during the foundation brick predates the new native modules. Rebuild/reinstall the development client before testing; a Metro refresh alone cannot add SecureStore/Crypto/WebBrowser native modules. The authentication APK was subsequently rebuilt/installed and user-tested as documented below. Preserve/reapply the documented one-worker Gradle limits on this laptop. No commit, push, migration, cloud build or deployment occurred.

Manual checklist after adding the redirect and rebuilding:

1. Keep Metro running and USB forwarding on port 8081 active. Open Beta Drips; press Continue with Google and verify the system browser opens.
2. Finish Google sign-in with the website's account; verify callback return and matching account email. Back out of the browser on another attempt and confirm cancellation allows retry. Decline consent or temporarily disable the network and check a clear error/retry state.
3. Close/reopen the app and verify the account restores. Background/resume after token expiry and verify refresh, including a network interruption. A permanently revoked session should request sign-in.
4. Sign into the website too, sign out of the mobile app, then confirm the website remains signed in. Reopen mobile and confirm the old account is hidden. Sign in as another account and verify only that account's profile appears.
5. Test callback return if Android kills the app while the browser is open, and check enlarged text/loading/error readability. No catalogue, cart or checkout is present.

Official references checked against SDK 57 and the installed Supabase client: [Supabase React Native refresh/storage](https://supabase.com/docs/guides/auth/quickstarts/react-native), [PKCE code exchange](https://supabase.com/docs/guides/auth/sessions/pkce-flow), [native redirects](https://supabase.com/docs/guides/auth/native-mobile-deep-linking), [sign-out scope](https://supabase.com/docs/guides/auth/signout), [Expo browser sessions](https://docs.expo.dev/versions/latest/sdk/webbrowser/), [SecureStore](https://docs.expo.dev/versions/latest/sdk/securestore/), [Crypto](https://docs.expo.dev/versions/latest/sdk/crypto/).

### Authentication APK rebuild and launch

The user reports adding `betadrips://auth/callback` to Supabase's allowed redirects. The agent then verified the connected physical phone's authorized `device` status. Initial resources were approximately 4.7 GiB available RAM and 53 GiB free disk.

Expo prebuild regenerated the ignored Android project for the new native config plugins. Local limits were reapplied: one Gradle worker, parallel builds disabled, 1536 MiB heap and in-process Kotlin. Expo's `run:android --device M2006C3MG --no-bundler` build succeeded in **2m 35s** (326 tasks: 144 executed, 150 cached, 32 up-to-date) and completed installation. Android's package-path check independently confirmed installation. Gradle was stopped after the build.

Metro was restarted with the public mobile configuration and one worker. USB reverse mapping for 8081 was established and listed. App launch returned `Status: ok`; Metro bundled 781 modules in 5.094 seconds. A physical-phone screenshot confirmed the branded screen and enabled Continue with Google button. This verifies the rebuilt app loads with its new native modules, not successful Google sign-in.

The phone rejected an ADB-injected tap with its INJECT_EVENTS security restriction; no phone security settings were changed. The user was asked to tap Continue with Google and complete account selection/consent personally. Browser return, signed-in identity, persistence/refresh and local sign-out isolation remain pending a physical-phone result. No commit or push occurred.

### Saved account after development-server reconnection

After reopening showed an empty Expo development launcher, Metro was verified running on port 8081 and serving the Beta Drips Android development manifest. The phone was initially disconnected from ADB. Once reconnected with authorized `device` status, USB reverse forwarding for 8081 was restored/listed and the installed app was reopened through its localhost development-client URL. Android returned `Status: ok`.

Visual inspection then confirmed the signed-in account screen with profile name/email and Sign out of this app, without another sign-in. No rebuild or app-data clearing was performed. This verifies the saved account returned after reconnecting to Metro; it does not independently establish token-expiry refresh, website-session preservation after mobile sign-out or every Google browser callback scenario. Personal profile values were not copied into repository documentation. Keep Metro running and reapply USB forwarding after reconnecting. No commit or push occurred.


### User-verified authentication results before commit

The user explicitly reports these physical-phone results:

- Google sign-in returned to Beta Drips and displayed the account.
- The saved account was restored after reopening and reconnecting to Metro.
- Mobile sign-out left the local website signed in after refreshing the website.
- Canceling Google sign-in and retrying worked.

These are user-verified live results, distinct from automated mocks/offline SDK checks. The agent separately verified native build/install/UI launch and visually confirmed the restored account after Metro reconnection. No personal profile values or credentials are included in documentation. Token-expiry refresh, permanent revocation/network interruption, process termination during browser sign-in, another-account switching and accessibility checks remain unverified on the physical phone; no production result is claimed.

The user authorized the commit “Add Google sign-in to the Android app” on task-3. The reviewed scope is mobile authentication, its native dependencies/configuration, placeholder public environment example, regression tests and related README/PRD documentation. Local environment files, dependencies and generated Android/APK/export files remain ignored. No catalogue, cart or checkout was added; no push is authorized.

Pre-commit review: secret-pattern and exact-private-value checks passed across 103 nonignored project files without printing private values. No machine-specific absolute paths or phone serial were found in mobile source. Local environment/dependency/generated-native/APK/export/signing ignore checks passed; only the placeholder environment example is trackable. All 18 mobile tests, three existing website test files and the Node 22.23.2 website production build passed again. No application code changed during the commit review.

## Mobile clothing catalogue brick

Shop is now the opening screen and works without signing in. The cream/green two-column grid includes combined brand/category filters, case-insensitive search, result counts, clear controls and a useful empty state. Product details display the original description, naira price, size labels/sizes and licensed image attribution. Sizes are informational; there are no purchase controls. Android Back returns from details or Account to Shop. Filters persist while visiting details or Account.

Files and concepts:

- `App.js`: lightweight Shop/Account navigation; the existing authentication hook stays mounted across screens.
- `components/AccountScreen.js`: the existing account controls moved out of App, preserving authentication/loading/error handling and local-scope sign-out.
- `lib/catalogue.mjs`: imports and re-exports the **same** `../src/data/catalogue.js` module used by the website and authenticated server catalogue validation (the relative import from this file is `../../src/data/catalogue.js`). No product data was copied. It adds mobile search and absolute HTTPS image URLs.
- `metro.config.js`: portable watch folder for the canonical `src/data` directory outside the mobile project. Restart Metro with `--clear` once after this configuration change. No native dependency changes or APK rebuild are needed.
- `components/ShopScreen.js`: virtualized two-column product grid, search, filters and empty state.
- `components/ProductDetails.js`: complete product information, Android/back navigation via App and working external image-source/licence links.
- `components/ProductImage.js`: HTTPS images with loading indicator and a retryable error placeholder; `contain` preserves the uncropped image associations/licence metadata.
- `tests/catalogue.test.mjs`: shared-object identity, 40 unique IDs, eight brands, image associations, sizes/prices and combined filter/search checks.

The preview notice appears once on Shop/details: “Preview catalogue. Products, prices and imagery are illustrative.” These are not verified stock or partnerships. Catalogue data is public; no server credentials, protected operations, cart or checkout were introduced. Future purchasing must continue to validate IDs/sizes/prices on the server rather than trusting client display data.

Verification performed with Node 22.23.2:

- All 40 absolute HTTPS image URLs at `https://betadrips.netlify.app/images/catalogue/…` returned valid JPEG images; SHA-256 comparisons matched every repository image. This was a real network check, not a mock.
- Three catalogue tests and the existing 18 authentication tests passed (21 cases). Catalogue tests exercise the real shared data/helper code offline; authentication platform/network dependencies remain mocked apart from the offline SDK check.
- Android JavaScript/Hermes export passed. Website production build and all three existing website test files passed; website checks do not establish live database behaviour.
- The authorized physical phone was verified, Metro restarted with one worker, USB forwarding for 8081 restored/listed, and the installed app opened with Android `Status: ok`. Metro bundled 801 modules. Visual inspection confirmed Shop, preview notice, filters/search, 40-piece count, loaded product photographs and both navigation tabs. No APK rebuild, installation or data clearing was needed.
- The user verified five physical-phone checks: filters/reset, search/empty results, product details, Shop/Account navigation and signed-out browsing. These are user-verified live results. Image-failure retry, licence links, rotation and enlarged text remain pending manual confirmation. Previous user-verified Google authentication results remain documented above; no new sign-in result is inferred from a passing regression test.

Keep the Metro terminal running (`source mobile/android-env.sh`, `cd mobile`, `npx expo start --dev-client --localhost --max-workers 1`). Reapply `adb reverse tcp:8081 tcp:8081` after reconnecting USB. If starting from the development launcher, select the localhost server.

Manual checks: select Bigger (five pieces); combine it with Wedding wear (empty state), then clear filters; search with uppercase/extra spaces and an unmatched term; open a product and compare its image/name/price/description/sizes with the website; use Android Back; visit Account and return to Shop; sign out and confirm browsing still works. Temporarily disconnect networking to check an uncached image's loading/error/retry behaviour. No cart/checkout/purchase controls should appear.

Implementation references: [Expo shared-project Metro configuration](https://docs.expo.dev/guides/monorepos/) and [React Native FlatList](https://reactnative.dev/docs/flatlist). No dependency installation, native rebuild, commit or push was performed for this brick.

Final review: the 10 changed/new files passed private-value/secret-pattern/machine-path checks without printing secret values, and Git whitespace checks passed. Local `.env`, dependencies, generated Android, exports and APK files remain ignored. The final mobile tests and one-worker Android export passed after the account-screen extraction cleanup. Website source, catalogue data, backend, dependency manifests and native configuration are unchanged.

## Mobile shared-cart brick

Product details now require a size before Add to cart. Cart shows the original image/name/size, quantity controls (1–99), removal and naira line/overall totals. Guest browsing and the existing Shop/Account screens remain available; no mobile checkout was added.

### Shared contract and security

The app uses the existing `GET/POST /.netlify/functions/cart` endpoint with the website's Supabase project. Requests contain `operationId`, `mode`, `revision` and validated `items`; ownership comes from the endpoint's verified bearer token, never a mobile-supplied customer ID. The existing server/catalogue validation, revision checks, per-user operation receipts, grants/RLS and SQL migration are unchanged. The user reports that the customer-cart migration is already applied; it was not rerun.

A signed-in replacement uses the last confirmed revision. A conflict refreshes the newer server cart and asks the user to repeat the change, rather than overwriting it. Every request reads the current Supabase session through the same browser-free authenticated-request helper used by the website. A 401 allows one token refresh/retry with the identical operation payload; network/server failures are not treated as session expiry.

The existing encrypted/chunked SecureStore adapter persists one atomic cart journal: guest items, a guest claim and pending operations per customer. A claim freezes the guest snapshot and its initiating account before the network send. A lost response or failed local finalization retries the exact same operation ID/body; the server receipt prevents duplicate merging. Guest data is cleared only after confirmed success and a durable local journal update. A pending claim cannot be moved to another account or edited as a fresh guest cart; sign back into the initiating account to resolve it. A known rejected over-limit merge preserves the guest cart, stops periodic merge attempts and allows adjustment after sign-out or an explicit refresh after reducing the account cart.

Account changes immediately hide old items; generation checks ignore late responses. Unexpected session loss shows a sign-in request and hides account items without deleting the server cart or converting them to guest data. Intentional mobile sign-out still uses local scope. Corrupt/unavailable storage and malformed responses are errors, not successful empty carts. On a network failure, the current account's last confirmed items remain visible and editing pauses until refresh succeeds. After a cold reopen, a signed-in cart still requires a successful server load; an unavailable server produces an error instead of a fabricated empty cart.

### Files changed

- `../src/data/cartModel.js`: extracted the existing pure cart validation, lines and total calculations; `../src/data/cart.js` re-exports them and retains browser-only `readCart`. Website behaviour is preserved.
- `lib/cartApi.mjs`: strict response/API-origin validation and shared authenticated requests, with a 15-second fetch deadline.
- `lib/cartController.mjs`: serialized edits/requests, encrypted journal, exactly-once merge retries, revision conflicts and account isolation. The durable operation and server receipt work together; a UUID alone does not authorize a write.
- `lib/cartRefresh.mjs`: foreground refresh and a 15-second interval while active; backgrounding/disposal clears the interval. Native AppState and timers are injected for tests.
- `lib/useMobileCart.js`: connects the controller to Supabase, SecureStore and React/native lifecycle; render-time ownership checks hide old-account items before effects run.
- `lib/authController.mjs` / `lib/useMobileAuth.js`: expose explicit session-loss state and a current-account-only loss handler, preserving Google PKCE/session restoration/local sign-out.
- `App.js`, `components/CartScreen.js`, `components/ProductDetails.js`: Cart navigation, size selection/Add to cart, quantities/removal/totals, manual refresh/pull-to-refresh and distinct loading/error states.
- `metro.config.js`: also watches the shared pure auth helper under `src/lib`; mobile imports no browser storage, window, document or Web Locks APIs.
- `.env.example`: public API base origin placeholder; ignored local `.env` was set to the local Task 3 server. No server/Mailgun secret was copied.
- `tests/cart.test.mjs` and `tests/auth.test.mjs`: cart/session-loss regression coverage. No new dependencies or native configuration changes were needed.

### Local laptop/phone test setup

The production website still has the earlier backend. Test this brick against the Task 3 checkout on the laptop, not the deployed website. The catalogue photographs continue to use production HTTPS image URLs.

The ignored local mobile environment now includes:

```dotenv
EXPO_PUBLIC_API_BASE_URL=http://127.0.0.1:8888
```

Keep the existing Supabase public URL/publishable key unchanged. `EXPO_PUBLIC_*` values are readable in the app bundle. HTTP is accepted only for `localhost`/`127.0.0.1`, port 8888, in a development build. Production configuration remains available as `EXPO_PUBLIC_API_BASE_URL=https://betadrips.netlify.app`; release code rejects HTTP. Do not switch to the production endpoint until its shared-cart backend is deployed through a separately authorized brick.

Keep two servers running:

1. Netlify dev from the repository root on port 8888 (`npx netlify-cli dev --port 8888` when starting afresh). Its server secrets stay in the ignored root environment, on the laptop. Use **http://localhost:8888** in the laptop browser for the website and Google sign-in.
2. Metro from `mobile/`, with the portable environment helper sourced and one worker: `npx expo start --dev-client --localhost --max-workers 1`. After the new watch folder/configuration, restart once with `--clear` and fully reload the installed app. No APK rebuild is needed for this brick.

Restore USB forwards after reconnecting:

```bash
source mobile/android-env.sh
adb devices -l
adb reverse tcp:8081 tcp:8081
adb reverse tcp:8888 tcp:8888
adb reverse --list
```

Open the installed Beta Drips development app using its localhost Metro server. USB forwards the phone's loopback ports to the laptop; do not replace the local origin with a public HTTP address.

### Verification and remaining manual checks

Automated checks passed with Node 22.23.2: **41 mobile cases** (17 cart, 21 authentication, three catalogue), Android JavaScript/Hermes export, the website production build and three existing website test files. Cart tests use injected in-memory storage/server/receipt/revision models and mocked native lifecycle/timers; they are not live PostgreSQL/RLS or phone-storage checks. API tests execute the real shared token-refresh helper with mocked responses and preserve the POST payload during auth retries. Existing website ownership, server validation, receipt/conflict and checkout-clearing regression tests passed; their database services remain mocked/static as previously documented.

Actual local observations: Netlify dev was confirmed running from this repository on port 8888; GET without a bearer token returned 401, and an invalid bearer token returned 401 through the real endpoint/Supabase auth path. These read-only rejection checks do not establish authenticated cart writes or RLS ownership. The authorized physical phone was verified; both USB forwards were restored/listed. Android app launch returned `Status: ok`, Metro bundled the new code, and visual inspection confirmed the existing Shop/catalogue plus the new Cart tab. The installed APK was reused without rebuilding, reinstalling or clearing data.

**User-verified physical-phone/local-website results:** synchronization in both directions, guest-cart persistence after reopening, guest-cart merging after sign-in and no duplication after refreshing. These are the user's reported live functional results, separate from automated mocks and the agent's launch/visual observations. No live database security/RLS or concurrency test was performed in this brick. Foreground/periodic refresh independently of manual refresh, offline/lost-response recovery, account switching and actual session loss remain pending manual verification.

Manual checklist:

1. Sign into the same account on the phone and **localhost:8888**. On mobile, open a product, select a size and add it. Verify image/size/quantity/total in Cart and that the same line appears on the laptop after focus/refresh.
2. On the laptop change its quantity, add another size or remove a line. Refresh Cart on mobile, or wait about 15 seconds while active. Background/resume mobile and verify foreground refresh too.
3. Sign out of mobile only: old account items must disappear; the website should remain signed in. Add guest lines with distinct sizes, reopen/reconnect the app and confirm persistence. Sign back in: quantities should combine once. Refresh/reopen again to confirm no duplicate merge.
4. Interrupt connectivity/temporarily stop Netlify after loading a signed-in cart: an error should retain the last confirmed cart, not show a successful empty cart. Restore the server and refresh. For a failed guest merge, preserve it and retry with the same account; another account must not receive it.
5. Change the website cart and make a stale mobile change before refresh: expect a conflict, the newer cart and a request to repeat the edit. Test another account and actual revoked-session handling separately. No checkout is present in mobile.

Official references: [React Native AppState](https://reactnative.dev/docs/appstate) and [Expo public environment variables](https://docs.expo.dev/guides/environment-variables/). No migration, deployment, main merge, commit or push was performed.

Final review: 17 changed/new files passed private-value, secret-pattern, portable-path and whitespace checks without printing secret values. Local environment/dependency/native/export/APK files remain ignored; no backend/migration/native/dependency files were changed. Additional regressions cover retaining a same-account snapshot after failed sign-out, ignoring late reads, preserving account-bound pending merges on session loss, identical POST auth retries and keeping a valid restored session when initial-link lookup fails. These are automated results, not additional manual successes.

Pre-commit checks passed again with Node 22.23.2: 41 mobile cases, Android JavaScript/Hermes export with one worker, website tests and website production build. The 17-file secret/path/scope review and ignore checks passed without printing credentials. Only this cart brick, shared helper extraction, its regressions and documentation are included. The user authorized “Add synchronized carts to the Android app” on task-3 and a normal push to the existing origin; no merge, migration, deployment or next feature is authorized. User-reported functional results do not establish live database security/RLS or concurrency testing.

## Mobile demo checkout and order history brick

Signed-in customers can open Cart → Demo checkout, provide the same required full name/email/phone/delivery address as the website and review products, sizes, quantities and naira totals. Checkout, confirmation and every history entry say **“Demo order — no payment taken”**. Account now includes Order history with expandable saved-order references/dates, product/brand/size/quantity details, saved line/grand totals and the website's existing email-status wording. No payment, fulfillment or delivery status is inferred.

### Existing API/retry audit

Mobile submits to the existing `POST /.netlify/functions/submit-order` on the configured API origin. The endpoint verifies the bearer token and derives ownership, validates customer details/product IDs/sizes/quantities and calculates prices from the trusted catalogue. The current `save_cart_order` transaction coordinates order creation and cart clearing under the same customer lock. A new order must match the cart revision/items. An existing retry key is recovered before checking/clearing the cart, so retrying it cannot remove products added afterward. `save_order` also checks the request hash and the unique `(user_id, idempotency_key)` constraint.

No backend protection gap requiring an extension was found. One client retry-identity gap was flagged before implementation: the website changes its retry key when checkout details change. Its server revision checks remain a backstop; this is not evidence that duplicate orders bypass its database protection. Mobile additionally freezes and persists the original payload/key during an unresolved attempt, rather than letting changed details silently acquire a new retry identity. Website checkout/submission and Mailgun processing behaviour were preserved.

### Mobile retry and cart coordination

A synchronous submission gate prevents double taps. Before POST, the app stores a per-account attempt containing its UUID key, exact item snapshot, revision and normalized customer fields in the existing encrypted/chunked SecureStore adapter. Unlike the browser's digest-only attempt, mobile retains the original customer fields encrypted so a cold reopen can safely retry without re-entry changing the request. They are never logged or placed in plaintext environment files. Confirmed records remain encrypted until the customer acknowledges Done; they are then removed. Account changes hide the previous customer's fields/results/history while preserving that account's unresolved recovery record.

Cart mutations/polling are held while a checkout is unresolved, including after reopening. Network errors, auth loss, malformed responses and local finalization failures preserve the attempt and cart/retry state. A known `CART_CONFLICT` means the server rejected creation; only that rejected attempt is dropped, then the newer cart is fetched for review. Corrupt/unavailable attempt storage is an error and blocks new submissions rather than discarding the key.

After a validated successful response, its confirmation is saved durably. The database has already cleared the checkout snapshot atomically; mobile discards only its local old snapshot and **GETs the current cart**. It never sends an empty cart replacement. Account/generation guards reject stale confirmation/history results. A failed cart reload is an error, not a successful empty cart; the confirmed order remains saved. Reopening a confirmed record fetches the cart/history without posting the order again. Failure/uncertainty in Mailgun never makes a confirmed order unsaved or relabels it as paid.

### Shared history and file explanations

History reads the same Supabase `orders`, nested `order_items` and `order_emails(status)` projection/order as website Account. It uses only the public Supabase URL/publishable key and the current customer JWT, with an additional own-account filter. Existing SELECT grants/RLS are the security boundary; client filters alone do not authorize access. History refreshes on sign-in, native foreground return, every 15 seconds while active and the Refresh orders button. Errors retain the last loaded entries for the same account; successful `[]` alone produces the empty state.

- `lib/orderApi.mjs`: existing Netlify POST contract, strict saved-order/total checks, current-token authentication/retry and RLS-protected history reads. Submission allows 45 seconds because the existing endpoint also processes Mailgun; history reads have a 15-second deadline.
- `lib/orderController.mjs`: encrypted per-account recovery journal, synchronous duplicate gate, immutable pending payloads, success/retry/conflict states, late-response guards and history refresh.
- `lib/useMobileOrders.js`: connects the controller to existing Supabase/storage, React and native lifecycle. Render-time ownership guards hide previous-account details immediately.
- `lib/cartController.mjs` / `lib/useMobileCart.js`: pause/recover checkout and perform guarded GET-only confirmation refresh. Cart startup waits for checkout recovery before permitting changes.
- `lib/supabase.js`: exports only the existing public URL/key configuration for history requests; no server credentials were added.
- `components/CheckoutScreen.js`: shared contact validation, highlighted errors, frozen retry fields, order summary, demo wording, saving/success/retry controls and receipt.
- `components/OrderHistory.js`: history loading/error/empty states, manual refresh and expandable saved snapshots/email status.
- `components/AccountScreen.js`, `CartScreen.js`, `ProductDetails.js` and `App.js`: Account history, signed-in checkout entry/recovery navigation, cart editing pause and account-scoped checkout screen state. Shop remains the opening screen and guest browsing remains available.
- `../src/lib/orderStatus.js`: extracted the website's pure email-status mapping unchanged; `../src/components/Account.jsx` imports/re-exports it for sharing without browser/React dependencies.
- `tests/order.test.mjs`: actual controller/API/helper code with injected storage, lifecycle-independent APIs and a server/transaction contract model; it also calls the existing real `prepareOrder` validator/hash function offline.

No backend, SQL migration, native configuration or dependencies were changed. The local API base remains the existing ignored `EXPO_PUBLIC_API_BASE_URL=http://127.0.0.1:8888`; the public Supabase configuration remains the website's project. Environment and generated files remain ignored.

### Verification and physical-phone setup

Automated with Node 22.23.2: **59 mobile cases** (18 new order, 21 auth, 17 cart, three catalogue) passed, as did Android JavaScript/Hermes export with one worker, the website production build and its three existing test files. New cases cover required-field validation, duplicate gating, immutable/lost-response retries, cold reopen, storage failure before/after server success, stale revision recovery, account/session-loss isolation, late checkout/history replies, guarded GET-only cart confirmation, preserving later cart additions, malformed responses and current-JWT/public-key history calls. Platform/storage/network/transaction services are mocked or in-memory; they do not execute live PostgreSQL/RLS/concurrency or Mailgun tests. Existing server contract/static-SQL checks remain distinct from real database checks.

Actual observations: the authorized physical phone was verified; Metro on 8081 and Netlify dev on 8888 were healthy, both USB forwards were restored/listed and Android launch returned `Status: ok`. A real unauthenticated POST to the local order endpoint returned 401 without creating an order. A Metro reload temporarily left a blank development-client screen. Restarting only the app process and reconnecting the existing client recovered Shop; visual inspection confirmed the catalogue and Shop/Cart/Account tabs. No native runtime error was captured by the filtered log check. This is launch/reconnection evidence, not a successful checkout/history test. No APK rebuild, reinstall or app-data clearing was performed.

**User-verified manual results:**

- A phone order appeared in website Order history, and both carts cleared.
- A website order appeared in phone Order history with correct details.
- Phone sign-out hid its order history while the website remained signed in.
- A confirmation email arrived in spam.

Failed-submission/retry behaviour was **not manually verified**. Duplicate prevention under uncertain network conditions, stale-revision handling and cross-account switching remain pending manual checks. No live database security/RLS or concurrency testing is claimed. Email delivery is confirmed only for the message reported by the user. Earlier user-verified authentication/catalogue/cart results remain separate.

Keep **Metro and Netlify dev** running. Continue using **http://localhost:8888** on the laptop, not the older deployed backend. After USB reconnection restore `adb reverse tcp:8081 tcp:8081` and `adb reverse tcp:8888 tcp:8888`; open Beta Drips through the localhost Metro development client. No rebuild is needed because all native modules were already installed.

Manual checklist:

1. Sign into the same account on both platforms. Add a small cart on mobile, open Demo checkout and test required-field errors. Complete valid fields using a Mailgun-authorized email (the existing Mailgun sandbox is restricted to authorized recipients). Review sizes/quantities/total and demo wording; place exactly one order.
2. Confirm the saved-order success/reference and email status. The shared cart should refresh after confirmed creation. On the website open Account → Order history → Refresh orders and compare that reference/items/total. Email acceptance does not prove inbox delivery; a failed email must still leave the order saved.
3. Create a separate demo order on the local website. On mobile open Account → Refresh orders; compare details. Reopen/reconnect mobile and verify history/account restoration. The user verified order-history synchronization and phone sign-out hiding history while the website stayed signed in; failure/retry and cross-account switching remain pending.
4. Test a failed/uncertain submission by interrupting connectivity or temporarily stopping Netlify. The cart/attempt must remain available, fields must freeze and Retry this demo order must reuse the original submission. Reopen if needed and retry with the same account after restoring the server; verify only one order. If an order already saved before the interruption, items subsequently added on the website must survive its retry.
5. Change the cart on the website just before mobile submission to test a stale revision: expect rejection, refreshed cart and review before ordering again. Sign out/switch accounts and verify old history/contact fields disappear and only the current account's orders load. These are functional manual scenarios; they do not replace database/RLS or load/concurrency testing.

Official references checked: [Supabase Data REST API](https://supabase.com/docs/guides/api), [RLS/grants and user JWTs](https://supabase.com/docs/guides/database/postgres/row-level-security) and [Expo SecureStore persistence](https://docs.expo.dev/versions/latest/sdk/securestore/). No commit, push, merge, migration or deployment was performed.

Pre-commit scope: checkout/history changes and documentation only. The unfinished server email diagnostic/status-write edit from the stopped Mailgun investigation remains uncommitted and is excluded. No emails were resent or email settings changed. The user authorized a separate task-3 commit and normal origin push, with no merge or deployment.

Final checkout/history checks passed again with Node 22.23.2: all four mobile test files (59 cases), all three website test files, website production build and one-worker Android JavaScript/Hermes export. The changed-file secret/path review and ignore/whitespace checks passed without exposing credentials. Automated services remain mocked/in-memory; no new live database/RLS/concurrency checks were performed.

## Mobile production backend configuration brick

Current setup uses the deployed **https://betadrips.netlify.app** website/backend. Earlier localhost instructions and manual results above describe the previous testing phase. This focused brick starts from `main` commit `df2ee50` on branch `mobile-release-config`; logos and standalone APK work are deferred.

The existing setting is `EXPO_PUBLIC_API_BASE_URL`. Both `useMobileCart.js` and `useMobileOrders.js` already pass it through the shared origin validator, with the live HTTPS origin as their default. Only the ignored `mobile/.env` override was changed from localhost to the live origin; Supabase public configuration was preserved. The placeholder `.env.example` clarifies that the deployed backend is the default and documents an explicit local override. No application, authentication, storage, cart, order, dependency or native code changed. SecureStore sessions/guest journals/account-bound pending operation IDs and checkout retries are preserved; app data was not cleared.

From the repository root, use production configuration:

```bash
source mobile/android-env.sh
cd mobile
npx expo start --dev-client --localhost --port 8081 --max-workers 1
```

For deliberate local API testing, stop Metro and use the explicit process override:

```bash
source mobile/android-env.sh
cd mobile
EXPO_PUBLIC_API_BASE_URL=http://127.0.0.1:8888 npx expo start --dev-client --localhost --port 8081 --max-workers 1 --clear
```

Local mode also needs Netlify dev on 8888 and `adb reverse tcp:8888 tcp:8888`. To return to live mode, stop that process and start Metro normally again. Restart/full reload loads the new environment without clearing app data. Port 8081 forwarding remains necessary for the development client; production API calls use the phone's internet connection over HTTPS. Port 8888 forwarding was absent during this live setup. The existing Netlify dev server was not stopped or changed.

Security lesson: `EXPO_PUBLIC_*` values are visible in the app bundle. The only configured values remain the public API origin, Supabase URL and publishable key; server Supabase and Mailgun secrets remain server-side. HTTP overrides are accepted only for loopback port 8888 in development builds. HTTPS backend selection does not bypass bearer-token validation, ownership checks or existing RLS.

Verification: all four mobile test files (59 existing cases), one-worker Android JavaScript/Hermes export, all three website test files and website production build passed with Node 22.23.2. Existing controller/API/storage/transaction tests use mocks/in-memory services; these checks do not establish live database security or concurrency. No new implementation-mirroring test was added for this configuration/documentation-only change.

Actual observations: the physical phone reported `device`; the existing app was restarted/reconnected without reinstalling, rebuilding or clearing data. Metro was restarted with one worker and the updated environment. Its served Android JavaScript bundle assigns `EXPO_PUBLIC_API_BASE_URL` to the live HTTPS origin, and both cart/checkout clients use that variable. Only 8081 was forwarded. Android launch returned `Status: ok`, the app was in the foreground, and visual inspection confirmed Shop, loaded photos and Shop/Cart/Account tabs. Inspector network observation was unavailable, so no authenticated app request or new manual success is inferred from bundle configuration or launch alone.

**Pending user verification on the live website:**

1. Open Account and verify Google sign-in returns to Beta Drips. Existing saved sessions must remain available after reconnection.
2. Sign into the same account on **https://betadrips.netlify.app**. Add/edit/remove a size on the phone and verify the website after focus/refresh; change the website cart and refresh the phone. Use the live website, not localhost:8888.
3. Submit one demo order using an authorized sandbox recipient. Confirm success, both carts clearing and matching order reference/details in both histories. Optional reverse-direction checkout remains a separate result until reported. Do not place another order just to retry an uncertain response; use its saved retry action.
4. Sign out on the phone. Its account/cart/history should hide, while the live website remains signed in after refresh.

Record these results only when the user confirms them. Failed-submission/retry behaviour, live RLS/security and concurrency remain unverified manually. No commit, push, deployment, migration, logo change or APK build was performed.

Reference: [Expo environment variables](https://docs.expo.dev/guides/environment-variables/), checked for the installed project's existing public-variable workflow.
