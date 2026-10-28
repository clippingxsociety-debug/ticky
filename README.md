# Dayflow — Daily Planner

An original, Brio-inspired daily planner PWA for iPhone. It is not a copy of Brio's proprietary code or exact interface.

## Included
- Daily timeline for tasks and habit steps
- Checkable habit steps with their own time
- Habit progress and numeric goals (for example, 2,300 ml water)
- Reusable routines that can be added to today
- Recurring tasks (daily, weekdays, weekly)
- Local storage and JSON export/import
- Responsive iPhone layout and Add to Home Screen support
- Basic offline caching when hosted over HTTPS

## Deploy to GitHub Pages (iPhone)
1. Extract this ZIP.
2. Create a GitHub repository, for example `dayflow-planner`.
3. Upload **all files and folders** from this folder to the repository root (not the ZIP itself).
4. In GitHub, open **Settings → Pages**.
5. Under Build and deployment, choose **Deploy from a branch**, select `main` and `/ (root)`, then Save.
6. Wait for GitHub Pages to publish the site. Open the published `https://...github.io/...` URL in Safari on your iPhone.
7. Tap **Share → Add to Home Screen → Add**.
8. Open Dayflow from the Home Screen.

## Important notes
- Data is stored locally in this browser on this device. Use **Settings & data → Export backup** regularly.
- Import a JSON backup to restore your tasks and routines.
- Browser-based reminders while the app is fully closed are not guaranteed on iOS. This version does not claim to provide reliable background push notifications.
- The app uses Google Fonts when online; it falls back to system fonts if unavailable.
- Do not open `index.html` directly from the Files app if you want install/offline support; host it over HTTPS first.

## Data
Your content is saved in the browser's local storage. Clearing Safari website data can remove it, so export backups.
