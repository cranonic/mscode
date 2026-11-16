package com.editor.mscode;

import android.app.Activity;
import android.content.ContentResolver;
import android.content.Intent;
import android.content.UriPermission;
import android.database.Cursor;
import android.net.Uri;
import android.provider.DocumentsContract;

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
 * Uses DocumentsContract only (no androidx.documentfile dependency).
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
     * List children via DocumentsContract (works for Termux / SD / USB trees).
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
            Uri input = Uri.parse(
                childUriStr != null && !childUriStr.isEmpty() ? childUriStr : uriStr
            );
            Uri treeUri = findTreeUri(input);
            if (treeUri == null) {
                treeUri = input;
            }

            String docId;
            String path = input.getPath();
            if (path != null && path.contains("/document/")) {
                docId = extractDocumentId(input);
            } else if (DocumentsContract.isTreeUri(input)) {
                docId = DocumentsContract.getTreeDocumentId(input);
            } else {
                docId = extractDocumentId(input);
                if (docId == null) {
                    docId = DocumentsContract.getTreeDocumentId(treeUri);
                }
            }

            if (docId == null) {
                call.reject("no_doc_id");
                return;
            }

            Uri childrenUri = DocumentsContract.buildChildDocumentsUriUsingTree(treeUri, docId);
            ContentResolver resolver = getContext().getContentResolver();

            String[] projection = new String[] {
                DocumentsContract.Document.COLUMN_DOCUMENT_ID,
                DocumentsContract.Document.COLUMN_DISPLAY_NAME,
                DocumentsContract.Document.COLUMN_MIME_TYPE
            };

            JSArray files = new JSArray();
            Cursor cursor = resolver.query(childrenUri, projection, null, null, null);
            if (cursor != null) {
                try {
                    int idIdx = cursor.getColumnIndex(DocumentsContract.Document.COLUMN_DOCUMENT_ID);
                    int nameIdx = cursor.getColumnIndex(DocumentsContract.Document.COLUMN_DISPLAY_NAME);
                    int mimeIdx = cursor.getColumnIndex(DocumentsContract.Document.COLUMN_MIME_TYPE);
                    while (cursor.moveToNext()) {
                        String childDocId = idIdx >= 0 ? cursor.getString(idIdx) : null;
                        String displayName = nameIdx >= 0 ? cursor.getString(nameIdx) : "unnamed";
                        String mime = mimeIdx >= 0 ? cursor.getString(mimeIdx) : null;
                        boolean isDir = DocumentsContract.Document.MIME_TYPE_DIR.equals(mime);

                        Uri childUri = childDocId != null
                            ? DocumentsContract.buildDocumentUriUsingTree(treeUri, childDocId)
                            : null;

                        JSObject f = new JSObject();
                        f.put("name", displayName != null ? displayName : "unnamed");
                        f.put("isDirectory", isDir);
                        String u = childUri != null ? childUri.toString() : "";
                        f.put("uri", u);
                        f.put("path", u);
                        files.put(f);
                    }
                } finally {
                    cursor.close();
                }
            }

            JSObject ret = new JSObject();
            ret.put("files", files);
            call.resolve(ret);
        } catch (Exception e) {
            call.reject(e.getMessage() != null ? e.getMessage() : "list_failed");
        }
    }

    private Uri findTreeUri(Uri input) {
        if (input == null) return null;
        try {
            if (DocumentsContract.isTreeUri(input)) {
                String treeId = DocumentsContract.getTreeDocumentId(input);
                return DocumentsContract.buildTreeDocumentUri(input.getAuthority(), treeId);
            }
        } catch (Exception ignored) {
        }
        List<UriPermission> perms = getContext().getContentResolver().getPersistedUriPermissions();
        for (UriPermission p : perms) {
            if (!p.isReadPermission()) continue;
            Uri tree = p.getUri();
            if (tree == null) continue;
            if (tree.getAuthority() != null && tree.getAuthority().equals(input.getAuthority())) {
                return tree;
            }
        }
        return null;
    }

    private String extractDocumentId(Uri uri) {
        try {
            return DocumentsContract.getDocumentId(uri);
        } catch (Exception ignored) {
        }
        try {
            List<String> segs = uri.getPathSegments();
            for (int i = 0; i < segs.size() - 1; i++) {
                if ("document".equals(segs.get(i))) {
                    return segs.get(i + 1);
                }
            }
            if (DocumentsContract.isTreeUri(uri)) {
                return DocumentsContract.getTreeDocumentId(uri);
            }
        } catch (Exception ignored) {
        }
        return null;
    }


    /**
     * Open a file with the system "Open with" chooser (ACTION_VIEW).
     * Accepts either a filesystem path (via FileProvider) or a content:// URI.
     */
    @PluginMethod
    public void openWith(PluginCall call) {
        String path = call.getString("path");
        String uriStr = call.getString("uri");
        try {
            android.net.Uri uri;
            String mime = "*/*";
            if (uriStr != null && uriStr.startsWith("content://")) {
                uri = android.net.Uri.parse(uriStr);
            } else if (path != null && !path.isEmpty()) {
                java.io.File file = new java.io.File(path);
                if (!file.exists()) {
                    call.reject("file_not_found");
                    return;
                }
                String authority = getContext().getPackageName() + ".fileprovider";
                uri = androidx.core.content.FileProvider.getUriForFile(getContext(), authority, file);
                mime = mimeFromName(file.getName());
            } else {
                call.reject("path or uri required");
                return;
            }

            Intent intent = new Intent(Intent.ACTION_VIEW);
            intent.setDataAndType(uri, mime);
            intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            Intent chooser = Intent.createChooser(intent, "Open with");
            chooser.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getContext().startActivity(chooser);
            call.resolve();
        } catch (Exception e) {
            call.reject(e.getMessage() != null ? e.getMessage() : "open_with_failed");
        }
    }

    /**
     * Copy a content:// document (or tree child) to a real filesystem path.
     * Used by compress staging for Termux / SAF sources the shell cannot read.
     *
     * Args: uri (content://), destPath (absolute file path), recursive (bool, dirs).
     */
    @PluginMethod
    public void copyUriToPath(PluginCall call) {
        String uriStr = call.getString("uri");
        String destPath = call.getString("destPath");
        boolean recursive = call.getBoolean("recursive", true);
        if (uriStr == null || uriStr.isEmpty() || destPath == null || destPath.isEmpty()) {
            call.reject("uri and destPath required");
            return;
        }
        try {
            Uri input = Uri.parse(uriStr);
            java.io.File dest = new java.io.File(destPath);
            java.io.File parent = dest.getParentFile();
            if (parent != null && !parent.exists()) {
                //noinspection ResultOfMethodCallIgnored
                parent.mkdirs();
            }
            copyUriRecursive(input, dest, recursive);
            JSObject ret = new JSObject();
            ret.put("path", dest.getAbsolutePath());
            ret.put("ok", true);
            call.resolve(ret);
        } catch (Exception e) {
            call.reject(e.getMessage() != null ? e.getMessage() : "copy_failed");
        }
    }

    private void copyUriRecursive(Uri input, java.io.File dest, boolean recursive)
            throws Exception {
        ContentResolver resolver = getContext().getContentResolver();
        String mime = null;
        try {
            mime = resolver.getType(input);
        } catch (Exception ignored) {
        }
        boolean isDir = DocumentsContract.Document.MIME_TYPE_DIR.equals(mime);

        if (!isDir) {
            // Probe: directories sometimes report null mime
            try {
                Uri treeUri = findTreeUri(input);
                if (treeUri != null) {
                    String docId = extractDocumentId(input);
                    if (docId == null && DocumentsContract.isTreeUri(input)) {
                        docId = DocumentsContract.getTreeDocumentId(input);
                    }
                    if (docId != null) {
                        Uri childrenUri =
                            DocumentsContract.buildChildDocumentsUriUsingTree(treeUri, docId);
                        Cursor c = resolver.query(
                            childrenUri,
                            new String[]{DocumentsContract.Document.COLUMN_DOCUMENT_ID},
                            null, null, null
                        );
                        if (c != null) {
                            try {
                                if (c.getCount() >= 0 && mime == null) {
                                    // has children query success with null mime → treat as dir if count works
                                }
                            } finally {
                                c.close();
                            }
                        }
                    }
                }
            } catch (Exception ignored) {
            }
        }

        if (DocumentsContract.Document.MIME_TYPE_DIR.equals(mime) || (isDir && recursive)) {
            //noinspection ResultOfMethodCallIgnored
            dest.mkdirs();
            Uri treeUri = findTreeUri(input);
            if (treeUri == null) treeUri = input;
            String docId = extractDocumentId(input);
            if (docId == null) {
                try {
                    docId = DocumentsContract.getTreeDocumentId(treeUri);
                } catch (Exception ignored) {
                }
            }
            if (docId == null) {
                throw new Exception("cannot list directory: " + input);
            }
            Uri childrenUri = DocumentsContract.buildChildDocumentsUriUsingTree(treeUri, docId);
            Cursor cursor = resolver.query(
                childrenUri,
                new String[]{
                    DocumentsContract.Document.COLUMN_DOCUMENT_ID,
                    DocumentsContract.Document.COLUMN_DISPLAY_NAME,
                    DocumentsContract.Document.COLUMN_MIME_TYPE
                },
                null, null, null
            );
            if (cursor != null) {
                try {
                    int idIdx = cursor.getColumnIndex(DocumentsContract.Document.COLUMN_DOCUMENT_ID);
                    int nameIdx = cursor.getColumnIndex(DocumentsContract.Document.COLUMN_DISPLAY_NAME);
                    int mimeIdx = cursor.getColumnIndex(DocumentsContract.Document.COLUMN_MIME_TYPE);
                    while (cursor.moveToNext()) {
                        String childDocId = idIdx >= 0 ? cursor.getString(idIdx) : null;
                        String name = nameIdx >= 0 ? cursor.getString(nameIdx) : "unnamed";
                        String childMime = mimeIdx >= 0 ? cursor.getString(mimeIdx) : null;
                        if (childDocId == null) continue;
                        Uri childUri = DocumentsContract.buildDocumentUriUsingTree(treeUri, childDocId);
                        java.io.File childDest = new java.io.File(dest, name != null ? name : "unnamed");
                        if (DocumentsContract.Document.MIME_TYPE_DIR.equals(childMime)) {
                            if (recursive) copyUriRecursive(childUri, childDest, true);
                        } else {
                            copyStream(resolver, childUri, childDest);
                        }
                    }
                } finally {
                    cursor.close();
                }
            }
            return;
        }

        // Single file
        copyStream(resolver, input, dest);
    }

    private void copyStream(ContentResolver resolver, Uri src, java.io.File dest) throws Exception {
        java.io.InputStream in = null;
        java.io.OutputStream out = null;
        try {
            try {
                in = resolver.openInputStream(src);
            } catch (Exception e) {
                throw new Exception(
                    "SAF read failed for " + src + ": " + e.getMessage()
                        + " (re-grant folder via Add Storage)",
                    e
                );
            }
            if (in == null) {
                throw new Exception(
                    "SAF openInputStream null for " + src
                        + " (re-grant folder via Add Storage)"
                );
            }
            java.io.File parent = dest.getParentFile();
            if (parent != null && !parent.exists()) {
                //noinspection ResultOfMethodCallIgnored
                boolean ok = parent.mkdirs();
                if (!ok && !parent.exists()) {
                    throw new Exception(
                        "Cannot create stage dir: " + parent.getAbsolutePath()
                    );
                }
            }
            try {
                out = new java.io.FileOutputStream(dest);
            } catch (Exception e) {
                throw new Exception(
                    "Cannot write stage file " + dest.getAbsolutePath()
                        + ": " + e.getMessage(),
                    e
                );
            }
            byte[] buf = new byte[64 * 1024];
            int n;
            while ((n = in.read(buf)) >= 0) {
                out.write(buf, 0, n);
            }
            out.flush();
        } finally {
            try { if (in != null) in.close(); } catch (Exception ignored) {}
            try { if (out != null) out.close(); } catch (Exception ignored) {}
        }
    }

    private String mimeFromName(String name) {
        String lower = name != null ? name.toLowerCase() : "";
        if (lower.endsWith(".pdf")) return "application/pdf";
        if (lower.endsWith(".png")) return "image/png";
        if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
        if (lower.endsWith(".gif")) return "image/gif";
        if (lower.endsWith(".webp")) return "image/webp";
        if (lower.endsWith(".mp4")) return "video/mp4";
        if (lower.endsWith(".mp3")) return "audio/mpeg";
        if (lower.endsWith(".txt") || lower.endsWith(".md") || lower.endsWith(".log")) return "text/plain";
        if (lower.endsWith(".html") || lower.endsWith(".htm")) return "text/html";
        if (lower.endsWith(".json")) return "application/json";
        if (lower.endsWith(".xml")) return "text/xml";
        if (lower.endsWith(".zip")) return "application/zip";
        if (lower.endsWith(".apk")) return "application/vnd.android.package-archive";
        return "*/*";
    }

    private boolean isForeignAppData(String path) {
        if (path == null) return true;
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
