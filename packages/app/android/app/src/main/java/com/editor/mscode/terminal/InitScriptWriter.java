package com.editor.mscode.terminal;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;

/**
 * Writes per-session Alpine init shell scripts.
 *
 * Each terminal session gets its own init script so:
 *   • Different sessions can start in different directories.
 *   • Scripts are cleaned up after the session exits.
 */
public class InitScriptWriter {

    private final RootfsManager rootfs;

    public InitScriptWriter(RootfsManager rootfs) {
        this.rootfs = rootfs;
    }

    /**
     * Writes a session init script to {@code outputPath}.
     *
     * @param outputPath  Where to write the script (e.g. filesDir/init_tab1.sh).
     * @param projectCwd  Proot-accessible path to open on startup.
     *                    Falls back silently to /root if the dir doesn't exist inside proot.
     */
    public void write(String outputPath, String projectCwd) throws IOException {
        String hostname = rootfs.getStoredHostname();

        String safeCwd = (projectCwd != null && !projectCwd.isEmpty())
            ? projectCwd.replace("'", "'\\''")
            : "/root";

        String safeHost = hostname != null
            ? hostname.replace("'", "'\\''")
            : "localhost";

        // Prompt strategy:
        //   • bash: PROMPT_DIRTRIM=2 + \w  →  .../0/Download
        //   • ash:  inline awk in PS1
        //   • Written to /etc/profile.d so `bash --login` actually picks it up
        //     (Alpine login shells source /etc/profile, NOT ~/.bashrc)
        String script =
            "#!/bin/sh\n" +
            "export PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin\n" +
            "export HOME=/root\n" +
            "export TERM=xterm-256color\n" +
            "export LANG=C.UTF-8\n" +
            "export PIP_BREAK_SYSTEM_PACKAGES=1\n" +
            // DNS fallback
            "if [ ! -s /etc/resolv.conf ]; then\n" +
            "    echo 'nameserver 8.8.8.8' > /etc/resolv.conf\n" +
            "fi\n" +
            // First-run package install
            "if [ ! -f /root/.mscode_setup_done ]; then\n" +
            "    echo -e '\\e[34;1m[*]\\e[0m Installing packages...'\n" +
            "    apk update -q && apk upgrade -q\n" +
            "    apk add -q bash gcompat glib nano\n" +
            "    touch /root/.mscode_setup_done\n" +
            "    clear\n" +
            "    echo -e '\\e[1;32m[+] Alpine Ready! Welcome to MS Code.\\e[0m'\n" +
            "fi\n" +
            // cd to project dir
            "if [ -d '" + safeCwd + "' ]; then\n" +
            "    cd '" + safeCwd + "'\n" +
            "    echo -e \"\\e[33m[+] Opened: $PWD\\e[0m\"\n" +
            "else\n" +
            "    cd /root\n" +
            "    echo -e \"\\e[31m[!] Path not found, opened /root\\e[0m\"\n" +
            "fi\n" +
            // Hostname
            "MSCODE_HOST=$(cat /etc/mscode_hostname 2>/dev/null || echo '" + safeHost + "')\n" +
            // Install prompt into /etc/profile.d (sourced by bash --login)
            "mkdir -p /etc/profile.d\n" +
            "cat > /etc/profile.d/mscode_prompt.sh << 'MSCODE_EOF'\n" +
            "# MS Code short prompt — last 2 path components via PROMPT_DIRTRIM\n" +
            "MSCODE_HOST=$(cat /etc/mscode_hostname 2>/dev/null || echo localhost)\n" +
            "export PROMPT_DIRTRIM=2\n" +
            "export PS1='\\[\\e[1;32m\\]${MSCODE_HOST}\\[\\e[0m\\]:\\[\\e[1;34m\\]\\w\\[\\e[0m\\]\\$ '\n" +
            "MSCODE_EOF\n" +
            // Also set for current shell
            "export PROMPT_DIRTRIM=2\n" +
            "export PS1='\\[\\e[1;32m\\]'" + "\"$MSCODE_HOST\"" +
                "'\\[\\e[0m\\]:\\[\\e[1;34m\\]\\w\\[\\e[0m\\]\\$ '\n" +
            // Ash does not support PROMPT_DIRTRIM — give it awk-based PS1
            "if [ ! -f /bin/bash ]; then\n" +
            "  export PS1='\\[\\e[1;32m\\]'" + "\"$MSCODE_HOST\"" +
                "'\\[\\e[0m\\]:\\[\\e[1;34m\\]$(pwd | awk -F/ '\\''{if (NF>3) print \"../\"$(NF-1)\"/\"$NF; else if (NF>=2) print $(NF-1)\"/\"$NF; else print $0}'\\'')\\[\\e[0m\\]\\$ '\n" +
            "fi\n" +
            // Remove broken leftovers from previous update
            "if [ -f /root/.bashrc ] && grep -q '_short_pwd\\|short_pwd' /root/.bashrc 2>/dev/null; then\n" +
            "  sed -i '/_short_pwd/,/PROMPT_COMMAND/d' /root/.bashrc 2>/dev/null\n" +
            "  sed -i '/short_pwd/d' /root/.bashrc 2>/dev/null\n" +
            "fi\n" +
            "if [ -f /bin/bash ]; then\n" +
            "  exec /bin/bash --login\n" +
            "else\n" +
            "  exec /bin/ash\n" +
            "fi\n";

        File f = new File(outputPath);
        f.getParentFile().mkdirs();
        try (FileOutputStream fos = new FileOutputStream(f)) {
            fos.write(script.getBytes("UTF-8"));
        }
        f.setExecutable(true, false);
    }

    /** Deletes the init script after session exit to avoid stale files. */
    public void cleanup(String outputPath) {
        new File(outputPath).delete();
    }
}
