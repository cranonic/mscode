package com.editor.mscode;

import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.ServiceConnection;
import android.os.Build;
import android.os.IBinder;
import android.util.Log;

import com.editor.mscode.terminal.PtyEngine;
import com.editor.mscode.terminal.TerminalForegroundService;
import com.editor.mscode.terminal.TerminalSession;
import com.editor.mscode.terminal.ProotCommandBuilder;
import com.editor.mscode.terminal.TerminalCommandBuilder;
import com.editor.mscode.terminal.RootfsManager;


import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.io.IOException;
import java.util.List;
import java.util.Map;

import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;

@CapacitorPlugin(name = "NativeTerminal")
public class NativeTerminalPlugin extends Plugin {

    private static final String TAG = "NativeTerminalPlugin";

    // ─── Native Library & JNI Declarations ────────────────────────────────────
    static { System.loadLibrary("pty_helper"); }

    private native int  nativeCreateSubprocess(String[] cmd, String[] env, String cwd,
                                               int[] pids, int rows, int cols);
    private native void nativeResizePty(int fd, int rows, int cols);
    private native int  nativeWaitForChild(int pid);
    private native void nativeSendSignal(int pid, int signal);

    // ─── Service Connection ───────────────────────────────────────────────────
    private TerminalForegroundService terminalService;
    private boolean isBound = false;
    
    // Latch Declare
    private CountDownLatch bindLatch = new CountDownLatch(1);

    private final ServiceConnection serviceConnection = new ServiceConnection() {
        @Override
        public void onServiceConnected(ComponentName name, IBinder service) {
            TerminalForegroundService.LocalBinder binder = (TerminalForegroundService.LocalBinder) service;
            terminalService = binder.getService();
            isBound = true;

            // Initialize the builder inside the service with nativeLibDir
            String nativeLibDir = getContext().getApplicationInfo().nativeLibraryDir;
            terminalService.initBuilder(nativeLibDir);

            // Connect service events to Capacitor's notifyListeners
            terminalService.setEventCallback(new TerminalForegroundService.EventCallback() {
                @Override
                public void onData(String sessionId, String data) {
                    JSObject o = new JSObject();
                    o.put("id", sessionId);
                    o.put("data", data);
                    notifyListeners("onData", o);
                }

                @Override
                public void onExit(String sessionId, int exitCode) {
                    JSObject o = new JSObject();
                    o.put("id", sessionId);
                    o.put("code", exitCode);
                    notifyListeners("onExit", o);
                }

                @Override
                public void onLog(String message) {
                    JSObject o = new JSObject();
                    o.put("message", message);
                    notifyListeners("onLog", o);
                }
            });

            // Thread will unlock once service ready
            bindLatch.countDown(); 
            Log.i(TAG, "Successfully bound to TerminalForegroundService.");
        }

        @Override
        public void onServiceDisconnected(ComponentName name) {
            isBound = false;
            terminalService = null;
            // Latch request for reconnect
            bindLatch = new CountDownLatch(1); 
            Log.w(TAG, "Disconnected from TerminalForegroundService.");
        }
    };

    // ─── Plugin Lifecycle ─────────────────────────────────────────────────────

    @Override
    public void load() {
        super.load();
        
        // Initialize PtyEngine with JNI method references
        PtyEngine.init(
            this::nativeCreateSubprocess,
            this::nativeResizePty,
            this::nativeWaitForChild,
            this::nativeSendSignal
        );

        // Start and bind to the Foreground Service
        Context context = getContext();
        Intent intent = new Intent(context, TerminalForegroundService.class);
        context.startService(intent);
        context.bindService(intent, serviceConnection, Context.BIND_AUTO_CREATE);
    }

    @Override
    protected void handleOnDestroy() {
        if (isBound) {
            getContext().unbindService(serviceConnection);
            isBound = false;
        }
        super.handleOnDestroy();
    }
    
    // Check from Frontend
    @PluginMethod
    public void checkSetup(PluginCall call) {
        if (!checkService(call)) return;
        JSObject ret = new JSObject();
        ret.put("isReady", terminalService.isRootfsReady());
        ret.put("bootstrapReady", terminalService.isBootstrapReady());
        ret.put("prefix", terminalService.getPrefixPath());
        call.resolve(ret);
    }

    // Trigger Background setup from Frontend 
    @PluginMethod
    public void initSetup(PluginCall call) {
        if (!checkService(call)) return;
        String arch = getArch();
        if (arch == null) {
            call.reject("Unsupported ABI");
            return;
        }

        new Thread(() -> {
            try {
                terminalService.ensureSetup(arch);
                call.resolve();
            } catch (Exception e) {
                call.reject("Terminal setup failed: " + e.getMessage());
            }
        }, "term-setup").start();
    }

    /**
     * pkgInstall({ packages: ["git", "curl"] })
     * Downloads .deb from Termux main repo and extracts into $PREFIX.
     */
    @PluginMethod
    public void pkgInstall(PluginCall call) {
        if (!checkService(call)) return;
        String arch = getArch();
        if (arch == null) {
            call.reject("Unsupported ABI");
            return;
        }

        JSArray arr = call.getArray("packages");
        if (arr == null || arr.length() == 0) {
            String single = call.getString("package", null);
            if (single == null || single.isEmpty()) {
                call.reject("packages[] required");
                return;
            }
            arr = new JSArray();
            arr.put(single);
        }

        final java.util.List<String> pkgs = new java.util.ArrayList<>();
        try {
            for (int i = 0; i < arr.length(); i++) {
                pkgs.add(arr.getString(i));
            }
        } catch (Exception e) {
            call.reject("Invalid packages array");
            return;
        }

        new Thread(() -> {
            try {
                String summary = terminalService.pkgInstall(pkgs, arch);
                JSObject ret = new JSObject();
                ret.put("summary", summary);
                ret.put("prefix", terminalService.getPrefixPath());
                call.resolve(ret);
            } catch (Exception e) {
                call.reject("pkg install failed: " + e.getMessage());
            }
        }, "pkg-install").start();
    }

    /** pkgListInstalled() → { packages: string[] } */
    @PluginMethod
    public void pkgListInstalled(PluginCall call) {
        if (!checkService(call)) return;
        java.util.List<String> list = terminalService.pkgListInstalled();
        JSObject ret = new JSObject();
        JSArray arr = new JSArray();
        for (String p : list) arr.put(p);
        ret.put("packages", arr);
        call.resolve(ret);
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    private String getArch() {
        String abi = Build.SUPPORTED_ABIS[0];
        if (abi.contains("arm64") || abi.contains("aarch64")) return "aarch64";
        if (abi.contains("x86_64"))                           return "x86_64";
        if (abi.contains("armeabi") || abi.contains("armv7") || abi.equals("arm"))
            return "arm";
        return null;
    }

    private boolean checkService(PluginCall call) {
        if (terminalService != null) return true;
        
        try {
            // Wait 5sec until service bind
            if (bindLatch.await(5, TimeUnit.SECONDS)) {
                return terminalService != null;
            }
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
        
        call.reject("Terminal service is starting or unavailable.");
        return false;
    }

    // ═════════════════════════════════════════════════════════════════════════
    //  PLUGIN METHODS — TERMINAL LIFECYCLE
    // ═════════════════════════════════════════════════════════════════════════

    /**
     * start({id, projectPath?, type?, rows?, cols?, execType?})
     * execType: "native" | "proot" (default native)
     */
    @PluginMethod
    public void start(PluginCall call) {
        if (!checkService(call)) return;
        call.setKeepAlive(true);

        String sessionId   = call.getString("id", "default");
        String projectPath = call.getString("projectPath", "");
        String type        = call.getString("type", "local");
        String execType    = call.getString("execType", "native");
        int rows           = call.getInt("rows", 24);
        int cols           = call.getInt("cols", 80);

        String arch = getArch();
        if (arch == null) {
            call.reject("Unsupported ABI");
            return;
        }

        new Thread(() -> {
            try {
                terminalService.startSession(sessionId, projectPath, type, arch, rows, cols, execType);
                call.resolve();
            } catch (Exception e) {
                Log.e(TAG, "start() failed", e);
                call.reject("Failed to start session: " + e.getMessage(), e);
            }
        }).start();
    }

    /** killAllSessionsOfType({ execType: "native"|"proot" }) */
    @PluginMethod
    public void killAllSessionsOfType(PluginCall call) {
        if (!checkService(call)) return;
        String execType = call.getString("execType", "");
        try {
            int n = terminalService.killAllSessionsOfType(execType);
            JSObject ret = new JSObject();
            ret.put("killed", n);
            call.resolve(ret);
        } catch (Exception e) {
            Log.e(TAG, "killAllSessionsOfType failed", e);
            call.reject("killAllSessionsOfType failed: " + e.getMessage(), e);
        }
    }

    /** getActiveExecTypes() → { types: string[] } */
    @PluginMethod
    public void getActiveExecTypes(PluginCall call) {
        if (!checkService(call)) return;
        try {
            java.util.List<String> types = terminalService.getActiveExecTypes();
            JSObject ret = new JSObject();
            com.getcapacitor.JSArray arr = new com.getcapacitor.JSArray();
            for (String t : types) arr.put(t);
            ret.put("types", arr);
            call.resolve(ret);
        } catch (Exception e) {
            call.reject("getActiveExecTypes failed: " + e.getMessage(), e);
        }
    }

    @PluginMethod
    public void createLocal(PluginCall call) {
        call.getData().put("type", "local");
        start(call);
    }

    @PluginMethod
    public void createServer(PluginCall call) {
        call.getData().put("type", "server");
        start(call);
    }

    
    
    @PluginMethod
    public void spawnLsp(PluginCall call) {
        if (!checkService(call)) return;

        // Taking Alpine-side shell command string 
        String alpineCommand = call.getString("command", "");
        if (alpineCommand.isEmpty()) { 
            call.reject("command is required"); 
            return; 
        }

        new Thread(() -> {
            try {
                int port = terminalService.spawnProcessServer(alpineCommand);
                
                JSObject ret = new JSObject();
                ret.put("port", port);
                call.resolve(ret);
            } catch (Exception e) {
                Log.e(TAG, "spawnLsp failed", e);
                call.reject("spawnLsp failed: " + e.getMessage(), e);
            }
        }, "lsp-spawn").start();
    }

    /**
     * Force-stops an LSP ProcessServer (and its language-server process).
     * Call on language switch or when the user kills the LSP output channel.
     *
     * @param port  Port returned by spawnLsp
     */
    @PluginMethod
    public void killLsp(PluginCall call) {
        if (!checkService(call)) return;

        Integer port = call.getInt("port");
        if (port == null || port <= 0) {
            call.reject("port is required");
            return;
        }

        try {
            boolean stopped = terminalService.stopProcessServer(port);
            JSObject ret = new JSObject();
            ret.put("stopped", stopped);
            ret.put("port", port);
            call.resolve(ret);
        } catch (Exception e) {
            Log.e(TAG, "killLsp failed", e);
            call.reject("killLsp failed: " + e.getMessage(), e);
        }
    }

    /** Force-stops every tracked LSP ProcessServer. */
    @PluginMethod
    public void killAllLsp(PluginCall call) {
        if (!checkService(call)) return;
        try {
            terminalService.stopAllProcessServers();
            call.resolve();
        } catch (Exception e) {
            Log.e(TAG, "killAllLsp failed", e);
            call.reject("killAllLsp failed: " + e.getMessage(), e);
        }
    }
    
    

    // ═════════════════════════════════════════════════════════════════════════
    //  PLUGIN METHODS — I/O & CONTROL
    // ═════════════════════════════════════════════════════════════════════════

    @PluginMethod
    public void write(PluginCall call) {
        if (!checkService(call)) return;
        String id   = call.getString("id", "default");
        String data = call.getString("data");
        if (data == null) { call.resolve(); return; }

        try {
            terminalService.write(id, data);
            call.resolve();
        } catch (IOException e) {
            call.reject("write failed: " + e.getMessage());
        }
    }

    @PluginMethod
    public void execute(PluginCall call) {
        if (!checkService(call)) return;
        String id      = call.getString("id", "default");
        String command = call.getString("command", "");
        if (command.isEmpty()) { call.resolve(); return; }

        try {
            terminalService.execute(id, command);
            call.resolve();
        } catch (IOException e) {
            call.reject("execute failed: " + e.getMessage());
        }
    }

    @PluginMethod
    public void backgroundExecute(PluginCall call) {
        if (!checkService(call)) return;
        call.setKeepAlive(true);
        String command   = call.getString("command", "");
        String sessionId = call.getString("sessionId", "bg_" + System.currentTimeMillis());

        if (command.isEmpty()) { call.reject("command is required"); return; }

        new Thread(() -> {
            try {
                TerminalForegroundService.BackgroundResult res = terminalService.backgroundExecute(command);
                JSObject ret = new JSObject();
                ret.put("sessionId", sessionId);
                ret.put("output",    res.output);
                ret.put("exitCode",  res.exitCode);
                call.resolve(ret);
            } catch (Exception e) {
                Log.e(TAG, "backgroundExecute error", e);
                call.reject("backgroundExecute failed: " + e.getMessage(), e);
            }
        }).start();
    }
    
    
    // Capacitor Plugin Wrapper for Streaming
    @PluginMethod
    public void streamBackgroundExecute(PluginCall call) {
        if (!checkService(call)) return;
        String command   = call.getString("command");
        String sessionId = call.getString("sessionId");
        String cwd       = call.getString("cwd");
        String execType  = call.getString("execType", "native"); // default native — was hardcoded proot before
    
        if (command == null || sessionId == null) {
            call.reject("Must provide command and sessionId"); return;
        }
    
        String arch = getArch();
        if (arch == null) {
            call.reject("Unsupported ABI");
            return;
        }
    
        new Thread(() -> {
            try {
                String[] cmd;
                Map<String, String> env;
    
                if ("proot".equals(execType)) {
                    // Legacy Alpine path — must ensure rootfs exists before using it.
                    RootfsManager rootfsMgr = new RootfsManager(getContext());
                    rootfsMgr.ensureBinaries(arch);
                    rootfsMgr.ensureRootfs(arch);
                    ProotCommandBuilder builder = new ProotCommandBuilder(
                        rootfsMgr, getContext().getApplicationInfo().nativeLibraryDir);
                    cmd = builder.buildBackgroundCommand(command);
                    env = builder.getProotEnv();
                } else {
                    // Native (Bionic + $PREFIX) — matches what the service actually preps.
                    TerminalCommandBuilder builder = new TerminalCommandBuilder(
                        new RootfsManager(getContext()),
                        getContext().getApplicationInfo().nativeLibraryDir);
                    cmd = builder.buildBackgroundCommand(command);
                    env = builder.buildBackgroundEnvMap();
                }
    
                terminalService.streamBackgroundExecute(sessionId, cmd, env, cwd,
                    new TerminalForegroundService.BackgroundProcessListener() {
                        @Override
                        public void onData(String data) {
                            JSObject ret = new JSObject();
                            ret.put("sessionId", sessionId); ret.put("data", data);
                            notifyListeners("onBackgroundData", ret);
                        }
                        @Override
                        public void onExit(int exitCode) {
                            JSObject ret = new JSObject();
                            ret.put("sessionId", sessionId); ret.put("exitCode", exitCode);
                            notifyListeners("onBackgroundExit", ret);
                        }
                    });
            } catch (Exception e) {
                Log.e(TAG, "streamBackgroundExecute setup failed", e);
                JSObject dataRet = new JSObject();
                dataRet.put("sessionId", sessionId);
                dataRet.put("data", "\n[Setup Error] " + e.getMessage() + "\n");
                notifyListeners("onBackgroundData", dataRet);
    
                JSObject exitRet = new JSObject();
                exitRet.put("sessionId", sessionId);
                exitRet.put("exitCode", -1);
                notifyListeners("onBackgroundExit", exitRet);
            }
        }, "stream-bg-setup").start();
    
        call.resolve();
    }

    @PluginMethod
    public void killBackgroundProcess(PluginCall call) {
        if (!checkService(call)) return;
        String sessionId = call.getString("sessionId");
        if (sessionId != null) terminalService.killBackgroundProcess(sessionId);
        call.resolve();
    }

    @PluginMethod
    public void resize(PluginCall call) {
        if (!checkService(call)) return;
        String id = call.getString("id", "default");
        terminalService.resize(id, call.getInt("rows", 24), call.getInt("cols", 80));
        call.resolve();
    }

    @PluginMethod
    public void sendInterrupt(PluginCall call) {
        if (!checkService(call)) return;
        String id = call.getString("id", "default");
        terminalService.sendInterrupt(id);
        call.resolve();
    }

    @PluginMethod
    public void clearTerminal(PluginCall call) {
        if (!checkService(call)) return;
        String id = call.getString("id", "default");
        try {
            terminalService.write(id, "clear\n");
        } catch (IOException ignored) {}
        call.resolve();
    }

    @PluginMethod
    public void setWorkingDir(PluginCall call) {
        if (!checkService(call)) return;
        String id   = call.getString("id", "default");
        String path = call.getString("path", "/root");
        try {
            String safePath = path.replace("'", "'\\''");
            terminalService.execute(id, "cd '" + safePath + "'");
        } catch (IOException ignored) {}
        call.resolve();
    }

    // ═════════════════════════════════════════════════════════════════════════
    //  PLUGIN METHODS — SESSION MANAGEMENT
    // ═════════════════════════════════════════════════════════════════════════

    @PluginMethod
    public void closeTerminal(PluginCall call) {
        if (!checkService(call)) return;
        String id = call.getString("id", "default");
        terminalService.closeSession(id);
        call.resolve();
    }

    @PluginMethod
    public void kill(PluginCall call) { closeTerminal(call); }

    @PluginMethod
    public void getAllIds(PluginCall call) {
        if (!checkService(call)) return;
        List<String> activeIds = terminalService.getAllSessionIds();
        JSArray arr = new JSArray();
        for (String id : activeIds) arr.put(id);
        
        JSObject ret = new JSObject();
        ret.put("ids", arr);
        call.resolve(ret);
    }

    @PluginMethod
    public void getStatus(PluginCall call) {
        if (!checkService(call)) return;
        String id = call.getString("id", "default");
        TerminalSession s = terminalService.getSession(id);
        
        JSObject ret = new JSObject();
        if (s != null) {
            ret.put("running", s.running);
            ret.put("pid",     s.childPid);
            ret.put("type",    s.type);
        } else {
            ret.put("running", false);
            ret.put("pid",     -1);
            ret.put("type",    "none");
        }
        call.resolve(ret);
    }

    // ═════════════════════════════════════════════════════════════════════════
    //  PLUGIN METHODS — CONFIGURATION
    // ═════════════════════════════════════════════════════════════════════════

    @PluginMethod
    public void setHostname(PluginCall call) {
        if (!checkService(call)) return;
        String name = call.getString("name", "mscode");
        name = name.replaceAll("[^a-zA-Z0-9\\-_]", "");
        if (name.isEmpty()) name = "mscode";

        try {
            terminalService.setHostname(name);
            call.resolve();
        } catch (IOException e) {
            call.reject("setHostname failed: " + e.getMessage());
        }
    }
}