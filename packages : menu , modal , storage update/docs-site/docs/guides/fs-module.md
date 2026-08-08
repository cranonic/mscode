# File System (fs)

The `fs` module provides full, platform-agnostic access to the file system. Under the hood, this module dynamically delegates operations to the platform-specific file system implementation (e.g., `AndroidFileSystem` on physical devices, or `WebFileSystem` in the browser). This ensures that extension developers can write file manipulation code once, and it will execute seamlessly across all environments supported by Mono Studio Code.

To use the file system API, import `fs` directly from the `mscode` module.

## Interfaces

### FileStat

Represents basic metadata about a file or directory.

```typescript
interface FileStat {
  name: string;
  path: string;
  isDirectory: boolean;
}

```

### WriteOptions

Options to configure file writing behavior.

```typescript
interface WriteOptions {
  /** Create intermediate directories if they do not exist (default: true) */
  recursive?: boolean;
}

```

### CopyOptions

Options to configure copy operations.

```typescript
interface CopyOptions {
  /** Overwrite the destination if it already exists (default: true) */
  overwrite?: boolean;
}

```

---

## Reading Files & Directories

### readDir

Lists the entries inside a specified directory. Returns an empty array (and does not throw) if the path does not exist.

**Signature:**

```typescript
readDir(path: string): Promise<FileStat[]>

```

**Example:**

```typescript
import { fs, workspace } from '@mscode/api';

export async function activate(context) {
    const workspaceUri = workspace.workspaceFolders?.[0]?.uri;
    if (!workspaceUri) return;

    const entries = await fs.readDir(workspaceUri.fsPath);
    const tsFiles = entries.filter(e => !e.isDirectory && e.name.endsWith('.ts'));
    
    console.log(`Found ${tsFiles.length} TypeScript files in the root.`);
}

```

### readFile

Reads a file's content and returns it as a UTF-8 encoded string.

**Signature:**

```typescript
readFile(path: string): Promise<string>

```

**Example:**

```typescript
import { fs } from '@mscode/api';

const filePath = '/sdcard/project/src/main.ts';
const code = await fs.readFile(filePath);
console.log(code);

```

### readJson

Reads a file and immediately parses it as a JSON object. This method will throw a descriptive error if the file is missing or contains malformed JSON data.

**Signature:**

```typescript
readJson<T = unknown>(path: string): Promise<T>

```

**Example:**

```typescript
import { fs, window } from '@mscode/api';

interface ExtensionConfig {
    theme: string;
    strictMode: boolean;
}

try {
    const config = await fs.readJson<ExtensionConfig>('/sdcard/project/.myextrc');
    console.log(`Theme is set to: ${config.theme}`);
} catch (error) {
    window.showErrorMessage(`Config error: ${error.message}`);
}

```

### walk

Recursively lists ALL files under a specified directory. This method omits directory paths from the final array and only returns the absolute paths of standard files. It is highly useful for walking a project tree or building file search indices.

**Signature:**

```typescript
walk(dirPath: string): Promise<string[]>

```

**Example:**

```typescript
import { fs } from '@mscode/api';

const allFiles = await fs.walk('/sdcard/project/src');
const allTsPaths = allFiles.filter(path => path.endsWith('.ts'));

```

---

## Writing Files & Directories

### writeFile

Writes a UTF-8 string to a file, overwriting it if it already exists. By default, parent directories are created automatically if they do not exist.

**Signature:**

```typescript
writeFile(path: string, content: string, options?: WriteOptions): Promise<void>

```

**Example:**

```typescript
import { fs, window } from '@mscode/api';

const outPath = '/sdcard/project/dist/bundle.js';
const compiledCode = 'console.log("Hello World");';

await fs.writeFile(outPath, compiledCode);
window.showInformationMessage('Build successful!');

```

### writeJson

Serializes a JavaScript value to a formatted JSON string and writes it to the specified file.

**Signature:**

```typescript
writeJson(path: string, value: unknown, indent?: number): Promise<void>

```

**Parameters:**

* **path** (`string`): The destination file path.
* **value** (`unknown`): The JavaScript object or array to serialize.
* **indent** (`number`): The number of spaces to use for indentation. Defaults to 2.

**Example:**

```typescript
import { fs } from '@mscode/api';

const userSettings = {
    theme: 'dark',
    fontSize: 14,
    wordWrap: true
};

await fs.writeJson('/sdcard/project/.settings.json', userSettings, 4);

```

### mkdir

Creates a directory. Missing parent directories are created automatically recursively.

**Signature:**

```typescript
mkdir(path: string): Promise<void>

```

**Example:**

```typescript
import { fs } from '@mscode/api';

await fs.mkdir('/sdcard/project/dist/assets/images');

```

---

## File System Manipulation

### rename

Renames or moves a file or directory.

**Signature:**

```typescript
rename(oldPath: string, newPath: string): Promise<void>

```

**Example:**

```typescript
import { fs } from '@mscode/api';

await fs.rename(
    '/sdcard/project/src/oldName.ts', 
    '/sdcard/project/src/newName.ts'
);

```

### copy

Recursively copies a file or directory. On native platforms like Android, this handles copying non-empty directories and all underlying nested structures correctly.

**Signature:**

```typescript
copy(fromPath: string, toPath: string, options?: CopyOptions): Promise<void>

```

**Example:**

```typescript
import { fs } from '@mscode/api';

await fs.copy('/sdcard/project/src', '/sdcard/project/src-backup', {
    overwrite: true
});

```

### delete

Recursively deletes a file or directory. This method silently succeeds (does not throw an error) if the target path does not exist.

**Signature:**

```typescript
delete(path: string): Promise<void>

```

**Example:**

```typescript
import { fs, commands, window } from '@mscode/api';

commands.registerCommand('myExt.cleanDist', async () => {
    await fs.delete('/sdcard/project/dist');
    window.showInformationMessage('Dist folder cleaned.');
});

```

---

## Metadata and Validation

### exists

Checks whether a specific path exists on the file system (applies to both files and directories).

**Signature:**

```typescript
exists(path: string): Promise<boolean>

```

**Example:**

```typescript
import { fs, commands } from '@mscode/api';

const gitFolderPath = '/sdcard/project/.git';
const isGitRepo = await fs.exists(gitFolderPath);

if (isGitRepo) {
    commands.executeCommand('git.refresh');
}

```

### stat

Returns basic metadata (`FileStat`) for a path without reading its entire content. Returns `null` if the path does not exist.

**Signature:**

```typescript
stat(path: string): Promise<FileStat | null>

```

**Example:**

```typescript
import { fs } from '@mscode/api';

const targetPath = '/sdcard/project/assets';
const stat = await fs.stat(targetPath);

if (stat) {
    if (stat.isDirectory) {
        console.log(`Directory confirmed: ${stat.name}`);
    } else {
        console.log(`File confirmed: ${stat.name}`);
    }
} else {
    console.log('Path does not exist.');
}

```