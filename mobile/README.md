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
