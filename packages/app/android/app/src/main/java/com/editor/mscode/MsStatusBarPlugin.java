package com.editor.mscode;

import android.app.Activity;
import android.graphics.Color;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/**
 * Allows the WebView / theme layer to push status-bar colors at runtime.
 * Registered from MainActivity; mirrors @capacitor/status-bar style API.
 */
@CapacitorPlugin(name = "MsStatusBar")
public class MsStatusBarPlugin extends Plugin {

    @PluginMethod
    public void setStatusBar(PluginCall call) {
        String color = call.getString("color", "#1E1E1E");
        boolean lightIcons = call.getBoolean("lightIcons", false);
        Activity act = getActivity();
        if (act instanceof MainActivity) {
            ((MainActivity) act).setStatusBarFromHex(color, lightIcons);
            call.resolve();
        } else {
            call.reject("MainActivity not available");
        }
    }

    @PluginMethod
    public void setBackgroundColor(PluginCall call) {
        String color = call.getString("color", "#1E1E1E");
        Activity act = getActivity();
        if (act instanceof MainActivity) {
            ((MainActivity) act).setStatusBarFromHex(color, false);
            call.resolve();
        } else {
            call.reject("MainActivity not available");
        }
    }

    @PluginMethod
    public void setStyle(PluginCall call) {
        // DARK style → white icons on dark bar → lightIcons=false
        String style = call.getString("style", "DARK");
        boolean lightIcons = "LIGHT".equalsIgnoreCase(style);
        Activity act = getActivity();
        if (act instanceof MainActivity) {
            ((MainActivity) act).setStatusBarFromHex("#1E1E1E", lightIcons);
            call.resolve();
        } else {
            call.reject("MainActivity not available");
        }
    }
}