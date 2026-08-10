package com.editor.mscode.terminal.initenv;

import com.editor.mscode.terminal.RootfsManager;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.util.Set;

/**
 * Builds the full shared mscode_env.sh content by composing fragments.
 */
public class SharedEnvBuilder {

    private final RootfsManager rootfs;

    public SharedEnvBuilder(RootfsManager rootfs) {
        this.rootfs = rootfs;
    }

    /**
     * @param includeSessionBits if true, also emit project cwd + banner (legacy full write)
     */
    public void writeFullEnv(String outputPath, String projectCwd, boolean includeSessionBits)
            throws IOException {
        String hostname = rootfs.getStoredHostname();
        String home     = rootfs.getHomePath();
        String tmp      = rootfs.getTmpPath();
        String prefix   = rootfs.getPrefixPath();
        String toybox   = rootfs.getToyboxPath();
        String libDir   = rootfs.getNativeLibDir();
        boolean bootOk  = rootfs.isBootstrapReady();

        String safeCwd = (projectCwd != null && !projectCwd.isEmpty())
            ? ShellNameUtil.shellSingleQuote(projectCwd)
            : ShellNameUtil.shellSingleQuote(home);
        String safeHost   = hostname != null ? ShellNameUtil.shellSingleQuote(hostname) : "mscode";
        String safeHome   = ShellNameUtil.shellSingleQuote(home);
        String safeTmp    = ShellNameUtil.shellSingleQuote(tmp);
        String safePrefix = ShellNameUtil.shellSingleQuote(prefix);
        String safeLib    = ShellNameUtil.shellSingleQuote(libDir);
        String safeToybox = ShellNameUtil.shellSingleQuote(toybox);

        StringBuilder sb = new StringBuilder(16384);

        EnvExportsFragment.append(sb, safeHome, safeTmp, safePrefix, safeLib, safeToybox, safeHost);
        ElfRunnerFragment.append(sb, safeLib, safeTmp);
        Set<String> claimed = ToyboxAppletsFragment.append(sb);

        File prefixBin = new File(prefix, "bin");
        File[] bins = prefixBin.isDirectory() ? prefixBin.listFiles() : null;
        PrefixWrappersFragment.append(sb, bins, claimed);
        CompilerProotFragment.append(sb);

        BashEnvWriter.write(prefix, safePrefix, safeToybox, safeLib, bins);
        PkgShellFragment.append(sb);

        if (includeSessionBits) {
            sb.append("if [ -d '").append(safeCwd).append("' ]; then\n");
            sb.append("  cd '").append(safeCwd).append("'\n");
            sb.append("else\n");
            sb.append("  cd '").append(safeHome).append("' 2>/dev/null || true\n");
            sb.append("fi\n\n");
            sb.append("if [ -z \"$MSCODE_BANNER_SHOWN\" ]; then\n");
            sb.append("  export MSCODE_BANNER_SHOWN=1\n");
            sb.append("  echo \"[+] Opened: $PWD\"\n");
            if (bootOk) {
                sb.append("  echo \"[+] PREFIX=$PREFIX  linker=$MSCODE_LINKER\"\n");
                sb.append("  echo \"[+] bb ls / curl / elf $PREFIX/bin/curl / pkg\"\n");
            } else {
                sb.append("  echo \"[+] Native shell (bootstrap pending)  |  bb ls / bb --list\"\n");
            }
            sb.append("fi\n");
        }

        File f = new File(outputPath);
        if (f.getParentFile() != null) f.getParentFile().mkdirs();
        try (FileOutputStream fos = new FileOutputStream(f)) {
            fos.write(sb.toString().getBytes("UTF-8"));
        }
        //noinspection ResultOfMethodCallIgnored
        f.setReadable(true, false);
    }
}
