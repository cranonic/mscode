#!/usr/bin/env bash
# patch-proot-talloc.sh
#
# Android jniLibs only extracts files named lib*.so (not libtalloc.so.2).
# Stock proot binaries often have DT_NEEDED = "libtalloc.so.2".
# This script rewrites that dependency to "libtalloc.so" so the sibling
# library in nativeLibraryDir resolves — same approach Acode uses.
#
# Requires: patchelf  OR  python3
set -euo pipefail

ROOT="${1:-android/app/src/main/jniLibs}"

if [[ ! -d "$ROOT" ]]; then
  echo "ERROR: jniLibs dir not found: $ROOT"
  exit 1
fi

patch_one() {
  local proot="$1"
  [[ -f "$proot" ]] || return 0

  echo "→ patching $proot"

  if command -v patchelf >/dev/null 2>&1; then
    if patchelf --print-needed "$proot" 2>/dev/null | grep -qx 'libtalloc.so.2'; then
      patchelf --replace-needed libtalloc.so.2 libtalloc.so "$proot"
      echo "  patchelf: libtalloc.so.2 → libtalloc.so"
    else
      echo "  already OK (needed: $(patchelf --print-needed "$proot" | tr '\n' ' '))"
    fi
    return
  fi

  # Fallback: in-place binary rewrite (same length: pad with NUL)
  # "libtalloc.so.2" is 14 bytes; "libtalloc.so\0\0" is also 14 bytes
  python3 - "$proot" <<'PY'
import sys
path = sys.argv[1]
data = open(path, "rb").read()
old = b"libtalloc.so.2"
new = b"libtalloc.so\x00\x00"
if old not in data:
    print("  no libtalloc.so.2 string found (already patched or static?)")
    sys.exit(0)
data = data.replace(old, new)
open(path, "wb").write(data)
print("  python: replaced libtalloc.so.2 → libtalloc.so\\0\\0")
PY
}

found=0
while IFS= read -r -d '' f; do
  patch_one "$f"
  found=1
done < <(find "$ROOT" -type f -name 'libproot.so' -print0)

if [[ $found -eq 0 ]]; then
  echo "WARNING: no libproot.so under $ROOT"
  exit 1
fi

echo
echo "Verify each ABI also has libtalloc.so next to libproot.so:"
find "$ROOT" -type f \( -name 'libproot.so' -o -name 'libtalloc.so' \) | sort
echo "Done."
