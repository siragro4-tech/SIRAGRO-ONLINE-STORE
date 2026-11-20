# SIRAGRO Customer Mobile App (`apps/mobile`)

Customer shopping app for **SIRAGRO Supermarket & Off-Licence** (147 North Hyde Road, Hayes, UB3 4NS), built with **Flutter** for Android and iOS.

> **Important:** This is the **customer** shopping app. It is separate from the Next.js web storefront, the web Admin Portal (`/admin`), and any future shop-counter printer utility.

---

## Architecture Overview

- **Monorepo Layout:** The existing Next.js website & backend remain at the repository root so Vercel deployments are unaffected. The Flutter app lives in `apps/mobile/`.
- **Shared Backend:** Uses the existing Supabase project (Auth + RLS-protected profiles/addresses + public storage) and versioned Next.js HTTP endpoints under `/api/v1/*`.
- **No Secrets in App:** The app only uses `SIRAGRO_SUPABASE_ANON_KEY` and `SIRAGRO_API_BASE_URL`. It **never** contains `SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_SECRET_KEY`, or `RESEND_API_KEY`.
- **Guest Basket Security:** Guest baskets use an HMAC-signed `X-Siragro-Guest-Token` issued by the server and stored in `flutter_secure_storage` (Android Keystore / iOS Keychain), never in plain `SharedPreferences`.

---

## Prerequisites

1. Install **Flutter SDK** (3.24+ / Dart 3.5+): <https://docs.flutter.dev/get-started/install>
2. Install **Android Studio** (for Android emulator / SDK) and/or **Xcode** (macOS only, for iOS simulator).
3. Verify your setup:
   ```bash
   flutter doctor
   ```

---

## Running the App Locally (Against Staging)

Never point a development build at the live production database until staging has been verified.

1. Go to the mobile folder and fetch packages:
   ```bash
   cd apps/mobile
   flutter pub get
   ```
2. Run with `--dart-define` using your **staging** values (see `.env.example`):
   ```bash
   flutter run \
     --dart-define=SIRAGRO_ENV=staging \
     --dart-define=SIRAGRO_API_BASE_URL=http://10.0.2.2:3000 \
     --dart-define=SIRAGRO_SUPABASE_URL=https://your-staging-project.supabase.co \
     --dart-define=SIRAGRO_SUPABASE_ANON_KEY=your-staging-supabase-anon-key
   ```
   *(Tip: On Android Emulator, `10.0.2.2` points to `localhost` on your computer. On a physical phone or iOS Simulator, use your machine's local IP or staging HTTPS URL.)*

---

## Debug Design Preview Mode (Offline UI Preview)

If you want to preview the redesigned screens, typography, motion, and sample grocery cards **without** connecting to Supabase or a backend server, launch the app in **debug mode** with `SIRAGRO_DESIGN_PREVIEW=true`:

```bash
cd apps/mobile
flutter pub get
flutter run --dart-define=SIRAGRO_DESIGN_PREVIEW=true
```

- **Debug-only:** This mode only works when `kDebugMode` is true and never activates in release/production builds.
- **Clearly labelled:** A top banner (`DESIGN PREVIEW • SAMPLE DATA`) appears across the app so sample data cannot be mistaken for live store inventory or prices.
- **No live backend calls:** Categories, sample products, and an in-memory basket are loaded locally from `lib/core/preview/design_preview_fixtures.dart`, while Home Delivery remains unconfirmed/disabled.

---

## Formatting, Analysis & Tests

```bash
cd apps/mobile
dart format --output=none --set-exit-if-changed .
flutter analyze
flutter test
```

To build a debug Android APK (once Android SDK is configured):
```bash
flutter build apk --debug
```

---

## Native Launcher Icons & Launch Splash Generation

Branding PNG derivatives generated from `public/images/siragro-logo.jpg` live in `apps/mobile/assets/branding/` and are configured in `pubspec.yaml` via `flutter_launcher_icons` and `flutter_native_splash`.

Because `apps/mobile/android/` and `apps/mobile/ios/` are not yet checked into the repository (and Flutter is required to generate native platform resources), run the following on a machine with Flutter installed — **never** run `flutter create .` directly inside `apps/mobile/`:

```bash
# 1. Scaffold platform folders in a temporary directory (from repo root)
flutter create --platforms=android,ios --org uk.co.siragro --project-name siragro_mobile temp_mobile_shell
cp -r temp_mobile_shell/android apps/mobile/android
cp -r temp_mobile_shell/ios apps/mobile/ios
rm -rf temp_mobile_shell

# 2. Fetch packages and generate native icons & splash screens
cd apps/mobile
flutter pub get
dart run flutter_launcher_icons
dart run flutter_native_splash:create
```
