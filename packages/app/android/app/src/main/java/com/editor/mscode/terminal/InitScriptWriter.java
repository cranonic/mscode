package com.editor.mscode.terminal;

import com.editor.mscode.terminal.initenv.SessionInitWriter;
import com.editor.mscode.terminal.initenv.SharedEnvBuilder;
import com.editor.mscode.terminal.initenv.SharedEnvCache;

import java.io.IOException;

/**
 * Facade for terminal init / shared env scripts.
 * Implementation lives in {@code initenv/} modules:
 * <ul>
 *   <li>{@link SessionInitWriter} — thin per-session ENV</li>
 *   <li>{@link SharedEnvCache} — stamp-cached mscode_env.sh</li>
 *   <li>{@link SharedEnvBuilder} — composes shell fragments</li>
 * </ul>
 */
public class InitScriptWriter {

    private final RootfsManager rootfs;
    private final SharedEnvCache sharedCache;
    private final SessionInitWriter sessionWriter;
    private final SharedEnvBuilder sharedBuilder;

    public InitScriptWriter(RootfsManager rootfs) {
        this.rootfs = rootfs;
        this.sharedCache = new SharedEnvCache(rootfs);
        this.sessionWriter = new SessionInitWriter(rootfs, sharedCache);
        this.sharedBuilder = new SharedEnvBuilder(rootfs);
    }

    /** Thin per-session ENV — sources cached mscode_env.sh + cwd/banner. */
    public void write(String outputPath, String projectCwd) throws IOException {
        sessionWriter.write(outputPath, projectCwd);
    }

    /** Full shared env (heavy). Prefer {@link #writeSharedEnv()}. */
    public void writeFullEnv(String outputPath, String projectCwd, boolean includeSessionBits)
            throws IOException {
        sharedBuilder.writeFullEnv(outputPath, projectCwd, includeSessionBits);
    }

    /** Cached shared env — rebuild only when stamp changes. */
    public void writeSharedEnv() throws IOException {
        sharedCache.ensureSharedEnv();
    }

    /** Delete per-session init file. */
    public void cleanup(String outputPath) {
        sessionWriter.cleanup(outputPath);
    }

    /** Invalidate cache (call after pkg install so wrappers refresh). */
    public void invalidateSharedEnv() {
        sharedCache.invalidate();
    }
}
