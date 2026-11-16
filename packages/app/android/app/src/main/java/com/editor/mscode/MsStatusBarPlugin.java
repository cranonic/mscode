package com.editor.mscode;

import android.app.Activity;
import android.util.Log;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/**
 * WebView / theme layer → system status bar.
 * Registered from MainActivity.
 */
@CapacitorPlugin(name = "MsStatusBar")
public class MsStatusBarPlugin extends Plugin {
    private static final String TAG = "MsStatusBar";

    @PluginMethod
    public void setStatusBar(PluginCall call) {
        String color = call.getString("color", "#1E1E1E");
        // Capacitor may deliver boolean as Boolean object
        Boolean lightObj = call.getBoolean("lightIcons", false);
        boolean lightIcons = lightObj != null && lightObj;

        Log.i(TAG, "setStatusBar color=" + color + " lightIcons=" + lightIcons);

        Activity act = getActivity();
        if (act == null && getBridge() != null) {
            act = getBridge().getActivity();
        }

        if (act instanceof MainActivity) {
            final MainActivity main = (MainActivity) act;
            final String c = color;
            final boolean li = lightIcons;
            main.runOnUiThread(() -> main.setStatusBarFromHex(c, li));
            call.resolve();
        } else {
            Log.e(TAG, "MainActivity not available, act=" + act);
            call.reject("MainActivity not available");
        }
    }

    @PluginMethod
    public void setBackgroundColor(PluginCall call) {
        String color = call.getString("color", "#1E1E1E");
        Activity act = getActivity();
        if (act == null && getBridge() != null) act = getBridge().getActivity();
        if (act instanceof MainActivity) {
            ((MainActivity) act).setStatusBarFromHex(color, false);
            call.resolve();
        } else {
            call.reject("MainActivity not available");
        }
    }

    @PluginMethod
    public void setStyle(PluginCall call) {
        String style = call.getString("style", "DARK");
        boolean lightIcons = "LIGHT".equalsIgnoreCase(style);
        Activity act = getActivity();
        if (act == null && getBridge() != null) act = getBridge().getActivity();
        if (act instanceof MainActivity) {
            MainActivity main = (MainActivity) act;
            // Keep last bg; only flip icon style — re-read via last color path
            main.runOnUiThread(() -> main.applyStatusBarColor(
                // use current window color if possible
                main.getWindow() != null ? main.getWindow().getStatusBarColor() : 0xFF1E1E1E,
                lightIcons
            ));
            call.resolve();
        } else {
            call.reject("MainActivity not available");
        }
    }
}
