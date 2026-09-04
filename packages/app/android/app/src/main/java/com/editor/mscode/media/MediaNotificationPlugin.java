package com.editor.mscode.media;

import android.content.Intent;
import android.util.Log;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/**
 * Capacitor bridge for {@link MediaPlaybackService}.
 *
 * JS:
 *   MediaNotification.show({ title, artist, playing, artBase64? })
 *   MediaNotification.update({ ... })
 *   MediaNotification.hide()
 *   addListener('mediaAction', ({ action }) => ...)  // play|pause|next|prev|dismiss
 */
@CapacitorPlugin(name = "MediaNotification")
public class MediaNotificationPlugin extends Plugin {

    private static final String TAG = "MediaNotification";
    private static MediaNotificationPlugin instance;

    @Override
    public void load() {
        instance = this;
    }

    static void emitAction(String action) {
        if (instance == null) {
            Log.w(TAG, "emitAction with no plugin instance: " + action);
            return;
        }
        String shortName = action;
        if (action != null && action.contains(".")) {
            shortName = action.substring(action.lastIndexOf('.') + 1).toLowerCase();
        }
        JSObject data = new JSObject();
        data.put("action", shortName);
        instance.notifyListeners("mediaAction", data);
    }

    @PluginMethod
    public void show(PluginCall call) {
        try {
            Intent i = new Intent(getContext(), MediaPlaybackService.class);
            i.setAction(MediaPlaybackService.ACTION_START);
            fillExtras(i, call);
            if (android.os.Build.VERSION.SDK_INT >= 26) {
                getContext().startForegroundService(i);
            } else {
                getContext().startService(i);
            }
            call.resolve();
        } catch (Exception e) {
            Log.e(TAG, "show failed", e);
            call.reject("Failed to show media notification: " + e.getMessage(), e);
        }
    }

    @PluginMethod
    public void update(PluginCall call) {
        try {
            Intent i = new Intent(getContext(), MediaPlaybackService.class);
            i.setAction(MediaPlaybackService.ACTION_UPDATE);
            fillExtras(i, call);
            if (android.os.Build.VERSION.SDK_INT >= 26) {
                getContext().startForegroundService(i);
            } else {
                getContext().startService(i);
            }
            call.resolve();
        } catch (Exception e) {
            call.reject("Failed to update media notification: " + e.getMessage(), e);
        }
    }

    @PluginMethod
    public void hide(PluginCall call) {
        try {
            Intent i = new Intent(getContext(), MediaPlaybackService.class);
            i.setAction(MediaPlaybackService.ACTION_STOP);
            getContext().startService(i);
            call.resolve();
        } catch (Exception e) {
            call.reject("Failed to hide media notification: " + e.getMessage(), e);
        }
    }

    private void fillExtras(Intent i, PluginCall call) {
        String title = call.getString("title", "MSCode Media");
        String artist = call.getString("artist", "");
        boolean playing = call.getBoolean("playing", true);
        String art = call.getString("artBase64", null);
        i.putExtra(MediaPlaybackService.EXTRA_TITLE, title);
        i.putExtra(MediaPlaybackService.EXTRA_ARTIST, artist);
        i.putExtra(MediaPlaybackService.EXTRA_PLAYING, playing);
        if (art != null) i.putExtra(MediaPlaybackService.EXTRA_ART_B64, art);
    }
}
