# My Goat — Android App

The Android app wraps the existing Next.js frontend with **Capacitor** and talks to
the existing Express backend over your network. The backend stays on a computer or
server; the phone does not store the database.

- App name: **My Goat**
- Package ID: `com.mygoat.app`
- Minimum Android version: **7.0** (API 24)
- Android project: `frontend/android/`

## Ready-built APK

A debug APK has been built and is available at:

`C:\Users\USER\Desktop\Goat_Farm\MyGoat-debug.apk`

It is signed with the standard Android debug key, which is fine for installing
directly on your own phone. For sharing with others or publishing, create a signed
release APK (see the end of this guide).

## What is already set up

- `next.config.js` uses `output: 'export'` — `npm run build` produces `frontend/out`.
- `capacitor.config.ts` points Capacitor at `out` and allows HTTP on your local Wi-Fi.
- The login screen has a **Server connection** section. The address is saved on the
  phone, so you can change servers later without rebuilding the APK.
- The interface uses a slide-out menu on phones and scrollable data tables.
- The backend prints its LAN address on startup and accepts requests from the app.
- Android manifest allows cleartext HTTP for local testing.
- App icon and splash screen are generated from `frontend/assets/`.

## 1. Install Android Studio

Download and install [Android Studio](https://developer.android.com/studio).

In **SDK Manager**, make sure these are installed:

- Android SDK Platform 36
- Android SDK Build-Tools
- Android SDK Platform-Tools

Android Studio includes the JDK needed to build. If you only plan to build from the
Android Studio UI, you do not need a separate Java install.

## 2. Run the backend on your PC

In a terminal:

```powershell
cd C:\Users\USER\Desktop\Goat_Farm\backend
npm start
```

The output will include something like:

```
Backend API running on port 3001
  Web:   http://localhost:3001/api
  Phone (Wi-Fi): http://192.168.1.10:3001/api
```

The `Phone (Wi-Fi)` address is what the app uses. Ignore entries for virtual
adapters such as `vEthernet` or `VMware Network Adapter` unless that is how your PC
connects. Notes:

- The phone and PC must be on the **same Wi-Fi network**.
- If Windows Firewall asks, allow **Node.js** on **Private networks**. If it does not
  ask, run this once in an Administrator PowerShell:

```powershell
New-NetFirewallRule -DisplayName "Goat Farm API" -Direction Inbound -LocalPort 3001 -Protocol TCP -Action Allow -Profile Private
```

- The PC must stay awake and the backend must stay running.

## 3. Build the app

### Option A — Included build script (fastest)

This PC already has JDK 21 and the Android SDK under
`%LOCALAPPDATA%\GoatFarmToolchain`. The script sets them up automatically:

```powershell
cd C:\Users\USER\Desktop\Goat_Farm
.\build-apk.ps1
```

It rebuilds the frontend, syncs Capacitor, builds the debug APK, and copies it to:

`C:\Users\USER\Desktop\Goat_Farm\MyGoat-debug.apk`

If PowerShell blocks the script, run:

```powershell
powershell -ExecutionPolicy Bypass -File .\build-apk.ps1
```

Use `.\build-apk.ps1 -SkipSync` when the web assets have not changed.

### Option B — Android Studio

1. Open the folder `C:\Users\USER\Desktop\Goat_Farm\frontend\android` in Android Studio
   (not the `frontend` folder).
2. Wait for Gradle sync to finish.
3. Connect your phone with USB debugging enabled, or build an APK:
   **Build → Build App Bundle(s) / APK(s) → Build APK(s)**.
4. The debug APK is created at:
   `frontend\android\app\build\outputs\apk\debug\app-debug.apk`
5. Copy it to the phone and install it. Android will ask you to allow installing from
   that app/source ("Install unknown apps"). This is normal for a sideloaded APK.

> Rebuild the web assets before the APK whenever frontend code changes: `npm run mobile:sync`.

## 4. First login

1. Open **My Goat**.
2. Tap **Server connection**.
3. Enter the `Phone:` address printed by the backend, for example
   `http://192.168.1.10:3001/api`, and tap **Save**.
4. Sign in with `admin` / `admin` (change this password before exposing the server
   to the internet).

If login says it cannot reach the server, check:

- Phone and PC are on the same Wi-Fi.
- The backend terminal is still running.
- The IP address is still correct (it can change after a router restart).
- Windows Firewall allows port 3001 on Private networks.

With USB debugging enabled, you can install the APK directly:

```powershell
adb install -r C:\Users\USER\Desktop\Goat_Farm\MyGoat-debug.apk
```

## 5. Using a hosted server later

You do not need to rebuild the app. Host the backend on an HTTPS address, then enter
that address in **Server connection** on the login screen, e.g.
`https://goat-api.example.com/api`.

The backend needs:

- A Node.js process that stays running (`npm start` in `backend/`).
- A **persistent disk** for `backend/data/goatfarm.db` and uploaded files.
- HTTPS (most hosts provide it automatically).

Good fits: a small VPS, Render, Railway, or Fly.io with a volume. Avoid free tiers
that sleep or have ephemeral disks — the SQLite database and reminders need to persist.

Set these environment variables on the host:

| Variable | Purpose |
| --- | --- |
| `JWT_SECRET` | Long random string; replaces the development default |
| `CORS_ORIGIN` | Optional comma-separated web origins (the Android app is always allowed) |
| `WHATSAPP_API_KEY` | Optional; without it WhatsApp messages stay in sandbox mode |
| `PORT` | Usually set by the host automatically |

When the API is on HTTPS, you can optionally disable local HTTP support:

- `frontend/capacitor.config.ts`: set `cleartext` and `allowMixedContent` to `false`
- `frontend/android/app/src/main/AndroidManifest.xml`: remove
  `android:usesCleartextTraffic="true"`

Then run `npm run mobile:sync` and rebuild.

## Rebuilding icons or splash

Edit the SVG files in `frontend/assets/`, then run:

```powershell
cd frontend
npm run mobile:assets
```

## Creating a signed release APK

In Android Studio: **Build → Generate Signed App Bundle / APK → APK**.

1. Create a keystore (first time) and choose a password.
2. Save the `.jks` file and password somewhere safe. You need the same keystore for
   every future update; losing it means you cannot update an installed app.
3. Choose `release`, then finish. The signed APK is under
   `android\app\build\outputs\apk\release\`.

For Google Play you need an `.aab` instead, a Google Play developer account, and
Google's current target-API requirements.

## Current limitations

- **Internet required:** all data is on the backend. There is no offline mode yet.
- **Printing:** the Reports page uses `window.print()`, which may not work inside the
  Android WebView. Server-generated PDFs would be the next improvement.
- **QR scanner:** the Scanner page is manual input; camera scanning is not enabled yet.
- **Backups:** back up `backend/data/goatfarm.db` regularly (plus the uploads folder).
