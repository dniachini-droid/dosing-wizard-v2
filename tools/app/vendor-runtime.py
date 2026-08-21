#!/usr/bin/env python3
"""Fetch the Python runtime the application needs to run the engine on a phone.

Why this exists at all
----------------------

The Alk V2 engine is Python. The application is an installable web page. There
are exactly two ways to reconcile those, and only one of them is allowed here.

The disallowed one is to rewrite the engine in JavaScript. Canon
`MASTER RULE 1` says one owner for each inference, and that "two
implementations that agree today are a defect, not a coincidence". A hand port
of 5,700 lines of chemistry would be a second owner of every threshold in the
canon, and the day the two disagreed there would be no way to say which was
right.

So the application runs **the engine itself** — the same `engine/alk_v2`
package the conformance harness runs, byte for byte, unmodified — inside
CPython compiled to WebAssembly. `app/src/engine/worker.js` loads it. The cost
is a one-off download of about 12 MB, and that cost is the honest price of
having one owner of the chemistry rather than two.

Why the artefact is not committed
---------------------------------

This mirrors `mockups/build-single-file.py` exactly: the script is committed,
the artefact is not, so the two can never drift apart. The download is pinned
by version and verified by SHA-256, so what arrives is reproducible.

    python3 tools/app/vendor-runtime.py

Run it once. It writes `app/vendor/pyodide/` and nothing else. If you are
deploying the application somewhere, run it as part of the deploy — the
service worker cannot cache a file the server does not have.
"""

from __future__ import annotations

import hashlib
import os
import shutil
import sys
import tarfile
import tempfile
import urllib.request

# Pinned. Changing this line is a deliberate runtime upgrade, and the hash below
# must be recomputed at the same time or the download is refused.
PYODIDE_VERSION = "0.28.3"
ARCHIVE_SHA256 = "46fd28bfacd5b78333d73f171412cc992a2cab2332b067e4d2181fd255cca730"

URL = (
    "https://github.com/pyodide/pyodide/releases/download/"
    f"{PYODIDE_VERSION}/pyodide-core-{PYODIDE_VERSION}.tar.bz2"
)

# Only what the engine actually needs. The distribution also ships TypeScript
# declarations, a CLI entry point and a UMD build; none of them is served, so
# none of them is written. Each file's own SHA-256 is checked after extraction,
# so a corrupted member cannot pass on the strength of the archive hash alone.
WANTED = {
    "pyodide.mjs": "635a6da3218fe4e5668da595acfe8b5ce77453d597d602f19a423dd250653441",
    "pyodide.asm.js": "b22e5831eade9ff10e6fe2c811c68688cd91f10154377b4f80debcf5bafa1e56",
    "pyodide.asm.wasm": "5effb6a1a6cc4a1a85bec4622701aa797c031e1de923cbbaf2ad47abdc4ab325",
    "python_stdlib.zip": "71fee17f88a6260ec8c9c7c063533ee59c021fdc88a1ce76247378d3c4a35f4c",
    "pyodide-lock.json": "f6e6f42f451f42affbbcddb00e8c9a3278dcbf399f57aab9f3f568839a7ff4a6",
}

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
DEST = os.path.join(ROOT, "app", "vendor", "pyodide")


def _sha256(path: str) -> str:
    h = hashlib.sha256()
    with open(path, "rb") as fh:
        for block in iter(lambda: fh.read(1 << 20), b""):
            h.update(block)
    return h.hexdigest()


def main() -> int:
    if all(
        os.path.exists(os.path.join(DEST, name))
        and _sha256(os.path.join(DEST, name)) == want
        for name, want in WANTED.items()
    ):
        print(f"already present and verified: {DEST}")
        return 0

    with tempfile.TemporaryDirectory() as tmp:
        archive = os.path.join(tmp, "pyodide.tar.bz2")
        print(f"fetching {URL}")
        try:
            urllib.request.urlopen(URL, timeout=300)  # noqa: S310 - pinned URL
        except Exception as exc:  # noqa: BLE001 - reported, not raised
            print(f"could not reach the release: {exc}", file=sys.stderr)
            return 1
        urllib.request.urlretrieve(URL, archive)  # noqa: S310 - pinned URL

        got = _sha256(archive)
        if got != ARCHIVE_SHA256:
            print(
                "REFUSED: the download does not match the pinned hash.\n"
                f"  expected {ARCHIVE_SHA256}\n"
                f"  got      {got}\n"
                "Nothing was written.",
                file=sys.stderr,
            )
            return 1

        # `data` filter where available: a release tarball is still an archive
        # from the network and should not be able to write outside its own tree.
        with tarfile.open(archive, "r:bz2") as tf:
            try:
                tf.extractall(tmp, filter="data")
            except TypeError:  # Python < 3.12 has no filter argument
                tf.extractall(tmp)  # noqa: S202 - hash-pinned archive

        src = os.path.join(tmp, "pyodide")
        os.makedirs(DEST, exist_ok=True)
        for name, want in sorted(WANTED.items()):
            member = os.path.join(src, name)
            if not os.path.exists(member):
                print(f"REFUSED: the archive has no {name}", file=sys.stderr)
                return 1
            got = _sha256(member)
            if got != want:
                print(
                    f"REFUSED: {name} does not match its pinned hash\n"
                    f"  expected {want}\n  got      {got}",
                    file=sys.stderr,
                )
                return 1
            shutil.copy2(member, os.path.join(DEST, name))
            print(f"  wrote app/vendor/pyodide/{name}")

    print(f"\nPyodide {PYODIDE_VERSION} is in place. The application can now run the engine offline.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
