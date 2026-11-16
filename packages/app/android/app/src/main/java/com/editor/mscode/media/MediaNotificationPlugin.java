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
 *
 * IMPORTANT (Android 12+/15):
 * Each startForegroundService() starts a system timer that requires
 * Service.startForeground() within ~5s. Calling it multiple times in quick
 * succession (e.g. loading→ready→playing state churn) is a common source of
 * ForegroundServiceDidNotStartInTimeException. We therefore:
 *  - use startForegroundService() only for the first show / when service is down
 *  - use plain startService() for subsequent updates
 */
@CapacitorPlugin(name = "MediaNotification")
public class MediaNotificationPlugin extends Plugin {

    private static final String TAG = "MediaNotification";
    private static MediaNotificationPlugin instance;

    /** True after a successful startForegroundService until hide/stop. */
    private static volatile boolean sServiceStarted = false;

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
        try {
            instance.notifyListeners("mediaAction", data);
        } catch (Throwable t) {
            Log.w(TAG, "notifyListeners failed", t);
        }
    }

    /** Called by the service when it successfully enters foreground. */
    static void markServiceStarted() {
        sServiceStarted = true;
    }

    /** Called when service is stopped / destroyed. */
    static void markServiceStopped() {
        sServiceStarted = false;
    }

    @PluginMethod
    public void show(PluginCall call) {
        try {
            Intent i = new Intent(getContext(), MediaPlaybackService.class);
            i.setAction(MediaPlaybackService.ACTION_START);
            fillExtras(i, call);
            // First start (or restart after hide) must use startForegroundService.
            startServiceSafely(i, /* preferForeground */ true);
            call.resolve();
        } catch (Throwable e) {
            // Includes ForegroundServiceStartNotAllowedException (Android 12+)
            // and any other platform-level failure — must never crash the app,
            // just fail this one JS call.
            Log.e(TAG, "show failed", e);
            call.reject("Failed to show media notification: " + e.getMessage());
        }
    }

    @PluginMethod
    public void update(PluginCall call) {
        try {
            Intent i = new Intent(getContext(), MediaPlaybackService.class);
            i.setAction(MediaPlaybackService.ACTION_UPDATE);
            fillExtras(i, call);
            // Prefer plain startService when we believe the FG service is already up.
            // This avoids stacking extra startForegroundService timers that cause
            // ForegroundServiceDidNotStartInTimeException on mid-range devices.
            startServiceSafely(i, /* preferForeground */ false);
            call.resolve();
        } catch (Throwable e) {
            Log.e(TAG, "update failed", e);
            call.reject("Failed to update media notification: " + e.getMessage());
        }
    }

    @PluginMethod
    public void hide(PluginCall call) {
        try {
            Intent i = new Intent(getContext(), MediaPlaybackService.class);
            i.setAction(MediaPlaybackService.ACTION_STOP);
            getContext().startService(i);
            sServiceStarted = false;
            call.resolve();
        } catch (Throwable e) {
            Log.e(TAG, "hide failed", e);
            call.reject("Failed to hide media notification: " + e.getMessage());
        }
    }

    /**
     * @param preferForeground true for show / first start; false for update.
     *                         When false we still fall back to startForegroundService
     *                         if we think the service is not running yet.
     */
    private void startServiceSafely(Intent i, boolean preferForeground) {
        if (android.os.Build.VERSION.SDK_INT >= 26) {
            boolean needFg = preferForeground || !sServiceStarted;
            if (needFg) {
                getContext().startForegroundService(i);
                // Optimistically mark; service will confirm via markServiceStarted().
                sServiceStarted = true;
            } else {
                // Service already in foreground — deliver intent without a new timer.
                getContext().startService(i);
            }
        } else {
            getContext().startService(i);
            sServiceStarted = true;
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
