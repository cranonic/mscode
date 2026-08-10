// package com.editor.mscode.terminal.initenv;

// import com.editor.mscode.terminal.RootfsManager;

// import java.io.File;
// import java.io.FileOutputStream;
// import java.io.IOException;

// /**
//  * Thin per-session ENV script.
//  * Sources cached mscode_env.sh then sets cwd + banner.
//  * Must stay fast — called on every terminal open.
//  */
// public class SessionInitWriter {

//     private final RootfsManager rootfs;
//     private final SharedEnvCache sharedCache;

//     public SessionInitWriter(RootfsManager rootfs, SharedEnvCache sharedCache) {
//         this.rootfs = rootfs;
//         this.sharedCache = sharedCache;
//     }

//     public void write(String outputPath, String projectCwd) throws IOException {
//         sharedCache.ensureSharedEnv();

//         String home = rootfs.getHomePath();
//         String hostname = rootfs.getStoredHostname();

//         String safeCwd = (projectCwd != null && !projectCwd.isEmpty())
//             ? ShellNameUtil.shellSingleQuote(projectCwd)
//             : ShellNameUtil.shellSingleQuote(home);
//         String safeHome = ShellNameUtil.shellSingleQuote(home);
//         String safeHost = hostname != null ? ShellNameUtil.shellSingleQuote(hostname) : "mscode";
//         String sharedPath = ShellNameUtil.shellSingleQuote(rootfs.getFilesDir() + "/mscode_env.sh");

//         StringBuilder sb = new StringBuilder(512);
//         sb.append("# MS Code per-session ENV (thin) — sources shared env\n");
//         sb.append("[ -f '").append(sharedPath).append("' ] && . '").append(sharedPath).append("'\n");
//         sb.append("export MSCODE_HOST='").append(safeHost).append("'\n");
//         sb.append("if [ -d '").append(safeCwd).append("' ]; then\n");
//         sb.append("  cd '").append(safeCwd).append("'\n");
//         sb.append("else\n");
//         sb.append("  cd '").append(safeHome).append("' 2>/dev/null || true\n");
//         sb.append("fi\n");
//         sb.append("if [ -z \"$MSCODE_BANNER_SHOWN\" ]; then\n");
//         sb.append("  export MSCODE_BANNER_SHOWN=1\n");
//         sb.append("  echo \"[+] Opened: $PWD\"\n");
//         sb.append("  if [ -n \"$PREFIX\" ] && [ -d \"$PREFIX/bin\" ]; then\n");
//         sb.append("    echo \"[+] PREFIX=$PREFIX\"\n");
//         sb.append("  else\n");
//         sb.append("    echo \"[+] Native shell (bootstrap pending)\"\n");
//         sb.append("  fi\n");
//         sb.append("fi\n");

//         File f = new File(outputPath);
//         if (f.getParentFile() != null) f.getParentFile().mkdirs();
//         try (FileOutputStream fos = new FileOutputStream(f)) {
//             fos.write(sb.toString().getBytes("UTF-8"));
//         }
//         //noinspection ResultOfMethodCallIgnored
//         f.setReadable(true, false);
//     }

//     public void cleanup(String outputPath) {
//         new File(outputPath).delete();
//     }
// }



package com.editor.mscode.terminal.initenv;

import com.editor.mscode.terminal.RootfsManager;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;

/**
 * Thin per-session ENV script.
 * Sources cached mscode_env.sh then sets cwd + banner.
 * Must stay fast — called on every terminal open.
 */
public class SessionInitWriter {

    private final RootfsManager rootfs;
    private final SharedEnvCache sharedCache;

    public SessionInitWriter(RootfsManager rootfs, SharedEnvCache sharedCache) {
        this.rootfs = rootfs;
        this.sharedCache = sharedCache;
    }

    public void write(String outputPath, String projectCwd) throws IOException {
        sharedCache.ensureSharedEnv();

        String home = rootfs.getHomePath();
        String hostname = rootfs.getStoredHostname();

        String safeCwd = (projectCwd != null && !projectCwd.isEmpty())
            ? ShellNameUtil.shellSingleQuote(projectCwd)
            : ShellNameUtil.shellSingleQuote(home);
        String safeHome = ShellNameUtil.shellSingleQuote(home);
        String safeHost = hostname != null ? ShellNameUtil.shellSingleQuote(hostname) : "mscode";
        String sharedPath = ShellNameUtil.shellSingleQuote(rootfs.getFilesDir() + "/mscode_env.sh");

        StringBuilder sb = new StringBuilder(768);
        sb.append("# MS Code per-session init (thin) — sources shared env\n");
        sb.append("# Used as: bash --rcfile <this> -i   OR   mksh with ENV=<this>\n");
        sb.append("[ -f '").append(sharedPath).append("' ] && . '").append(sharedPath).append("'\n");
        sb.append("export MSCODE_HOST='").append(safeHost).append("'\n");
        // Prefer PREFIX inputrc when present (bash soft-wrap)
        sb.append("if [ -f \"$PREFIX/etc/inputrc\" ]; then\n");
        sb.append("  export INPUTRC=\"$PREFIX/etc/inputrc\"\n");
        sb.append("fi\n");
        sb.append("if [ -d '").append(safeCwd).append("' ]; then\n");
        sb.append("  cd '").append(safeCwd).append("'\n");
        sb.append("else\n");
        sb.append("  cd '").append(safeHome).append("' 2>/dev/null || true\n");
        sb.append("fi\n");
        // Bash interactive: force soft-wrap (Termux-like). mksh ignores bind.
        sb.append("if [ -n \"$BASH_VERSION\" ]; then\n");
        sb.append("  bind 'set horizontal-scroll-mode off' 2>/dev/null || true\n");
        sb.append("  printf '\\033[?7h' 2>/dev/null || true\n");
        sb.append("fi\n");
        sb.append("if [ -z \"$MSCODE_BANNER_SHOWN\" ]; then\n");
        sb.append("  export MSCODE_BANNER_SHOWN=1\n");
        sb.append("  echo \"[+] Opened: $PWD\"\n");
        sb.append("  if [ -n \"$BASH_VERSION\" ]; then\n");
        sb.append("    echo \"[+] Shell: bash (line wrap on)\"\n");
        sb.append("  elif [ -n \"$PREFIX\" ] && [ -d \"$PREFIX/bin\" ]; then\n");
        sb.append("    echo \"[+] PREFIX=$PREFIX  (install bash for soft line wrap)\"\n");
        sb.append("  else\n");
        sb.append("    echo \"[+] Native shell (bootstrap pending)\"\n");
        sb.append("  fi\n");
        sb.append("fi\n");

        File f = new File(outputPath);
        if (f.getParentFile() != null) f.getParentFile().mkdirs();
        try (FileOutputStream fos = new FileOutputStream(f)) {
            fos.write(sb.toString().getBytes("UTF-8"));
        }
        //noinspection ResultOfMethodCallIgnored
        f.setReadable(true, false);
    }

    public void cleanup(String outputPath) {
        new File(outputPath).delete();
    }
}
