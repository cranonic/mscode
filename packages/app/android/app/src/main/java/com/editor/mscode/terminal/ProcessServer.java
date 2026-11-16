package com.editor.mscode.terminal;

import org.java_websocket.WebSocket;
import org.java_websocket.handshake.ClientHandshake;
import org.java_websocket.server.WebSocketServer;

import java.io.InputStream;
import java.io.OutputStream;
import java.net.InetSocketAddress;
import java.net.ServerSocket;
import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import java.util.Map;
import java.util.concurrent.ConcurrentLinkedQueue;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicReference;
import java.util.function.Consumer;

/**
 * Java-side WebSocket server that bridges a process's stdio to WebSocket clients.
 *
 * Lifecycle:
 *  • One ProcessServer per LSP session.
 *  • Language-server process is spawned on first client open.
 *  • Client disconnect → process destroyed + server stopped.
 *  • forceStop() can also tear everything down explicitly (language switch / kill).
 *
 * Debug: logCallback receives stderr, exit codes, and spawn info so the JS
 * Output panel can show them without logcat (GitHub-workflow builds).
 */
public class ProcessServer extends WebSocketServer {

    private final String[] cmd;
    private final Map<String, String> env;
    private final CountDownLatch readyLatch = new CountDownLatch(1);
    private final AtomicReference<Exception> startError = new AtomicReference<>();
    private final AtomicBoolean forceStopped = new AtomicBoolean(false);
    /** Optional bridge to TerminalForegroundService.emitLog → Capacitor onLog. */
    private final Consumer<String> logCallback;

    /** All OS processes spawned by this server (normally one). */
    private final ConcurrentLinkedQueue<Process> liveProcesses = new ConcurrentLinkedQueue<>();

    private static final class ConnState {
        final Process     process;
        final OutputStream stdin;

        ConnState(Process process, OutputStream stdin) {
            this.process = process;
            this.stdin   = stdin;
        }
    }

    public ProcessServer(int port, String[] cmd, Map<String, String> env) {
        this(port, cmd, env, null);
    }

    public ProcessServer(int port, String[] cmd, Map<String, String> env, Consumer<String> logCallback) {
        super(new InetSocketAddress("127.0.0.1", port));
        this.cmd = cmd;
        this.env = env;
        this.logCallback = logCallback;
    }

    private void log(String msg) {
        android.util.Log.w("ProcessServer", msg);
        if (logCallback != null) {
            try {
                logCallback.accept(msg);
            } catch (Exception ignored) {}
        }
    }

    public static int findFreePort() throws Exception {
        try (ServerSocket s = new ServerSocket(0)) {
            return s.getLocalPort();
        }
    }

    /**
     * Starts the WebSocket server and BLOCKS until it is listening.
     */
    public void startAndAwait() throws Exception {
        start();
        readyLatch.await();
        Exception err = startError.get();
        if (err != null) throw err;
    }

    /**
     * Explicit teardown used on language switch / killLsp.
     */
    public void forceStop() {
        if (!forceStopped.compareAndSet(false, true)) return;

        Process p;
        while ((p = liveProcesses.poll()) != null) {
            destroyProcess(p);
        }

        try {
            for (WebSocket c : getConnections()) {
                try { c.close(1001, "forceStop"); } catch (Exception ignored) {}
            }
        } catch (Exception ignored) {}

        new Thread(() -> {
            try { stop(); } catch (Exception ignored) {}
        }, "lsp-force-stop").start();
    }

    private static void destroyProcess(Process process) {
        if (process == null) return;
        try {
            process.destroy();
            if (process.isAlive()) {
                try { Thread.sleep(150); } catch (InterruptedException ignored) {}
                if (process.isAlive()) process.destroyForcibly();
            }
        } catch (Exception ignored) {}
    }

    @Override
    public void onStart() {
        readyLatch.countDown();
    }

    @Override
    public void onError(WebSocket conn, Exception ex) {
        if (conn == null) {
            startError.set(ex);
            readyLatch.countDown();
        }
        log("[LSP] WebSocket onError: " + (ex != null ? ex.getMessage() : "null"));
    }

    @Override
    public void onOpen(WebSocket conn, ClientHandshake handshake) {
        if (forceStopped.get()) {
            conn.close(1001, "server stopping");
            return;
        }
        try {
            log("[LSP] client connected — spawning process…");
            log("[LSP] cmd: " + Arrays.toString(cmd));

            ProcessBuilder pb = new ProcessBuilder(cmd);
            pb.environment().clear();
            if (env != null) {
                pb.environment().putAll(env);
            }

            // CRITICAL: do NOT merge stderr into stdout.
            // LSP uses Content-Length framing on stdout; any log on the same
            // stream corrupts the protocol and causes "initialize timeout".
            Process process = pb.redirectErrorStream(false).start();
            liveProcesses.add(process);

            log("[LSP] process started (alive=" + process.isAlive() + ")");

            InputStream stdout = process.getInputStream();
            InputStream stderr = process.getErrorStream();
            OutputStream stdin = process.getOutputStream();

            conn.setAttachment(new ConnState(process, stdin));

            // Drain stderr → log bridge (Output panel / onLog) — never WebSocket
            new Thread(() -> {
                try {
                    byte[] buf = new byte[4096];
                    int len;
                    while ((len = stderr.read(buf)) != -1) {
                        if (forceStopped.get()) break;
                        String chunk = new String(buf, 0, len, StandardCharsets.UTF_8);
                        // Split lines so Output panel stays readable
                        for (String line : chunk.split("\n", -1)) {
                            if (!line.isEmpty()) {
                                log("[LSP-stderr] " + line);
                            }
                        }
                    }
                } catch (Exception e) {
                    log("[LSP-stderr] reader ended: " + e.getMessage());
                }
            }, "lsp-stderr-reader").start();

            // Exit code watcher — critical when process dies before initialize
            new Thread(() -> {
                try {
                    int code = process.waitFor();
                    log("[LSP] process exited with code " + code
                        + (code == 0 ? "" : " (non-zero → check typescript / node path)"));
                } catch (InterruptedException e) {
                    log("[LSP] exit waiter interrupted");
                }
            }, "lsp-exit-waiter").start();

            final AtomicBoolean firstStdout = new AtomicBoolean(true);
            new Thread(() -> {
                try {
                    byte[] buf = new byte[8192];
                    int len;
                    while ((len = stdout.read(buf)) != -1) {
                        if (forceStopped.get()) break;
                        if (firstStdout.compareAndSet(true, false)) {
                            log("[LSP-stdout] first chunk " + len + " bytes"
                                + " (Content-Length frame expected)");
                        }
                        conn.send(ByteBuffer.wrap(buf, 0, len));
                    }
                    log("[LSP-stdout] EOF — process closed stdout");
                } catch (Exception e) {
                    log("[LSP-stdout] reader error: " + e.getMessage());
                }
                conn.close(1000, "process exited");
            }, "lsp-stdout-reader").start();

        } catch (Exception e) {
            log("[LSP] Failed to start process: " + e.getMessage());
            conn.close(1011, "Failed to start process: " + e.getMessage());
        }
    }

    @Override
    public void onMessage(WebSocket conn, ByteBuffer msg) {
        try {
            ConnState state = conn.getAttachment();
            if (state != null) {
                byte[] data = new byte[msg.remaining()];
                msg.get(data);
                state.stdin.write(data);
                state.stdin.flush();
            }
        } catch (Exception e) {
            log("[LSP] stdin write (binary) failed: " + e.getMessage());
        }
    }

    @Override
    public void onMessage(WebSocket conn, String message) {
        try {
            ConnState state = conn.getAttachment();
            if (state != null) {
                if (message != null && message.contains("\"method\":\"initialize\"")) {
                    log("[LSP-stdin] initialize request received (" + message.length() + " chars)");
                }
                state.stdin.write(message.getBytes(StandardCharsets.UTF_8));
                state.stdin.flush();
            }
        } catch (Exception e) {
            log("[LSP] stdin write (text) failed: " + e.getMessage());
        }
    }

    @Override
    public void onClose(WebSocket conn, int code, String reason, boolean remote) {
        log("[LSP] client closed code=" + code + " reason=" + reason + " remote=" + remote);
        try {
            ConnState state = conn.getAttachment();
            if (state != null) {
                liveProcesses.remove(state.process);
                destroyProcess(state.process);
            }
        } catch (Exception ignored) {}

        if (!forceStopped.get()) {
            new Thread(() -> {
                try { stop(); } catch (Exception ignored) {}
            }, "lsp-server-stop").start();
        }
    }
}
