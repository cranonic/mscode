package com.editor.mscode.terminal;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.content.pm.ServiceInfo;
import android.os.Binder;
import android.os.Build;
import android.os.IBinder;
import android.os.PowerManager;
import android.util.Log;

import androidx.core.app.NotificationCompat;

import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Android Foreground Service that owns all terminal sessions and background processes.
 *
 * Native mode (default): libbusybox.so + optional Termux-style $PREFIX bootstrap.
 * No proot, no Alpine rootfs required.
 * PTY / JNI / notification / WakeLock logic is unchanged.
 */
public class TerminalForegroundService extends Service {

    private static final String TAG         = "TerminalService";
    private static final String CHANNEL_ID  = "mscode_terminal";
    private static final int    NOTIF_ID    = 1001;

    public static final String ACTION_STOP = "com.editor.mscode.terminal.STOP";

    public class LocalBinder extends Binder {
        public TerminalForegroundService getService() {
            return TerminalForegroundService.this;
        }
    }

    private final IBinder binder = new LocalBinder();

    @Override
    public IBinder onBind(Intent intent) { return binder; }

    // ─── Event callback ───────────────────────────────────────────────────────

    public interface EventCallback {
        void onData(String sessionId, String data);
        void onExit(String sessionId, int exitCode);
        void onLog(String message);
    }

    private EventCallback eventCallback;

    public void setEventCallback(EventCallback cb) {
        this.eventCallback = cb;
    }

    private void emit(String sessionId, String data) {
        if (eventCallback != null) eventCallback.onData(sessionId, data);
    }
    private void emitExit(String sessionId, int code) {
        if (eventCallback != null) eventCallback.onExit(sessionId, code);
    }
    private void emitLog(String msg) {
        Log.d(TAG, msg);
        if (eventCallback != null) eventCallback.onLog(msg);
    }

    // ─── Setup ────────────────────────────────────────────────────────────────

    public boolean isRootfsReady() {
        return rootfs.isRootfsReady();
    }

    public boolean isBootstrapReady() {
        return rootfs.isBootstrapReady();
    }

    public String getPrefixPath() {
        return rootfs.getPrefixPath();
    }

    /**
     * Native + Termux bootstrap setup.
     * Ensures busybox, home/tmp, then downloads/extracts $PREFIX (filesDir/usr).
     * Alpine / proot are intentionally skipped.
     */
    public void ensureSetup(String arch) throws Exception {
        synchronized (rootfsLock) {
            rootfs.ensureNativeBinaries();
            rootfs.ensureBootstrap(arch);
        }
        // Shared env for background pkg/git / LSP — always HOME-anchored
        if (scriptWriter != null) {
            try {
                scriptWriter.writeSharedEnv();
            } catch (Exception e) {
                emitLog("mscode_env.sh write: " + e.getMessage());
            }
        }
    }

    /**
     * Install Termux packages into $PREFIX (online).
     * Bootstrap must already be ready.
     *
     * @param packages  e.g. ["git", "curl"]
     * @param arch      device ABI (aarch64 / arm / x86_64)
     * @return summary text
     */
    public String pkgInstall(java.util.List<String> packages, String arch) throws Exception {
        synchronized (rootfsLock) {
            if (!rootfs.isBootstrapReady()) {
                rootfs.ensureBootstrap(arch);
            }
        }
        PkgInstaller installer = new PkgInstaller(rootfs, arch);
        return installer.install(packages, msg -> emitLog("[pkg] " + msg));
    }

    public java.util.List<String> pkgListInstalled() {
        PkgInstaller installer = new PkgInstaller(rootfs, "aarch64");
        return installer.listInstalled();
    }

    // ─── State ────────────────────────────────────────────────────────────────

    private final ConcurrentHashMap<String, TerminalSession> sessions
        = new ConcurrentHashMap<>();

    private final Object rootfsLock = new Object();

    private RootfsManager    rootfs;
    private ProotCommandBuilder builder;
    private InitScriptWriter  scriptWriter;

    private PowerManager.WakeLock wakeLock;
    private boolean wakeLockHeld = false;

    // ─── Lifecycle ────────────────────────────────────────────────────────────

    @Override
    public void onCreate() {
        super.onCreate();
        rootfs        = new RootfsManager(this);
        scriptWriter  = new InitScriptWriter(rootfs);
        createNotificationChannel();
        startAsForeground("Terminal ready");
        emitLog("TerminalForegroundService started (native + Termux bootstrap mode)");
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        if (intent != null && ACTION_STOP.equals(intent.getAction())) {
            stopSelf();
            return START_NOT_STICKY;
        }
        // Re-assert foreground on every start (required after process death / demotion)
        int n = sessions != null ? sessions.size() : 0;
        startAsForeground(n > 0
                ? ("Terminal running — " + n + " session" + (n == 1 ? "" : "s"))
                : "Terminal ready");
        return START_STICKY;
    }

    /** API 29+ must pass foregroundServiceType matching the manifest. */
    private void startAsForeground(String text) {
        Notification n = buildNotification(text);
        if (Build.VERSION.SDK_INT >= 34) {
            startForeground(NOTIF_ID, n, ServiceInfo.FOREGROUND_SERVICE_TYPE_DATA_SYNC);
        } else if (Build.VERSION.SDK_INT >= 29) {
            startForeground(NOTIF_ID, n, ServiceInfo.FOREGROUND_SERVICE_TYPE_DATA_SYNC);
        } else {
            startForeground(NOTIF_ID, n);
        }
    }

    @Override
    public void onDestroy() {
        for (TerminalSession s : sessions.values()) cleanupSession(s);
        sessions.clear();
        releaseWakeLock();
        super.onDestroy();
    }

    // ─── Public API ───────────────────────────────────────────────────────────

    public void initBuilder(String nativeLibDir) {
        this.builder = new ProotCommandBuilder(rootfs, nativeLibDir);
        // Default: native mode (no proot)
        this.builder.setUseNative(true);
    }

    /**
     * Starts a new PTY terminal session (native busybox + Termux $PREFIX).
     *
     * @param sessionId   Unique ID.
     * @param projectPath Android path to open in the terminal.
     * @param type        "local" | "server".
     * @param arch        Device ABI (used for bootstrap if needed).
     * @param rows        Initial terminal rows.
     * @param cols        Initial terminal columns.
     */
    public void startSession(String sessionId, String projectPath,
                             String type, String arch,
                             int rows, int cols) throws Exception {

        if (sessions.containsKey(sessionId))
            throw new IllegalStateException("Session '" + sessionId + "' already exists");

        if (builder == null)
            throw new IllegalStateException("Builder not initialised — call initBuilder() first");

        // Native + bootstrap (no Alpine / proot)
        synchronized (rootfsLock) {
            rootfs.ensureNativeBinaries();
            // Bootstrap is best-effort on session start — full install via initSetup()
            try {
                if (!rootfs.isBootstrapReady()) {
                    rootfs.ensureBootstrap(arch);
                }
            } catch (Exception e) {
                emitLog("Bootstrap not ready yet: " + e.getMessage()
                        + " (shell still works with busybox)");
            }
        }

        // Cwd: use Android path directly (no proot mapping)
        String cwd = (projectPath != null && new File(projectPath).isDirectory())
            ? projectPath
            : rootfs.getHomePath();

        // Write per-session init script
        String initPath = rootfs.getFilesDir() + "/init_" + sessionId + ".sh";
        scriptWriter.write(initPath, cwd);
        // Keep shared mscode_env.sh fresh (wrappers + clangd config) without
        // stamping a project cwd into background/LSP jobs
        try {
            scriptWriter.writeSharedEnv();
        } catch (Exception e) {
            emitLog("mscode_env.sh refresh: " + e.getMessage());
        }

        String[] cmd = builder.buildSessionCommand(initPath);
        // ENV=initPath so interactive sh sources bb()/aliases + PREFIX
        String[] env = builder.buildSessionEnv(initPath);

        emitLog("🚀 Starting [" + sessionId + "] native " + type
                + " PREFIX=" + rootfs.getPrefixPath()
                + " → " + cwd);

        TerminalSession session = new TerminalSession(sessionId);
        session.type = type;
        sessions.put(sessionId, session);

        int[] pids = new int[1];
        // Working directory = home (init script will cd to project)
        session.ptyFd = PtyEngine.createSubprocess(cmd, env,
                                                    rootfs.getHomePath(),
                                                    pids, rows, cols);
        if (session.ptyFd < 0) {
            sessions.remove(sessionId);
            scriptWriter.cleanup(initPath);
            throw new RuntimeException("PTY subprocess creation failed");
        }

        session.childPid = pids[0];
        session.pfd      = android.os.ParcelFileDescriptor.adoptFd(session.ptyFd);
        session.out      = new FileOutputStream(session.pfd.getFileDescriptor());
        session.in       = new FileInputStream(session.pfd.getFileDescriptor());
        session.running  = true;

        emitLog("🟢 [" + sessionId + "] pid=" + session.childPid);
        updateNotification(sessions.size() + " session(s) running");
        acquireWakeLock();

        final String sid = sessionId;
        session.readThread = new Thread(() -> {
            try {
                byte[] buf = new byte[4096]; int n;
                while (session.running && (n = session.in.read(buf)) != -1) {
                    emit(sid, new String(buf, 0, n, "UTF-8"));
                }
            } catch (Exception ignored) {}
            finally {
                session.running = false;
                scriptWriter.cleanup(initPath);
                int exitCode = PtyEngine.waitForChild(session.childPid);
                emitExit(sid, exitCode);
                sessions.remove(sid);
                if (sessions.isEmpty()) {
                    releaseWakeLock();
                    updateNotification("Terminal ready");
                } else {
                    updateNotification(sessions.size() + " session(s) running");
                }
            }
        }, "pty-read-" + sessionId);
        session.readThread.setDaemon(true);
        session.readThread.start();
    }

    public void write(String sessionId, String data) throws IOException {
        TerminalSession s = sessions.get(sessionId);
        if (s == null || !s.running) return;
        s.out.write(data.getBytes("UTF-8"));
        s.out.flush();
    }

    public void execute(String sessionId, String command) throws IOException {
        write(sessionId, command + "\n");
    }

    public void resize(String sessionId, int rows, int cols) {
        TerminalSession s = sessions.get(sessionId);
        if (s != null && s.ptyFd >= 0) PtyEngine.resizePty(s.ptyFd, rows, cols);
    }

    public void sendInterrupt(String sessionId) {
        TerminalSession s = sessions.get(sessionId);
        if (s != null && s.childPid > 0) PtyEngine.sendSignal(-s.childPid, 2);
    }

    public void closeSession(String sessionId) {
        cleanupSession(sessions.remove(sessionId));
        if (sessions.isEmpty()) {
            releaseWakeLock();
            updateNotification("Terminal ready");
        } else {
            updateNotification(sessions.size() + " session(s) running");
        }
    }

    public boolean isRunning(String sessionId) {
        TerminalSession s = sessions.get(sessionId);
        return s != null && s.running;
    }

    public TerminalSession getSession(String sessionId) {
        return sessions.get(sessionId);
    }

    public List<String> getAllSessionIds() {
        return new ArrayList<>(sessions.keySet());
    }

    // ─── Background execute (no PTY) ─────────────────────────────────────────

    /**
     * Runs a command with native busybox ash -c (no PTY).
     */
    public BackgroundResult backgroundExecute(String command) throws Exception {
        if (builder == null)
            throw new IllegalStateException("Builder not initialised");

        // Ensure dirs exist
        synchronized (rootfsLock) {
            rootfs.ensureNativeBinaries();
        }

        String[] cmd = builder.buildBackgroundCommand(command);

        ProcessBuilder pb = new ProcessBuilder(cmd);
        pb.environment().clear();
        pb.environment().putAll(builder.buildBackgroundEnvMap());
        pb.directory(new File(rootfs.getHomePath()));
        pb.redirectErrorStream(true);

        Process proc     = pb.start();
        byte[]  output   = readAll(proc.getInputStream());
        int     exitCode = proc.waitFor();

        return new BackgroundResult(new String(output, "UTF-8"), exitCode);
    }

    public static class BackgroundResult {
        public final String output;
        public final int    exitCode;
        BackgroundResult(String output, int exitCode) {
            this.output   = output;
            this.exitCode = exitCode;
        }
    }

    // ─── Streaming Background Execute ─────────────────────────────────────────

    public interface BackgroundStreamListener {
        void onData(String data);
    }

    private final Map<String, Process> backgroundProcesses = new ConcurrentHashMap<>();

    private final ConcurrentHashMap<Integer, ProcessServer> processServers
        = new ConcurrentHashMap<>();

    public interface BackgroundProcessListener {
        void onData(String data);
        void onExit(int exitCode);
    }

    public void streamBackgroundExecute(
            String sessionId, String[] cmd,
            Map<String, String> env, String cwd,
            BackgroundProcessListener listener
    ) {
        new Thread(() -> {
            try {
                ProcessBuilder pb = new ProcessBuilder(cmd);
                pb.environment().clear();
                if (env != null) pb.environment().putAll(env);

                // ProcessBuilder.directory must be a real filesystem path.
                // content:// (SAF) or missing dirs → fall back to app home/tmp.
                File workDir = null;
                if (cwd != null && !cwd.isEmpty()
                        && !cwd.startsWith("content:")
                        && !cwd.startsWith("content://")) {
                    File cand = new File(cwd);
                    if (cand.isDirectory()) workDir = cand;
                }
                if (workDir == null) {
                    try {
                        File tmp = new File(rootfs.getTmpPath());
                        if (!tmp.exists()) tmp.mkdirs();
                        workDir = tmp.isDirectory() ? tmp : new File(rootfs.getHomePath());
                    } catch (Exception ignored) {
                        workDir = new File(rootfs.getHomePath());
                    }
                }
                pb.directory(workDir);
                pb.redirectErrorStream(true);

                Process process = pb.start();
                backgroundProcesses.put(sessionId, process);

                InputStream in = process.getInputStream();
                byte[] buf = new byte[4096]; int len;
                while ((len = in.read(buf)) != -1) {
                    if (listener != null) listener.onData(new String(buf, 0, len));
                }

                int exitCode = process.waitFor();
                backgroundProcesses.remove(sessionId);
                if (listener != null) listener.onExit(exitCode);

            } catch (Exception e) {
                if (listener != null) {
                    listener.onData("\n[Service Error] " + e.getMessage() + "\n");
                    listener.onExit(-1);
                }
                backgroundProcesses.remove(sessionId);
            }
        }).start();
    }

    public void killBackgroundProcess(String sessionId) {
        Process p = backgroundProcesses.remove(sessionId);
        if (p != null) p.destroy();
    }

    // ─── LSP / ProcessServer ─────────────────────────────────────────────────

    /**
     * Starts a WebSocket↔stdio bridge.
     * Command runs under native busybox ash -c.
     */
    public int spawnProcessServer(String shellCommand) throws Exception {
        if (builder == null)
            throw new IllegalStateException("Builder not initialised");

        synchronized (rootfsLock) {
            rootfs.ensureNativeBinaries();
        }

        // Rewrite common langserver CLIs so they run via node + linker.
        // PREFIX/bin/* is not directly executable (targetSdk>28); hyphenated
        // names cannot be shell functions either.
        String rewritten = rewriteLspCommand(shellCommand);
        emitLog("🔌 LSP cmd: " + rewritten);

        String[] cmd = builder.buildBackgroundCommand(rewritten);
        java.util.Map<String, String> envMap = builder.buildBackgroundEnvMap();

        int port = ProcessServer.findFreePort();
        ProcessServer server = new ProcessServer(port, cmd, envMap);
        server.startAndAwait();
        processServers.put(port, server);
        emitLog("🔌 ProcessServer listening on port " + port);
        return port;
    }

    /**
     * Map "pyright-langserver --stdio" → run the JS entry via node (elf/linker).
     * Falls back to the original command when no rewrite applies.
     */
    private String rewriteLspCommand(String shellCommand) {
        if (shellCommand == null) return "";
        String s = shellCommand.trim();
        String prefix = rootfs.getPrefixPath();

        // pyright (npm global under $PREFIX)
        if (s.startsWith("pyright-langserver") || s.contains("pyright-langserver")) {
            String js = prefix + "/lib/node_modules/pyright/dist/pyright-langserver.js";
            String node = prefix + "/bin/node";
            // node is wrapped by mscode_env.sh as a function using linker
            return "if [ -f \"" + js + "\" ]; then "
                 + "node \"" + js + "\" --stdio; "
                 + "else "
                 + "node \"$(npm root -g 2>/dev/null)/pyright/dist/pyright-langserver.js\" --stdio; "
                 + "fi";
        }

        // typescript-language-server
        if (s.startsWith("typescript-language-server") || s.contains("typescript-language-server")) {
            String js = prefix + "/lib/node_modules/typescript-language-server/lib/cli.mjs";
            return "if [ -f \"" + js + "\" ]; then "
                 + "node \"" + js + "\" --stdio; "
                 + "else "
                 + "node \"$(npm root -g 2>/dev/null)/typescript-language-server/lib/cli.mjs\" --stdio; "
                 + "fi";
        }

        // clangd — real ELF under $PREFIX/bin; must run via linker (targetSdk>28)
        if (s.startsWith("clangd") || s.matches("(?s).*\\bclangd\\b.*")) {
            String clangd = prefix + "/bin/clangd";
            // Keep user flags after the binary name
            String flags = s.replaceFirst("^clangd\\s*", "").trim();
            return "if [ -n \"$MSCODE_LINKER\" ] && [ -f \"" + clangd + "\" ]; then "
                 + "\"$MSCODE_LINKER\" \"" + clangd + "\" " + flags + "; "
                 + "else "
                 + "clangd " + flags + "; "
                 + "fi";
        }

        return s;
    }

    public boolean stopProcessServer(int port) {
        ProcessServer server = processServers.remove(port);
        if (server == null) {
            emitLog("stopProcessServer: no server on port " + port);
            return false;
        }
        server.forceStop();
        emitLog("🛑 ProcessServer stopped on port " + port);
        return true;
    }

    public void stopAllProcessServers() {
        for (Integer port : processServers.keySet().toArray(new Integer[0])) {
            stopProcessServer(port);
        }
    }

    // ─── Hostname ─────────────────────────────────────────────────────────────

    public void setHostname(String name) throws IOException {
        rootfs.saveHostname(name);
    }

    // ─── WakeLock ─────────────────────────────────────────────────────────────

    public void acquireWakeLock() {
        if (wakeLockHeld) return;
        if (wakeLock == null) {
            PowerManager pm = (PowerManager) getSystemService(Context.POWER_SERVICE);
            wakeLock = pm.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "MsCode:Terminal");
            wakeLock.setReferenceCounted(false);
        }
        wakeLock.acquire();
        wakeLockHeld = true;
        emitLog("⚡ WakeLock acquired");
    }

    public void releaseWakeLock() {
        if (wakeLockHeld && wakeLock != null) {
            wakeLock.release();
            wakeLockHeld = false;
            emitLog("💤 WakeLock released");
        }
    }

    public boolean isWakeLockHeld() { return wakeLockHeld; }

    // ─── Notification ─────────────────────────────────────────────────────────

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            // DEFAULT (not LOW) so the ongoing notification stays visible in the shade
            NotificationChannel ch = new NotificationChannel(
                CHANNEL_ID, "MS Code Terminal",
                NotificationManager.IMPORTANCE_DEFAULT);
            ch.setDescription("Keeps terminal & LSP sessions alive in the background");
            ch.setShowBadge(false);
            getSystemService(NotificationManager.class).createNotificationChannel(ch);
        }
    }

    private void updateNotification(String text) {
        // Prefer re-asserting FGS so Android doesn't demote the service
        try {
            startAsForeground(text);
        } catch (Exception e) {
            Notification n = buildNotification(text);
            NotificationManager nm = getSystemService(NotificationManager.class);
            if (nm != null) nm.notify(NOTIF_ID, n);
        }
    }

    private Notification buildNotification(String text) {
        Intent stopIntent = new Intent(this, TerminalForegroundService.class);
        stopIntent.setAction(ACTION_STOP);
        PendingIntent stopPi = PendingIntent.getService(this, 0, stopIntent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);

        Intent openIntent = getPackageManager().getLaunchIntentForPackage(getPackageName());
        PendingIntent contentPi = openIntent != null
            ? PendingIntent.getActivity(this, 0, openIntent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE)
            : null;

        NotificationCompat.Builder b = new NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("MS Code Terminal")
            .setContentText(text)
            .setSmallIcon(android.R.drawable.ic_menu_manage)
            .setOngoing(true)
            .setOnlyAlertOnce(true)
            .setCategory(NotificationCompat.CATEGORY_SERVICE)
            .setPriority(NotificationCompat.PRIORITY_DEFAULT)
            .setForegroundServiceBehavior(NotificationCompat.FOREGROUND_SERVICE_IMMEDIATE)
            .addAction(android.R.drawable.ic_menu_close_clear_cancel, "Stop", stopPi);

        if (contentPi != null) b.setContentIntent(contentPi);
        return b.build();
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────

    private void cleanupSession(TerminalSession s) {
        if (s == null) return;
        s.running = false;
        if (s.childPid > 0) PtyEngine.sendSignal(s.childPid, 9);
        try { if (s.out != null) s.out.close(); } catch (Exception ignored) {}
        try { if (s.in  != null) s.in.close();  } catch (Exception ignored) {}
        try { if (s.pfd != null) s.pfd.close(); } catch (Exception ignored) {}
        if (s.readThread != null) s.readThread.interrupt();
    }

    private static byte[] readAll(InputStream in) throws IOException {
        ByteArrayOutputStream bos = new ByteArrayOutputStream();
        byte[] buf = new byte[4096]; int n;
        while ((n = in.read(buf)) != -1) bos.write(buf, 0, n);
        return bos.toByteArray();
    }
}
