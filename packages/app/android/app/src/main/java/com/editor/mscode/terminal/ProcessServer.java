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
import java.util.concurrent.ConcurrentLinkedQueue;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicReference;
import java.util.Map;

/**
 * Java-side WebSocket server that bridges a process's stdio to WebSocket clients.
 *
 * Lifecycle:
 *  • One ProcessServer per LSP session.
 *  • Language-server process is spawned on first client open.
 *  • Client disconnect → process destroyed + server stopped.
 *  • forceStop() can also tear everything down explicitly (language switch / kill).
 *
 * (Adapted from Acode's ProcessServer.java — MIT licence)
 */
public class ProcessServer extends WebSocketServer {

    private final String[] cmd;
    private final Map<String, String> env;
    private final CountDownLatch readyLatch = new CountDownLatch(1);
    private final AtomicReference<Exception> startError = new AtomicReference<>();
    private final AtomicBoolean forceStopped = new AtomicBoolean(false);

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
        super(new InetSocketAddress("127.0.0.1", port));
        this.cmd = cmd;
        this.env = env;
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
     * Destroys every spawned language-server process and stops the WS server,
     * even if no client ever connected.
     */
    public void forceStop() {
        if (!forceStopped.compareAndSet(false, true)) return;

        // Kill processes first
        Process p;
        while ((p = liveProcesses.poll()) != null) {
            destroyProcess(p);
        }

        // Close any open sockets (triggers onClose → destroy again, safe)
        try {
            for (WebSocket c : getConnections()) {
                try { c.close(1001, "forceStop"); } catch (Exception ignored) {}
            }
        } catch (Exception ignored) {}

        // Stop server off the worker threads to avoid deadlock
        new Thread(() -> {
            try { stop(); } catch (Exception ignored) {}
        }, "lsp-force-stop").start();
    }

    private static void destroyProcess(Process process) {
        if (process == null) return;
        try {
            process.destroy();
            // Give a brief moment, then force if still alive
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
    }

    @Override
    public void onOpen(WebSocket conn, ClientHandshake handshake) {
        if (forceStopped.get()) {
            conn.close(1001, "server stopping");
            return;
        }
        try {
            ProcessBuilder pb = new ProcessBuilder(cmd);
            pb.environment().clear();
            if (env != null) {
                pb.environment().putAll(env);
            }

            Process process = pb.redirectErrorStream(true).start();
            liveProcesses.add(process);

            InputStream stdout = process.getInputStream();
            OutputStream stdin = process.getOutputStream();

            conn.setAttachment(new ConnState(process, stdin));

            new Thread(() -> {
                try {
                    byte[] buf = new byte[8192];
                    int len;
                    while ((len = stdout.read(buf)) != -1) {
                        if (forceStopped.get()) break;
                        conn.send(ByteBuffer.wrap(buf, 0, len));
                    }
                } catch (Exception ignored) {}
                conn.close(1000, "process exited");
            }, "lsp-stdout-reader").start();

        } catch (Exception e) {
            conn.close(1011, "Failed to start process: " + e.getMessage());
        }
    }

    @Override
    public void onMessage(WebSocket conn, ByteBuffer msg) {
        try {
            ConnState state = conn.getAttachment();
            if (state != null) {
                state.stdin.write(msg.array(), msg.position(), msg.remaining());
                state.stdin.flush();
            }
        } catch (Exception ignored) {}
    }

    @Override
    public void onMessage(WebSocket conn, String message) {
        try {
            ConnState state = conn.getAttachment();
            if (state != null) {
                state.stdin.write(message.getBytes(StandardCharsets.UTF_8));
                state.stdin.flush();
            }
        } catch (Exception ignored) {}
    }

    @Override
    public void onClose(WebSocket conn, int code, String reason, boolean remote) {
        try {
            ConnState state = conn.getAttachment();
            if (state != null) {
                liveProcesses.remove(state.process);
                destroyProcess(state.process);
            }
        } catch (Exception ignored) {}

        // Auto-stop server when the last client leaves (unless already force-stopped)
        if (!forceStopped.get()) {
            new Thread(() -> {
                try { stop(); } catch (Exception ignored) {}
            }, "lsp-server-stop").start();
        }
    }
}
