#!/usr/bin/env python3
"""Build the smallest tree that serves the application, and prove it is complete.

    python3 tools/app/build-deploy-tree.py            # writes deploy/
    python3 tools/app/build-deploy-tree.py --zip      # and zips it

WHY A TREE AND NOT THE REPOSITORY ROOT
--------------------------------------
The application fetches three things from outside `app/`: the engine's Python
source, the canon's default configuration, and the reason-code catalogue. It
does that deliberately — an application-side copy of a canon number would be a
second owner of it — so the site root has to be the repository root, and
publishing the repository root publishes the canon, the decision ledger, the
run records and `docs/research/` along with it.

This assembles only what the app actually fetches, at the paths it fetches them
from, so what is deployed is the application and nothing else.

WHY THE FILE LIST IS DERIVED AND NOT WRITTEN DOWN HERE
------------------------------------------------------
A hand-maintained list in this file would be a second statement of "what the
app needs" and it would drift from the first one silently — which is the exact
defect this script exists to prevent.

So the list is READ from the one thing that already owns it: the PRECACHE array
in the BUILT service worker. That array is the offline shell, which is by
definition everything the app needs with no network, and `vite.config.js`
assembles it at build time from the real hashed asset names, the engine module
list parsed out of `app/src/engine/worker.js`, and the catalogue path. Reading
the built artefact rather than the source is the point: it is the only place
the hashed names exist, and a hand-written path the build renames is precisely
the defect `PORT-25` was written for.

An earlier version of this script read `SHELL_FILES` out of `app/sw.js`. That
constant no longer exists — the service worker takes its list from a
`__PRECACHE__` placeholder now — and the script failed loudly rather than
quietly shipping a partial tree, which is the behaviour intended.

IF A PATH IS MISSING FROM DISK, THIS FAILS AND SAYS WHICH. A deploy tree that
is quietly incomplete gives a blank app on a phone, which is the worst possible
way to find out.

THE ARTEFACT IS NOT COMMITTED. Same rule as `app/vendor/pyodide/` and
`app/dist/`: the script is committed, what it produces is not, so the two can
never drift apart.
"""

from __future__ import annotations

import argparse
import json
import re
import shutil
import subprocess
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
DIST = ROOT / "app" / "dist"
BUILT_SW = DIST / "app" / "sw.js"
VENDOR = ROOT / "app" / "vendor" / "pyodide"


def fail(*lines: str) -> None:
    print("DEPLOY TREE NOT BUILT")
    for line in lines:
        print(f"  {line}")
    raise SystemExit(1)


def precache_paths() -> list[str]:
    """Every path the built service worker promises to hold offline."""
    if not BUILT_SW.exists():
        fail(
            f"{BUILT_SW.relative_to(ROOT)} does not exist",
            "run `npx vite build` first — the tree is assembled from the BUILT",
            "service worker, because that is the only place the hashed asset",
            "names exist.",
        )
    text = BUILT_SW.read_text(encoding="utf8")
    match = re.search(r"const PRECACHE = (\[[\s\S]*?\]);", text)
    if not match:
        fail(
            "the built service worker declares no PRECACHE array;",
            "this script cannot derive the tree and will not guess at one.",
        )
    try:
        paths = json.loads(match.group(1))
    except json.JSONDecodeError as exc:
        fail(f"the PRECACHE array did not parse: {exc}")
        return []
    if not paths:
        fail("the PRECACHE array is empty")
    return [p.lstrip("/") for p in paths]


def source_for(rel: str) -> Path | None:
    """Where a served path lives on disk.

    Built assets come out of `app/dist`; the engine and the catalogue are served
    from the repository, unmodified, because they are the same files the
    conformance harness runs.
    """
    in_dist = DIST / rel
    if in_dist.exists():
        return in_dist
    in_repo = ROOT / rel
    if in_repo.exists():
        return in_repo
    return None


def build(out: Path) -> tuple[int, int]:
    paths = precache_paths()

    missing = [p for p in paths if source_for(p) is None]
    if missing:
        fail(
            "the app promises to hold these offline and they are not on disk:",
            *[f"  {m}" for m in missing],
        )

    if not VENDOR.exists() or not any(VENDOR.iterdir()):
        fail(
            "app/vendor/pyodide/ is empty — run `python3 tools/app/vendor-runtime.py`.",
            "Without it the engine cannot start and the app shows a tank it",
            "cannot assess.",
        )

    if out.exists():
        shutil.rmtree(out)
    out.mkdir(parents=True)

    written = 0
    for rel in paths:
        src = source_for(rel)
        dst = out / rel
        dst.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(src, dst)
        written += 1

    # The runtime, wholesale. It is fetched by name at run time rather than
    # being named in the precache list, so it is copied as a directory.
    vendor_out = out / "app" / "vendor" / "pyodide"
    shutil.copytree(VENDOR, vendor_out)
    vendored = sum(1 for p in vendor_out.rglob("*") if p.is_file())

    # A site with no entry point at its root is a site that 404s on the address
    # people actually type.
    (out / "index.html").write_text(
        '<!doctype html><meta charset="utf-8">'
        '<meta http-equiv="refresh" content="0; url=/app/">'
        "<title>Dosing Wizard</title>"
        '<a href="/app/">Dosing Wizard</a>\n',
        encoding="utf8",
    )

    # Python and Markdown are served as text, not downloaded. Without this the
    # engine's modules arrive with a Content-Type some static hosts refuse to
    # hand to `fetch`.
    (out / "_headers").write_text(
        "/engine/*\n  Content-Type: text/plain; charset=utf-8\n"
        "/docs/*\n  Content-Type: text/plain; charset=utf-8\n",
        encoding="utf8",
    )

    return written, vendored


def commit_stamp() -> str:
    try:
        sha = subprocess.check_output(
            ["git", "rev-parse", "HEAD"], cwd=ROOT, text=True
        ).strip()
        dirty = subprocess.check_output(
            ["git", "status", "--porcelain"], cwd=ROOT, text=True
        ).strip()
        return sha + (" (with uncommitted changes)" if dirty else "")
    except Exception:
        return "unknown"


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", default="deploy")
    ap.add_argument("--zip", dest="zip_path", nargs="?", const="dosing-wizard-app.zip")
    args = ap.parse_args()

    out = (ROOT / args.out).resolve()
    written, vendored = build(out)

    stamp = commit_stamp()
    # Stamped INSIDE the tree, so a zip that has been emailed, renamed, or sat
    # in a downloads folder for a week can still say which commit it is. Two
    # zips were produced in one round and the older one was deployed; an hour
    # was spent testing code that had already been fixed.
    (out / "BUILT-FROM.txt").write_text(
        f"Dosing Wizard V2\nbuilt from commit {stamp}\n", encoding="utf8"
    )

    print(f"deploy tree: {out.relative_to(ROOT)}")
    print(f"  {written} file(s) the app promises to hold offline")
    print(f"  {vendored} file(s) of Python runtime")
    print(f"  built from commit {stamp}")

    if args.zip_path:
        zip_path = (ROOT / args.zip_path).resolve()
        if zip_path.exists():
            zip_path.unlink()
        with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as zf:
            for path in sorted(out.rglob("*")):
                if path.is_file():
                    zf.write(path, path.relative_to(out))
        mb = zip_path.stat().st_size / (1024 * 1024)
        print(f"  zipped: {zip_path.relative_to(ROOT)} ({mb:.1f} MB)")


if __name__ == "__main__":
    main()
