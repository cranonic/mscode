package com.editor.mscode; 

import android.content.Context;

import java.io.File;
import java.util.ArrayList;
import java.util.List;

public class NativeCommandBuilder {

    private final String nativeLibDir;
    private final String filesDir;
    private final String packageName;
    private final File initScriptFile;

    public NativeCommandBuilder(Context context) {
        this.filesDir = context.getFilesDir().getAbsolutePath();
        this.nativeLibDir = context.getApplicationInfo().nativeLibraryDir;
        this.packageName = context.getPackageName();
        this.initScriptFile = new File(context.getFilesDir(), "home/init.sh");
    }

    public List<String> buildNativeSessionCommand() {
        List<String> cmd = new ArrayList<>();

        // 1. Native busybox library
        cmd.add(nativeLibDir + "/libbusybox.so");

        // 2. Shell (ash = native, fast)
        cmd.add("ash");

        // 3. Interactive mode
        cmd.add("-i");

        // 4. init script start (HOME, PATH, cd etc.)
        // script build to Java
        cmd.add("-c");
        cmd.add("source " + initScriptFile.getAbsolutePath() + "\n" +
                "exec ash -i");

        return cmd;
    }
}