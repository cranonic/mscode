package com.editor.mscode;

import android.app.Application;
import android.os.Environment;
import android.util.Log;

import java.io.File;
import java.io.FileWriter;
import java.io.PrintWriter;
import java.io.StringWriter;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;

/**
 * Installs a global uncaught-exception handler so crashes can be inspected
 * without Android Studio / logcat. Every crash on ANY thread (including the
 * MediaPlaybackService, which runs in the same process) is written to a
 * plain text file that can be opened from any file manager.
 *
 * Log location:
 *   /storage/emulated/0/mscode_crash_logs/crash_<timestamp>.txt
 * (falls back to the app-specific external files dir if shared storage
 * isn't writable yet, e.g. All-Files-Access not granted).
 */
public class MsCodeApplication extends Application {

    private static final String TAG = "MsCodeCrash";

    @Override
    public void onCreate() {
        super.onCreate();
        installCrashHandler();
    }

    private void installCrashHandler() {
        final Thread.UncaughtExceptionHandler previous =
            Thread.getDefaultUncaughtExceptionHandler();

        Thread.setDefaultUncaughtExceptionHandler((thread, throwable) -> {
            try {
                writeCrashLog(thread, throwable);
            } catch (Throwable loggingFailure) {
                Log.e(TAG, "Failed to write crash log", loggingFailure);
            }
            // Let the system handle it afterwards as usual (shows "app
            // stopped", may restart the process) — we only intercept long
            // enough to persist the log first.
            if (previous != null) {
                previous.uncaughtException(thread, throwable);
            } else {
                System.exit(2);
            }
        });
    }

    private void writeCrashLog(Thread thread, Throwable throwable) {
        String stamp = new SimpleDateFormat("yyyy-MM-dd_HH-mm-ss", Locale.US)
            .format(new Date());

        StringWriter sw = new StringWriter();
        sw.append("MSCode crash report\n");
        sw.append("Time: ").append(stamp).append('\n');
        sw.append("Thread: ").append(thread.getName()).append('\n');
        sw.append("Android: ").append(android.os.Build.VERSION.RELEASE)
            .append(" (SDK ").append(String.valueOf(android.os.Build.VERSION.SDK_INT)).append(")\n");
        sw.append("Device: ").append(android.os.Build.MANUFACTURER)
            .append(' ').append(android.os.Build.MODEL).append("\n\n");
        throwable.printStackTrace(new PrintWriter(sw));

        File dir = crashLogDir();
        if (dir == null) {
            Log.e(TAG, sw.toString());
            return;
        }
        File out = new File(dir, "crash_" + stamp + ".txt");
        try (FileWriter fw = new FileWriter(out)) {
            fw.write(sw.toString());
        } catch (Exception e) {
            Log.e(TAG, "Could not write " + out, e);
            Log.e(TAG, sw.toString());
        }
    }

    private File crashLogDir() {
        // Prefer shared storage (visible in any file manager) since the app
        // already requests MANAGE_EXTERNAL_STORAGE; fall back to the
        // app-specific external dir if that isn't granted yet.
        try {
            if (Environment.isExternalStorageManager()) {
                File dir = new File(Environment.getExternalStorageDirectory(), "mscode_crash_logs");
                if (dir.exists() || dir.mkdirs()) return dir;
            }
        } catch (Exception ignored) {
            /* fall through to app-specific dir */
        }
        File fallback = getExternalFilesDir("crash_logs");
        if (fallback != null && (fallback.exists() || fallback.mkdirs())) return fallback;
        return null;
    }
}