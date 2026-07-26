# Practice Log — desktop app

Your OSSU habit tracker, wrapped as a real desktop app with Electron. Your data
saves permanently on your computer — no more resets on refresh.

## One-time setup

You'll need [Node.js](https://nodejs.org) installed (the LTS version is fine).
To check if you already have it, open a terminal and run:

```
node -v
```

If that prints a version number, you're set. If not, download and install it
from nodejs.org first.

## Run it (development mode)

1. Open a terminal in this folder (`practice-log-app`)
2. Install dependencies (only needed once):
   ```
   npm install
   ```
3. Launch the app:
   ```
   npm start
   ```

This opens the tracker in its own window. Your data is saved automatically
every time you check a box — close and reopen the app anytime and it'll be
right where you left it.

## Put it on your desktop (real installer)

To turn this into an actual installable app (with an icon you can pin to your
dock/taskbar or launch from your Applications/Start menu):

```
npm run build
```

This creates an installer in the `dist` folder:
- **macOS** → a `.dmg` file — open it and drag the app into Applications
- **Windows** → a `.exe` installer — run it like any other installer
- **Linux** → an `.AppImage` — make it executable and run it directly

Once installed, launch "Practice Log" like any other app on your computer,
and optionally drag it to your dock/taskbar for quick access.

## Notes

- **You only need the terminal once**, for setup and to build the
  installer. After that, launch "Practice Log" from your
  Applications/Start menu/dock like any other app — no more `npx electron .`
- Your data lives in this app's own local storage on your machine — it's
  private to you and doesn't sync anywhere.
- The app icon (`icon.png` — a heart in a rounded square) is already wired
  up in `package.json`, so `npm run build` will use it automatically.
- The window opens maximized and wide by default, so a full month of the
  habit tracker is visible without scrolling.
- If `npm install` fails, make sure you're connected to the internet — it
  downloads Electron itself, which is a few hundred MB.
