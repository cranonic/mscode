# Haptics on Android

mono-editor uses:
1. `navigator.vibrate` (works in Chrome; WebView needs permission / no block)
2. Optional `@capacitor/haptics` if installed in the app

App (Capacitor):
```
npm i @capacitor/haptics
npx cap sync
```

AndroidManifest may need nothing for Haptics plugin (uses system vibrator API).

If dbl-tap vibrates in browser but not app WebView:
- Ensure not calling from non-user-gesture in some paths
- Install @capacitor/haptics for reliable native vibration
