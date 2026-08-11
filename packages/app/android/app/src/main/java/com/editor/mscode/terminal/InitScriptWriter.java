package com.editor.mscode.terminal;

import com.editor.mscode.terminal.initenv.SessionInitWriter;
import com.editor.mscode.terminal.initenv.SharedEnvBuilder;
import com.editor.mscode.terminal.initenv.SharedEnvCache;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;

/**
 * Facade for terminal init / shared env scripts.
 * <ul>
 *   <li>{@link #write} — native (Bionic + $PREFIX) thin session ENV</li>
 *   <li>{@link #writeProot} — Alpine guest init (apk / profile / bash)</li>
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

    /** Thin per-session ENV — sources cached mscode_env.sh + cwd/banner (native). */
    public void write(String outputPath, String projectCwd) throws IOException {
        sessionWriter.write(outputPath, projectCwd);
    }

    /**
     * Alpine / proot session init — runs inside the guest after proot starts.
     * Based on the old Alpine InitScriptWriter (assets alpine-*.zip path).
     */
    public void writeProot(String outputPath, String projectCwd) throws IOException {
        String hostname = rootfs.getStoredHostname();

        String safeCwd = (projectCwd != null && !projectCwd.isEmpty())
            ? projectCwd.replace("'", "'\\''")
            : "/root";

        String safeHost = hostname != null
            ? hostname.replace("'", "'\\''")
            : "mscode";

        String script =
            "#!/bin/sh\n" +
            "export PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin\n" +
            "export HOME=/root\n" +
            "export TERM=xterm-256color\n" +
            "export LANG=C.UTF-8\n" +
            "export PIP_BREAK_SYSTEM_PACKAGES=1\n" +
            "export MSCODE_EXEC_MODE=proot\n" +
            // DNS fallback
            "if [ ! -s /etc/resolv.conf ]; then\n" +
            "    echo 'nameserver 8.8.8.8' > /etc/resolv.conf\n" +
            "fi\n" +
            // First-run package install (optional; needs network)
            "if [ ! -f /root/.mscode_setup_done ]; then\n" +
            "    echo -e '\\e[34;1m[*]\\e[0m Alpine first-run setup...'\n" +
            "    if command -v apk >/dev/null 2>&1; then\n" +
            "      apk update -q && apk upgrade -q\n" +
            "      apk add -q bash gcompat glib nano 2>/dev/null || true\n" +
            "    fi\n" +
            "    touch /root/.mscode_setup_done\n" +
            "    clear\n" +
            "    echo -e '\\e[1;32m[+] Alpine Ready! (proot)\\e[0m'\n" +
            "fi\n" +
            // cd to project dir (Android paths are bind-mounted)
            "if [ -d '" + safeCwd + "' ]; then\n" +
            "    cd '" + safeCwd + "'\n" +
            "    echo -e \"\\e[33m[+] Opened: $PWD\\e[0m\"\n" +
            "else\n" +
            "    cd /root\n" +
            "    echo -e \"\\e[31m[!] Path not found, opened /root\\e[0m\"\n" +
            "fi\n" +
            "MSCODE_HOST=$(cat /etc/mscode_hostname 2>/dev/null || echo '" + safeHost + "')\n" +
            "mkdir -p /etc/profile.d\n" +
            "cat > /etc/profile.d/mscode_prompt.sh << 'MSCODE_EOF'\n" +
            "MSCODE_HOST=$(cat /etc/mscode_hostname 2>/dev/null || echo localhost)\n" +
            "export PROMPT_DIRTRIM=2\n" +
            "export PS1='\\[\\e[1;32m\\]${MSCODE_HOST}\\[\\e[0m\\]:\\[\\e[1;34m\\]\\w\\[\\e[0m\\]\\$ '\n" +
            "MSCODE_EOF\n" +
            "export PROMPT_DIRTRIM=2\n" +
            "export PS1='\\[\\e[1;32m\\]'" + "\"$MSCODE_HOST\"" +
                "'\\[\\e[0m\\]:\\[\\e[1;34m\\]\\w\\[\\e[0m\\]\\$ '\n" +
            "if [ ! -f /bin/bash ]; then\n" +
            "  export PS1='\\[\\e[1;32m\\]'" + "\"$MSCODE_HOST\"" +
                "'\\[\\e[0m\\]:\\[\\e[1;34m\\]$(pwd | awk -F/ '\\''{if (NF>3) print \"../\"$(NF-1)\"/\"$NF; else if (NF>=2) print $(NF-1)\"/\"$NF; else print $0}'\\'')\\[\\e[0m\\]\\$ '\n" +
            "fi\n" +
            "if [ -f /bin/bash ]; then\n" +
            "  exec /bin/bash --login\n" +
            "else\n" +
            "  exec /bin/ash\n" +
            "fi\n";

        File f = new File(outputPath);
        File parent = f.getParentFile();
        if (parent != null) parent.mkdirs();
        try (FileOutputStream fos = new FileOutputStream(f)) {
            fos.write(script.getBytes("UTF-8"));
        }
        //noinspection ResultOfMethodCallIgnored
        f.setExecutable(true, false);
    }

    public void writeFullEnv(String outputPath, String projectCwd, boolean includeSessionBits)
            throws IOException {
        sharedBuilder.writeFullEnv(outputPath, projectCwd, includeSessionBits);
    }

    public void writeSharedEnv() throws IOException {
        sharedCache.ensureSharedEnv();
    }

    public void cleanup(String outputPath) {
        sessionWriter.cleanup(outputPath);
        // proot scripts live on the same path scheme
        new File(outputPath).delete();
    }

    public void invalidateSharedEnv() {
        sharedCache.invalidate();
    }
}
