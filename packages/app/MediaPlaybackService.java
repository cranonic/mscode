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
        if (intent == null) {
            return START_STICKY;
        }
        String action = intent.getAction();
        if (action == null) action = ACTION_START;

        switch (action) {
            case ACTION_START:
            case ACTION_UPDATE:
                title = intent.getStringExtra(EXTRA_TITLE);
                if (title == null || title.isEmpty()) title = "MSCode Media";
                artist = intent.getStringExtra(EXTRA_ARTIST);
                if (artist == null) artist = "";
                playing = intent.getBooleanExtra(EXTRA_PLAYING, true);
                String b64 = intent.getStringExtra(EXTRA_ART_B64);
                if (b64 != null && !b64.isEmpty()) {
                    try {
                        byte[] raw = Base64.decode(b64, Base64.DEFAULT);
                        if (artBitmap != null) artBitmap.recycle();
                        artBitmap = BitmapFactory.decodeByteArray(raw, 0, raw.length);
                    } catch (Exception e) {
                        Log.w(TAG, "art decode failed", e);
                    }
                }
                startAsForeground();
                break;

            case ACTION_STOP:
            case ACTION_DISMISS:
                stopForeground(true);
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

    private void startAsForeground() {
        Notification n = buildNotification();
        try {
            if (Build.VERSION.SDK_INT >= 29) {
                startForeground(NOTIF_ID, n, ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PLAYBACK);
            } else {
                startForeground(NOTIF_ID, n);
            }
        } catch (Exception e) {
            Log.e(TAG, "startForeground failed", e);
            try {
                startForeground(NOTIF_ID, n);
            } catch (Exception ignored) {
            }
        }
    }

    private Notification buildNotification() {
        Intent openApp = getPackageManager().getLaunchIntentForPackage(getPackageName());
        PendingIntent contentPi = PendingIntent.getActivity(
            this, 0, openApp != null ? openApp : new Intent(),
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

        if (artBitmap != null) {
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
        NotificationManager nm = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
        if (nm == null) return;
        NotificationChannel ch = new NotificationChannel(
            CHANNEL_ID, "Media playback", NotificationManager.IMPORTANCE_LOW);
        ch.setDescription("Now playing controls");
        ch.setShowBadge(false);
        nm.createNotificationChannel(ch);
    }

    @Override
    public void onDestroy() {
        if (artBitmap != null) {
            artBitmap.recycle();
            artBitmap = null;
        }
        super.onDestroy();
    }
}
