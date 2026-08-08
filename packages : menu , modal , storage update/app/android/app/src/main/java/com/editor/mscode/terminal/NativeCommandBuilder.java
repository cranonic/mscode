package com.editor.mscode;

import android.content.Context;

import java.io.File;
import java.util.ArrayList;
import java.util.List;

/**
 * Legacy helper — prefer ProotCommandBuilder (native path) which sets
 * $PREFIX / PATH correctly for Termux-style bootstrap.
 * Kept for reference / older call sites.
 */
public class NativeCommandBuilder {

    private final String nativeLibDir;
    private final String filesDir;
    private final String packageName;
    private final File initScriptFile;
    private final String prefixPath;

    public NativeCommandBuilder(Context context) {
        this.filesDir = context.getFilesDir().getAbsolutePath();
        this.nativeLibDir = context.getApplicationInfo().nativeLibraryDir;
        this.packageName = context.getPackageName();
        this.initScriptFile = new File(context.getFilesDir(), "home/init.sh");
        this.prefixPath = filesDir + "/usr";
    }

    public List<String> buildNativeSessionCommand() {
        List<String> cmd = new ArrayList<>();

        // Prefer system sh + ENV init (same as ProotCommandBuilder native path)
        cmd.add("/system/bin/sh");
        cmd.add("-i");

        return cmd;
    }

    public String getPrefixPath() {
        return prefixPath;
    }
}