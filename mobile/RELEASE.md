# Signed Android release

The first standalone release is **1.0.0**, Android version code **2**. Package `com.betadrips.app` and Google callback `betadrips://auth/callback` are unchanged. It bundles JavaScript, approved icons/splash and the HTTPS production API; Metro and USB forwarding are unnecessary.

## Private signing backup

The local signing directory is `${XDG_DATA_HOME:-$HOME/.local/share}/beta-drips/signing`, outside this repository. It contains `beta-drips-release.p12` and `signing.env`. Directory permissions are 0700 and files 0600. Never commit or upload these files to a release. Back up the keystore in encrypted storage and save its passwords/alias in a password manager, with a separate encrypted recovery copy. Future APK updates must use the **same** certificate and a larger version code. Losing the key prevents compatible updates to this package.

`signing.env` exports `BETADRIPS_ANDROID_STORE_FILE`, `BETADRIPS_ANDROID_STORE_PASSWORD`, `BETADRIPS_ANDROID_KEY_ALIAS` and `BETADRIPS_ANDROID_KEY_PASSWORD`. After restoring a backup, adjust only the private store path. `BETADRIPS_SIGNING_ENV` can explicitly select another trusted private file.

## Build

Use the installed Node 22/JDK 17/Android SDK prerequisites documented in README.md. Copy `.env.example` to ignored `.env` and configure only the public Supabase URL/publishable key.

```bash
source mobile/android-env.sh
cd mobile
npm run build:release
```

The script prebuilds ignored native Android files, then runs `app:assembleRelease` with one Gradle worker, one JavaScript bundling worker, a 1536 MB JVM and both ARMv7/ARM64 architectures. It disables the development launcher in release. The signing plugin refuses release tasks without private signing variables, the production HTTPS API or when the development launcher is enabled. The script disables dotenv auto-loading and supplies public settings explicitly so local development overrides cannot enter the release. It copies the APK to ignored `mobile/releases/Beta-Drips-v1.0.0.apk`.

Verify the APK using SDK `apksigner verify --print-certs` and `aapt2 dump badging`, plus SHA-256. Check package/version, bundled JavaScript, production API, launcher/splash resources and that the APK is not debuggable. Build success alone does not establish physical-phone functionality.

## Existing development installation

The previously installed development app used a debug certificate. This release uses a private release certificate, so Android will reject an in-place update. **Do not uninstall or clear data automatically.** Obtain explicit approval before replacing it: uninstalling loses local SecureStore sessions, guest carts and pending local operations. Server-owned carts/orders/accounts remain on Supabase. Finish or preserve important guest work before removal. Future releases signed with the same new key can update in place.

After approved installation, stop Metro and disconnect USB. Manually verify icon launch, loaded images, Google sign-in, saved session after reopening, both directions of live website/cart synchronization, demo checkout/cart clearing/shared history and phone-only sign-out. Do not publish the APK until the user confirms these checks.

## Publication

After phone verification, create a versioned GitHub Release in `Hashedmystic/Beta-Drips` with the APK and checksum, concise release notes, version and source commit. Verify repository and anonymous asset download visibility before describing the link as public. APKs and generated native files stay out of Git history. Email remains the existing Mailgun sandbox flow; no migrations are required by this release.

## Current artifact verification

Build completed successfully in 19m 28s with one worker. APK size: 38,372,090 bytes. SHA-256: `e579b146801272f9023ae03ea7c4616fea7872d59f06709edc75a279d538c9d2`.

Release certificate SHA-256: `045628016610b9f484adbd30f55b1247b234731d0dc0ca0925fabe7e9eae733a` (RSA-4096). It is not the installed debug certificate. Inspection verified API 24+, both ARM architectures, embedded Hermes JavaScript/live HTTPS API, callback scheme, no development launcher activity/debuggable flag and no known private values. These are artifact checks. The user subsequently confirmed all standalone physical-phone checks passed with USB disconnected and Metro stopped: branding/images, Google sign-in, session persistence, live website cart synchronization, demo checkout/shared history and phone-only sign-out. Installation method after the initial blocked ADB attempt was not agent-observed. Live RLS/security/concurrency testing and newly manual retry/failure checks are not claimed. Publication as v1.0.0 is authorized after recording these results and pushing the documentation; anonymous accessibility is verified after publication.

Actual Gradle negative check: an offline `app:assembleRelease --dry-run` without the four private signing variables failed with the expected signing-credentials guard. No APK was produced by that check.
