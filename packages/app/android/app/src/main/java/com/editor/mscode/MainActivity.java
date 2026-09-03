package com.editor.mscode;

import android.app.Dialog;
import android.content.Intent;
import android.graphics.Color;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Environment;
import android.os.Handler;
import android.os.Looper;
import android.provider.Settings;
import android.view.View;
import android.view.Window;
import android.view.WindowManager;
import android.webkit.WebSettings;
import android.webkit.WebStorage;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Toast;

import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsControllerCompat;

import com.getcapacitor.BridgeActivity;

import java.io.File;

public class MainActivity extends BridgeActivity {

    private static final int IDE_BG = Color.parseColor("#1E1E1E");
    private int lastStatusBarColor = IDE_BG;
    private boolean lastLightIcons = false;
    private Dialog splashDialog;
    private final Handler mainHandler = new Handler(Looper.getMainLooper());
    private boolean splashDismissed = false;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        // Native plugins before super (Capacitor requirement)
        registerPlugin(NativeSearchPlugin.class);
        registerPlugin(NativeTerminalPlugin.class);
        registerPlugin(SafStoragePlugin.class);
        registerPlugin(MsStatusBarPlugin.class);

        super.onCreate(savedInstanceState);

        // Status bar ↔ IDE dark theme (white icons on #1E1E1E)
        applyStatusBarColor(IDE_BG, /* lightIcons */ false);

        // ─── EMERGENCY RESET LOGIC ───
        Intent intent = getIntent();
        if (intent != null && "com.editor.mscode.RESET_IDE".equals(intent.getAction())) {
            clearIDEState();
            Toast.makeText(this, "IDE State & Filesystem Reset Successful", Toast.LENGTH_LONG).show();
        }
        // ─────────────────────────────

        if (this.bridge != null && this.bridge.getWebView() != null) {
            this.bridge.getWebView().getSettings()
                .setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);
        }

        // Android Studio–style loading card (not cancelable by touch)
        showSplashDialog();

        // Dismiss when WebView finishes first load, with a safety timeout
        attachSplashDismissHooks();

        // Android 11+ All Files Access
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            if (!Environment.isExternalStorageManager()) {
                try {
                    Intent accessIntent = new Intent(Settings.ACTION_MANAGE_APP_ALL_FILES_ACCESS_PERMISSION);
                    accessIntent.addCategory("android.intent.category.DEFAULT");
                    accessIntent.setData(Uri.parse(String.format("package:%s", getApplicationContext().getPackageName())));
                    startActivity(accessIntent);
                } catch (Exception e) {
                    Intent fallbackIntent = new Intent();
                    fallbackIntent.setAction(Settings.ACTION_MANAGE_ALL_FILES_ACCESS_PERMISSION);
                    startActivity(fallbackIntent);
                }
            }
        }
    }

    // ─── Status bar ──────────────────────────────────────────────────────────

    /**
     * Sync system status bar with IDE theme.
     * @param colorArgb background color
     * @param lightIcons true → dark icons (light bar); false → light/white icons (dark bar)
     */
    public void applyStatusBarColor(int colorArgb, boolean lightIcons) {
        lastStatusBarColor = colorArgb;
        lastLightIcons = lightIcons;

        Window window = getWindow();
        if (window == null) return;

        // Capacitor / Android 15 edge-to-edge ignores setStatusBarColor unless we
        // opt back into "decor fits system windows" for the bar region.
        WindowCompat.setDecorFitsSystemWindows(window, true);

        window.addFlags(WindowManager.LayoutParams.FLAG_DRAWS_SYSTEM_BAR_BACKGROUNDS);
        window.clearFlags(WindowManager.LayoutParams.FLAG_TRANSLUCENT_STATUS);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.KITKAT) {
            window.clearFlags(WindowManager.LayoutParams.FLAG_TRANSLUCENT_NAVIGATION);
        }

        window.setStatusBarColor(colorArgb);
        window.setNavigationBarColor(colorArgb);

        View decor = window.getDecorView();

        // Legacy flags (API 23+) — some OEM skins only honor these
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            int flags = decor.getSystemUiVisibility();
            if (lightIcons) {
                flags |= View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR;
            } else {
                flags &= ~View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR;
            }
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                if (lightIcons) {
                    flags |= View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR;
                } else {
                    flags &= ~View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR;
                }
            }
            decor.setSystemUiVisibility(flags);
        }

        WindowInsetsControllerCompat insets =
            WindowCompat.getInsetsController(window, decor);
        if (insets != null) {
            // lightIcons=true → dark glyphs on a light bar
            insets.setAppearanceLightStatusBars(lightIcons);
            insets.setAppearanceLightNavigationBars(lightIcons);
        }

        // Re-assert after a frame (WebView / Bridge sometimes overwrites on layout)
        decor.post(() -> {
            window.setStatusBarColor(colorArgb);
            window.setNavigationBarColor(colorArgb);
            WindowInsetsControllerCompat i2 =
                WindowCompat.getInsetsController(window, decor);
            if (i2 != null) {
                i2.setAppearanceLightStatusBars(lightIcons);
                i2.setAppearanceLightNavigationBars(lightIcons);
            }
        });

        android.util.Log.i("MsStatusBar",
            "apply color=#" + Integer.toHexString(colorArgb)
                + " lightIcons=" + lightIcons
                + " actual=" + Integer.toHexString(window.getStatusBarColor()));
    }

    @Override
    public void onResume() {
        super.onResume();
        // System / WebView may reset bar after pause — re-apply last theme colors
        applyStatusBarColor(lastStatusBarColor, lastLightIcons);
    }

    /** Called from Capacitor/JS bridge when the active color theme changes. */
    public void setStatusBarFromHex(String hex, boolean lightIcons) {
        try {
            int color = Color.parseColor(hex.startsWith("#") ? hex : "#" + hex);
            runOnUiThread(() -> applyStatusBarColor(color, lightIcons));
        } catch (Exception ignored) {
            runOnUiThread(() -> applyStatusBarColor(IDE_BG, false));
        }
    }

    // ─── Splash dialog ───────────────────────────────────────────────────────

    private void showSplashDialog() {
        if (isFinishing()) return;
        try {
            splashDialog = new Dialog(this, R.style.MsSplashDialog);
            splashDialog.setContentView(R.layout.dialog_splash);
            splashDialog.setCancelable(false);
            splashDialog.setCanceledOnTouchOutside(false);
            if (splashDialog.getWindow() != null) {
                splashDialog.getWindow().setLayout(
                    WindowManager.LayoutParams.MATCH_PARENT,
                    WindowManager.LayoutParams.MATCH_PARENT
                );
                splashDialog.getWindow().setBackgroundDrawableResource(android.R.color.transparent);
            }
            splashDialog.show();
        } catch (Exception e) {
            e.printStackTrace();
            splashDialog = null;
        }
    }

    private void dismissSplashDialog() {
        if (splashDismissed) return;
        splashDismissed = true;
        mainHandler.post(() -> {
            try {
                if (splashDialog != null && splashDialog.isShowing()) {
                    splashDialog.dismiss();
                }
            } catch (Exception ignored) {
            }
            splashDialog = null;
        });
    }

    private void attachSplashDismissHooks() {
        // Safety: never leave splash stuck
        mainHandler.postDelayed(this::dismissSplashDialog, 12_000);

        if (this.bridge == null || this.bridge.getWebView() == null) {
            mainHandler.postDelayed(this::dismissSplashDialog, 2500);
            return;
        }

        WebView webView = this.bridge.getWebView();
        final WebViewClient existing = null; // Bridge owns client; wrap via post-load check

        // Poll readiness: when page has progress ~100 or title set
        mainHandler.postDelayed(new Runnable() {
            int tries = 0;
            @Override
            public void run() {
                if (splashDismissed || isFinishing()) return;
                tries++;
                try {
                    if (webView.getProgress() >= 100 && webView.getUrl() != null) {
                        // Small grace so first paint of React root can land
                        mainHandler.postDelayed(() -> dismissSplashDialog(), 350);
                        return;
                    }
                } catch (Exception ignored) {
                }
                if (tries < 40) {
                    mainHandler.postDelayed(this, 200);
                } else {
                    dismissSplashDialog();
                }
            }
        }, 400);
    }

    // ─── Reset helpers ───────────────────────────────────────────────────────

    private void clearIDEState() {
        try {
            WebStorage.getInstance().deleteAllData();
            getSharedPreferences("CapacitorStorage", MODE_PRIVATE).edit().clear().apply();

            if (this.bridge != null && this.bridge.getWebView() != null) {
                this.bridge.getWebView().clearCache(true);
                this.bridge.getWebView().clearHistory();
            }

            File filesDir = getFilesDir();
            File storageDir = new File(filesDir, "storage");
            if (storageDir.exists()) {
                deleteRecursive(storageDir);
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    private void deleteRecursive(File fileOrDirectory) {
        if (fileOrDirectory.isDirectory()) {
            File[] children = fileOrDirectory.listFiles();
            if (children != null) {
                for (File child : children) {
                    deleteRecursive(child);
                }
            }
        }
        fileOrDirectory.delete();
    }
}
