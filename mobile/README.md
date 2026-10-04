# Beta Drips for Android

This brick creates a JavaScript Expo development app with a simple branded home screen. Authentication, catalogue screens, shared-cart synchronization and checkout are later bricks. No backend configuration or credentials are needed to open this home screen.

## Files and concepts

- `App.js`: the home screen, built from native Text/View/ScrollView components. It reuses the website's cream, dark text and green colours. Safe-area handling keeps content away from the phone's system bars; scrolling accommodates larger text settings.
- `index.js`: registers App with Expo as the application entry point.
- `app.json`: Android-only configuration, display name **Beta Drips**, Android application ID `com.betadrips.app`, and custom URL scheme `betadrips`. The future callback can use `betadrips://auth/callback`; no callback handler or Google/Supabase configuration exists yet.
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
