package com.editor.mscode;

import android.app.Activity;
import android.content.Intent;
import android.content.UriPermission;
import android.database.Cursor;
import android.net.Uri;
import android.os.Build;
import android.provider.DocumentsContract;
import android.provider.OpenableColumns;

import androidx.activity.result.ActivityResult;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.ActivityCallback;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.util.List;

/**
 * Android Storage Access Framework (Document Tree) bridge.
 * Lets the user pick any storage location (SD card, USB, Downloads, …)
 * and persists the grant so MS Code can list/open files later.
 */
@CapacitorPlugin(name = "SafStorage")
public class SafStoragePlugin extends Plugin {

    @PluginMethod
    public void openDocumentTree(PluginCall call) {
        Intent intent = new Intent(Intent.ACTION_OPEN_DOCUMENT_TREE);
        intent.addFlags(
            Intent.FLAG_GRANT_READ_URI_PERMISSION
                | Intent.FLAG_GRANT_WRITE_URI_PERMISSION
                | Intent.FLAG_GRANT_PERSISTABLE_URI_PERMISSION
                | Intent.FLAG_GRANT_PREFIX_URI_PERMISSION
        );
        startActivityForResult(call, intent, "documentTreeResult");
    }

    @ActivityCallback
    private void documentTreeResult(PluginCall call, ActivityResult result) {
        if (call == null) return;

        if (result.getResultCode() != Activity.RESULT_OK || result.getData() == null) {
            call.reject("cancelled");
            return;
        }

        Uri treeUri = result.getData().getData();
        if (treeUri == null) {
            call.reject("no_uri");
            return;
        }

        final int takeFlags =
            (result.getData().getFlags()
                & (Intent.FLAG_GRANT_READ_URI_PERMISSION | Intent.FLAG_GRANT_WRITE_URI_PERMISSION));

        try {
            getContext().getContentResolver().takePersistableUriPermission(treeUri, takeFlags);
        } catch (SecurityException e) {
            // Still return the URI — may work for this session
        }

        String name = treeUri.getLastPathSegment();
        if (name == null || name.isEmpty()) name = "Storage";
        // "primary:Download" → "Download"
        int colon = name.lastIndexOf(':');
        if (colon >= 0 && colon < name.length() - 1) {
            name = name.substring(colon + 1);
        }
        if (name.isEmpty()) name = "Storage";

        JSObject ret = new JSObject();
        ret.put("uri", treeUri.toString());
        ret.put("name", name);
        // Best-effort real path (often null for non-primary volumes)
        String path = tryResolvePath(treeUri);
        if (path != null) ret.put("path", path);
        call.resolve(ret);
    }

    @PluginMethod
    public void listPersistedTrees(PluginCall call) {
        JSArray arr = new JSArray();
        List<UriPermission> perms = getContext().getContentResolver().getPersistedUriPermissions();
        for (UriPermission p : perms) {
            if (!p.isReadPermission()) continue;
            Uri u = p.getUri();
            JSObject o = new JSObject();
            o.put("uri", u.toString());
            String name = u.getLastPathSegment();
            if (name == null) name = "Storage";
            int colon = name.lastIndexOf(':');
            if (colon >= 0 && colon < name.length() - 1) name = name.substring(colon + 1);
            o.put("name", name);
            String path = tryResolvePath(u);
            if (path != null) o.put("path", path);
            arr.put(o);
        }
        JSObject ret = new JSObject();
        ret.put("trees", arr);
        call.resolve(ret);
    }

    @PluginMethod
    public void releaseTree(PluginCall call) {
        String uriStr = call.getString("uri");
        if (uriStr == null) {
            call.reject("uri required");
            return;
        }
        try {
            Uri uri = Uri.parse(uriStr);
            getContext().getContentResolver().releasePersistableUriPermission(
                uri,
                Intent.FLAG_GRANT_READ_URI_PERMISSION | Intent.FLAG_GRANT_WRITE_URI_PERMISSION
            );
            call.resolve();
        } catch (Exception e) {
            call.reject(e.getMessage());
        }
    }

    /**
     * Try to map a tree URI to a filesystem path (works for primary external storage).
     */
    private String tryResolvePath(Uri treeUri) {
        try {
            String docId = DocumentsContract.getTreeDocumentId(treeUri);
            if (docId == null) return null;
            // primary:Foo → /storage/emulated/0/Foo
            if (docId.startsWith("primary:")) {
                String rel = docId.substring("primary:".length());
                if (rel.isEmpty()) return "/storage/emulated/0";
                return "/storage/emulated/0/" + rel.replace(":", "/");
            }
            // raw:/storage/XXXX-XXXX/...
            if (docId.startsWith("raw:")) {
                return docId.substring(4);
            }
            // XXXX-XXXX:path → /storage/XXXX-XXXX/path
            int colon = docId.indexOf(':');
            if (colon > 0) {
                String vol = docId.substring(0, colon);
                String rel = docId.substring(colon + 1);
                if (vol.matches("[A-Fa-f0-9-]+")) {
                    if (rel.isEmpty()) return "/storage/" + vol;
                    return "/storage/" + vol + "/" + rel.replace(":", "/");
                }
            }
        } catch (Exception ignored) {}
        return null;
    }
}
