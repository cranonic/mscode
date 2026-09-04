package com.editor.mscode.media;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.content.pm.ServiceInfo;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.os.Build;
import android.os.IBinder;
import android.util.Base64;
import android.util.Log;

import androidx.core.app.NotificationCompat;
import androidx.media.app.NotificationCompat.MediaStyle;

/**
 * Foreground service that keeps the process alive while media is playing and
 * shows a sticky MediaStyle system notification with transport controls.
 *
 * Actual audio still plays in the WebView / HTML5 element; this service only
 * owns the notification + process priority.
 *
 * Actions: PLAY, PAUSE, NEXT, PREV, STOP — delivered as broadcasts that the
 * Capacitor plugin relays into JS.
 *
 * IMPORTANT: nothing in here is allowed to throw past onStartCommand — this
 * service runs in the app's main process, so an uncaught exception here
 * kills the whole app, not just the notification. Every risky step
 * (bitmap decode, notification build, startForeground) is defensively
 * wrapped.
 */
public class MediaPlaybackService extends Service {

    private static final String TAG = "MsMediaPlayback";
    public static final String CHANNEL_ID = "mscode_media";
    public static final int NOTIF_ID = 2001;

    public static final String ACTION_START = "com.editor.mscode.media.START";
    public static final String ACTION_UPDATE = "com.editor.mscode.media.UPDATE";
    public static final String ACTION_STOP = "com.editor.mscode.media.STOP";
    public static final String ACTION_PLAY = "com.editor.mscode.media.PLAY";
    public static final String ACTION_PAUSE = "com.editor.mscode.media.PAUSE";
    public static final String ACTION_NEXT = "com.editor.mscode.media.NEXT";
    public static final String ACTION_PREV = "com.editor.mscode.media.PREV";
    public static final String ACTION_DISMISS = "com.editor.mscode.media.DISMISS";

    public static final String EXTRA_TITLE = "title";
    public static final String EXTRA_ARTIST = "artist";
    public static final String EXTRA_PLAYING = "playing";
    public static final String EXTRA_ART_B64 = "artB64";

    // Cap decoded art at this size — avoids OOM on large embedded cover art.
    private static final int MAX_ART_DIMENSION_PX = 512;

    private String title = "MSCode Media";
    private String artist = "";
    private boolean playing = false;
    private Bitmap artBitmap = null;

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    @Override
    public void onCreate() {
        super.onCreate();
        ensureChannel();
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        try {
            return handleStartCommand(intent);
        } catch (Throwable t) {
            // Absolute last resort: never let this escape and take the app
            // process down. Log it, stop the service cleanly instead.
            Log.e(TAG, "onStartCommand failed, stopping service safely", t);
            try {
                stopForeground(true);
            } catch (Throwable ignored) {
                /* ignore */
            }
            stopSelf();
            return START_NOT_STICKY;
        }
    }

    private int handleStartCommand(Intent intent) {
        if (intent == null) {
            return START_STICKY;
        }
        String action = intent.getAction();
        if (action == null) action = ACTION_START;

        switch (action) {
            case ACTION_START:
            case ACTION_UPDATE: {
                title = intent.getStringExtra(EXTRA_TITLE);
                if (title == null || title.isEmpty()) title = "MSCode Media";
                artist = intent.getStringExtra(EXTRA_ARTIST);
                if (artist == null) artist = "";
                playing = intent.getBooleanExtra(EXTRA_PLAYING, true);

                // Post the notification FIRST with whatever art we already
                // have (or none). This must happen within a few seconds of
                // startForegroundService() on Android 12+/15 or the system
                // kills the app with ForegroundServiceDidNotStartInTimeException
                // — decoding a big embedded cover image before this call is
                // exactly the kind of delay that can trigger that.
                startAsForeground();

                // Now decode/refresh art (if any) and update the notification
                // again. Any failure here (including OutOfMemoryError) is
                // caught and simply skipped — it must never crash playback.
                String b64 = intent.getStringExtra(EXTRA_ART_B64);
                if (b64 != null && !b64.isEmpty()) {
                    Bitmap decoded = safeDecodeArt(b64);
                    if (decoded != null) {
                        Bitmap old = artBitmap;
                        artBitmap = decoded;
                        if (old != null && old != decoded) {
                            try {
                                old.recycle();
                            } catch (Throwable ignored) {
                                /* ignore */
                            }
                        }
                        startAsForeground();
                    }
                }
                break;
            }

            case ACTION_STOP:
            case ACTION_DISMISS:
                try {
                    stopForeground(true);
                } catch (Throwable ignored) {
                    /* ignore */
                }
                MediaNotificationPlugin.markServiceStopped();
                stopSelf();
                break;

            case ACTION_PLAY:
            case ACTION_PAUSE:
            case ACTION_NEXT:
            case ACTION_PREV:
                // Relay to JS via static callback / broadcast
                MediaNotificationPlugin.emitAction(action);
                // Optimistic UI flip for play/pause
                if (ACTION_PLAY.equals(action)) playing = true;
                if (ACTION_PAUSE.equals(action)) playing = false;
                if (ACTION_PLAY.equals(action) || ACTION_PAUSE.equals(action)) {
                    startAsForeground();
                }
                break;

            default:
                startAsForeground();
                break;
        }
        return START_STICKY;
    }

    /** Decode base64 art safely: downsampled, and never throws (incl. OOM). */
    private Bitmap safeDecodeArt(String b64) {
        try {
            byte[] raw = Base64.decode(b64, Base64.DEFAULT);
            if (raw.length == 0) return null;

            // First pass: read bounds only, no memory allocated for pixels.
            BitmapFactory.Options bounds = new BitmapFactory.Options();
            bounds.inJustDecodeBounds = true;
            BitmapFactory.decodeByteArray(raw, 0, raw.length, bounds);
            if (bounds.outWidth <= 0 || bounds.outHeight <= 0) return null;

            int sample = 1;
            int longest = Math.max(bounds.outWidth, bounds.outHeight);
            while (longest / sample > MAX_ART_DIMENSION_PX) {
                sample *= 2;
            }

            BitmapFactory.Options opts = new BitmapFactory.Options();
            opts.inSampleSize = sample;
            opts.inPreferredConfig = Bitmap.Config.RGB_565; // half the memory of ARGB_8888
            return BitmapFactory.decodeByteArray(raw, 0, raw.length, opts);
        } catch (Throwable t) {
            // Includes OutOfMemoryError — must not propagate.
            Log.w(TAG, "art decode failed, continuing without art", t);
            return null;
        }
    }

    private void startAsForeground() {
        try {
            Notification n = buildNotification();
            if (Build.VERSION.SDK_INT >= 29) {
                startForeground(NOTIF_ID, n, ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PLAYBACK);
            } else {
                startForeground(NOTIF_ID, n);
            }
            // Tell the plugin the FG contract is satisfied so later updates
            // can use plain startService() instead of startForegroundService().
            MediaNotificationPlugin.markServiceStarted();
        } catch (Throwable e) {
            Log.e(TAG, "startForeground failed", e);
            // Best-effort fallback with a minimal, guaranteed-safe notification.
            try {
                Notification minimal = new NotificationCompat.Builder(this, CHANNEL_ID)
                    .setSmallIcon(android.R.drawable.ic_media_play)
                    .setContentTitle(title)
                    .setOngoing(playing)
                    .build();
                if (Build.VERSION.SDK_INT >= 29) {
                    startForeground(NOTIF_ID, minimal, ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PLAYBACK);
                } else {
                    startForeground(NOTIF_ID, minimal);
                }
                MediaNotificationPlugin.markServiceStarted();
            } catch (Throwable e2) {
                Log.e(TAG, "minimal startForeground also failed, stopping service", e2);
                MediaNotificationPlugin.markServiceStopped();
                try {
                    stopSelf();
                } catch (Throwable ignored) {
                    /* ignore */
                }
            }
        }
    }

    private Notification buildNotification() {
        Intent openApp = getPackageManager().getLaunchIntentForPackage(getPackageName());
        PendingIntent contentPi = PendingIntent.getActivity(
            this, 0, openApp != null ? openApp : new Intent(Intent.ACTION_MAIN),
            PendingIntent.FLAG_UPDATE_CURRENT | pendingImmutable()
        );

        NotificationCompat.Builder b = new NotificationCompat.Builder(this, CHANNEL_ID)
            .setSmallIcon(android.R.drawable.ic_media_play)
            .setContentTitle(title)
            .setContentText(artist.isEmpty() ? (playing ? "Playing" : "Paused") : artist)
            .setContentIntent(contentPi)
            .setOnlyAlertOnce(true)
            .setOngoing(playing) // sticky while playing — swipe-dismiss harder
            .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
            .setCategory(NotificationCompat.CATEGORY_TRANSPORT)
            .setPriority(NotificationCompat.PRIORITY_LOW);

        if (artBitmap != null && !artBitmap.isRecycled()) {
            b.setLargeIcon(artBitmap);
        }

        b.addAction(android.R.drawable.ic_media_previous, "Prev",
            actionPi(ACTION_PREV, 11));
        if (playing) {
            b.addAction(android.R.drawable.ic_media_pause, "Pause",
                actionPi(ACTION_PAUSE, 12));
        } else {
            b.addAction(android.R.drawable.ic_media_play, "Play",
                actionPi(ACTION_PLAY, 13));
        }
        b.addAction(android.R.drawable.ic_media_next, "Next",
            actionPi(ACTION_NEXT, 14));

        b.setStyle(new MediaStyle()
            .setShowActionsInCompactView(0, 1, 2));

        // If user clears while playing, service restarts sticky + plugin re-shows
        Intent del = new Intent(this, MediaPlaybackService.class).setAction(ACTION_DISMISS);
        b.setDeleteIntent(PendingIntent.getService(
            this, 20, del, PendingIntent.FLAG_UPDATE_CURRENT | pendingImmutable()));

        return b.build();
    }

    private PendingIntent actionPi(String action, int req) {
        Intent i = new Intent(this, MediaPlaybackService.class).setAction(action);
        return PendingIntent.getService(
            this, req, i, PendingIntent.FLAG_UPDATE_CURRENT | pendingImmutable());
    }

    private static int pendingImmutable() {
        return Build.VERSION.SDK_INT >= 23 ? PendingIntent.FLAG_IMMUTABLE : 0;
    }

    private void ensureChannel() {
        if (Build.VERSION.SDK_INT < 26) return;
        try {
            NotificationManager nm = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
            if (nm == null) return;
            NotificationChannel ch = new NotificationChannel(
                CHANNEL_ID, "Media playback", NotificationManager.IMPORTANCE_LOW);
            ch.setDescription("Now playing controls");
            ch.setShowBadge(false);
            nm.createNotificationChannel(ch);
        } catch (Throwable t) {
            Log.e(TAG, "ensureChannel failed", t);
        }
    }

    @Override
    public void onDestroy() {
        MediaNotificationPlugin.markServiceStopped();
        if (artBitmap != null) {
            try {
                artBitmap.recycle();
            } catch (Throwable ignored) {
                /* ignore */
            }
            artBitmap = null;
        }
        super.onDestroy();
    }
}