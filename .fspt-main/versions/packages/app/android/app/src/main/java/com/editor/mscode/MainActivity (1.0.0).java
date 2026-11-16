package com.editor.mscode; 

import android.os.Bundle;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.os.Environment;
import android.provider.Settings;
import com.getcapacitor.BridgeActivity;
import android.webkit.WebSettings;
import android.webkit.WebStorage; 
import android.widget.Toast;      
import java.io.File;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        // Native Search Plugin Register
        registerPlugin(NativeSearchPlugin.class);
        registerPlugin(NativeTerminalPlugin.class);
        registerPlugin(SafStoragePlugin.class);

        super.onCreate(savedInstanceState);

        // ─── EMERGENCY RESET LOGIC ───
        Intent intent = getIntent();
        if (intent != null && "com.editor.mscode.RESET_IDE".equals(intent.getAction())) {
            clearIDEState();
            Toast.makeText(this, "IDE State & Filesystem Reset Successful", Toast.LENGTH_LONG).show();
        }
        // ─────────────────────────────

        if (this.bridge != null && this.bridge.getWebView() != null) {
            this.bridge.getWebView().getSettings()
                .setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);
        }

        // Android 11+ All Files Access
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            if (!Environment.isExternalStorageManager()) {
                try {
                    Intent accessIntent = new Intent(Settings.ACTION_MANAGE_APP_ALL_FILES_ACCESS_PERMISSION);
                    accessIntent.addCategory("android.intent.category.DEFAULT");
                    accessIntent.setData(Uri.parse(String.format("package:%s", getApplicationContext().getPackageName())));
                    startActivity(accessIntent);
                } catch (Exception e) {
                    Intent fallbackIntent = new Intent();
                    fallbackIntent.setAction(Settings.ACTION_MANAGE_ALL_FILES_ACCESS_PERMISSION);
                    startActivity(fallbackIntent);
                }
            }
        }
    }

    /**
     * Wipes LocalStorage, IndexedDB, and Capacitor Directory.Data ('storage' folder)
     */
    private void clearIDEState() {
        try {
            // 1. Clear Web Data (IndexedDB, LocalStorage, WebSQL)
            WebStorage.getInstance().deleteAllData();
            
            // 2. Clear Capacitor SharedPreferences
            getSharedPreferences("CapacitorStorage", MODE_PRIVATE).edit().clear().apply();
            
            // 3. Clear WebView Cache and History
            if (this.bridge != null && this.bridge.getWebView() != null) {
                this.bridge.getWebView().clearCache(true);
                this.bridge.getWebView().clearHistory();
            }

            // 4. Clear Capacitor Filesystem (Directory.Data -> 'storage' folder)
            // This matches the paths in your storageService.ts (e.g. 'storage/globalState.json')
            File filesDir = getFilesDir(); // Android's equivalent to Capacitor's Directory.Data
            File storageDir = new File(filesDir, "storage");
            
            if (storageDir.exists()) {
                deleteRecursive(storageDir);
            }
            
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    /**
     * Helper method to recursively delete a directory and all its contents
     */
    private void deleteRecursive(File fileOrDirectory) {
        if (fileOrDirectory.isDirectory()) {
            File[] children = fileOrDirectory.listFiles();
            if (children != null) {
                for (File child : children) {
                    deleteRecursive(child);
                }
            }
        }
        fileOrDirectory.delete();
    }
}