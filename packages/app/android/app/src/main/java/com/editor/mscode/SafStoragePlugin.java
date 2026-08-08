package com.editor.mscode;

import android.app.Activity;
import android.content.Intent;
import android.content.UriPermission;
import android.database.Cursor;
import android.net.Uri;
import android.provider.DocumentsContract;

import androidx.activity.result.ActivityResult;
import androidx.documentfile.provider.DocumentFile;

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
 * Lists children via DocumentFile — works for Termux, SD card, USB, etc.
 * where plain filesystem paths are not readable across app sandboxes.
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
        } catch (SecurityException ignored) {
        }

        String name = treeUri.getLastPathSegment();
        if (name == null || name.isEmpty()) name = "Storage";
        int colon = name.lastIndexOf(':');
        if (colon >= 0 && colon < name.length() - 1) {
            name = name.substring(colon + 1);
        }
        if (name.isEmpty()) name = "Storage";

        JSObject ret = new JSObject();
        ret.put("uri", treeUri.toString());
        ret.put("name", name);
        String path = tryResolvePath(treeUri);
        if (path != null) ret.put("path", path);
        // Foreign app private dirs are not readable via Filesystem plugin
        ret.put("useSaf", path == null || isForeignAppData(path));
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
            o.put("useSaf", path == null || isForeignAppData(path));
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
     * List children of a tree URI (or a child document URI under that tree).
     * @param uri  tree URI (content://.../tree/...) or document URI
     * @param childUri optional child document URI to list instead of tree root
     */
    @PluginMethod
    public void listChildren(PluginCall call) {
        String uriStr = call.getString("uri");
        String childUriStr = call.getString("childUri");
        if (uriStr == null || uriStr.isEmpty()) {
            call.reject("uri required");
            return;
        }
        try {
            DocumentFile dir;
            if (childUriStr != null && !childUriStr.isEmpty()) {
                dir = DocumentFile.fromSingleUri(getContext(), Uri.parse(childUriStr));
            } else {
                dir = DocumentFile.fromTreeUri(getContext(), Uri.parse(uriStr));
                if (dir == null) {
                    dir = DocumentFile.fromSingleUri(getContext(), Uri.parse(uriStr));
                }
            }
            if (dir == null || !dir.exists()) {
                call.reject("not_found");
                return;
            }
            if (!dir.isDirectory()) {
                call.reject("not_directory");
                return;
            }

            JSArray files = new JSArray();
            DocumentFile[] children = dir.listFiles();
            if (children != null) {
                for (DocumentFile child : children) {
                    JSObject f = new JSObject();
                    String displayName = child.getName();
                    if (displayName == null) displayName = "unnamed";
                    f.put("name", displayName);
                    f.put("isDirectory", child.isDirectory());
                    Uri cu = child.getUri();
                    String u = cu != null ? cu.toString() : "";
                    f.put("uri", u);
                    f.put("path", u);
                    files.put(f);
                }
            }
            JSObject ret = new JSObject();
            ret.put("files", files);
            call.resolve(ret);
        } catch (Exception e) {
            call.reject(e.getMessage() != null ? e.getMessage() : "list_failed");
        }
    }

    private boolean isForeignAppData(String path) {
        if (path == null) return true;
        // Another app's private data — not readable via java.io / Capacitor Filesystem
        if (path.startsWith("/data/data/") || path.startsWith("/data/user/")) {
            String pkg = getContext().getPackageName();
            return !path.contains("/" + pkg + "/");
        }
        return false;
    }

    private String tryResolvePath(Uri treeUri) {
        try {
            String docId = DocumentsContract.getTreeDocumentId(treeUri);
            if (docId == null) return null;
            try {
                docId = java.net.URLDecoder.decode(docId, "UTF-8");
            } catch (Exception ignored) {
            }

            if (docId.startsWith("/")) {
                return docId;
            }
            if (docId.startsWith("primary:")) {
                String rel = docId.substring("primary:".length());
                if (rel.isEmpty()) return "/storage/emulated/0";
                return "/storage/emulated/0/" + rel.replace(":", "/");
            }
            if (docId.startsWith("raw:")) {
                return docId.substring(4);
            }
            int colon = docId.indexOf(':');
            if (colon > 0) {
                String vol = docId.substring(0, colon);
                String rel = docId.substring(colon + 1);
                if (vol.matches("[A-Fa-f0-9-]+")) {
                    if (rel.isEmpty()) return "/storage/" + vol;
                    return "/storage/" + vol + "/" + rel.replace(":", "/");
                }
            }
        } catch (Exception ignored) {
        }
        return null;
    }
}
