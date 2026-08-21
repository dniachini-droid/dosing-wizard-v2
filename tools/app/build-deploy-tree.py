#!/usr/bin/env python3
"""Build the smallest tree that serves the application, and prove it is complete.

WHY A TREE AND NOT THE REPOSITORY ROOT
--------------------------------------
The application fetches three things from outside `app/`: the engine's Python
source, the canon's default configuration, and the reason-code catalogue. It
does that deliberately — an application-side copy of a canon number would be a
second owner of it — so the site root has to be the repository root, and
publishing the repository root publishes the canon, the decision ledger, the
run records and `docs/research/` along with it.

This assembles only what the app actually fetches, at the paths it fetches them
from, so the deployed site is the application and nothing else.

WHY THE FILE LIST IS DERIVED AND NOT WRITTEN DOWN HERE
------------------------------------------------------
A hand-maintained list in this file would be a second statement of "what the
app needs", and it would drift from the first one silently — which is the exact
defect this script exists to prevent. So the list is READ from the things that
already own it:

    app/sw.js                   SHELL_FILES and ENGINE_FILES — the offline
                                shell, which is by definition everything the
                                app needs with no network
    app/manifest.webmanifest    the icons
    app/index.html              its own stylesheets, icons and entry module
    app/vendor/pyodide/         the vendored runtime, wholesale

If a path any of those name is missing from disk, this FAILS and says which.
A deploy tree that is quietly incomplete gives a blank app on a phone, which is
the worst possible way to find out.

USAGE
    python3 tools/app/build-deploy-tree.py [--out deploy]
    python3 tools/app/build-deploy-tree.py --check https://example.pages.dev
"""

import argparse
import json
import re
import shutil
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent.parent
APP = ROOT / "app"

# WHAT MAY BE PUBLISHED. An allowlist, and deliberately not a blocklist.
#
# The first version of this checked that nothing under `docs/` beyond two files
# was included. Adding `../DECISIONS.md` to the service worker's list walked
# straight past it — the decision ledger is not under `docs/`, so the check
# that was there to prevent exactly this did not look at it. A blocklist only
# stops what somebody thought of.
#
# So: a required path is permitted if it is under one of these prefixes or is
# one of these exact files, and the build stops otherwise. This tree becomes a
# public URL. The repository holds the canon, the decision ledger, run records
# and research marked NON-AUTHORITATIVE — UNDER REVIEW. Widening this is a
# disclosure decision and belongs to the owner, not to a build script.
ALLOWED_PREFIXES = ("app/", "engine/alk_v2/")
ALLOWED_FILES = {
    "docs/implementation/alk-v2/ALK-V2-REASON-CODES.md",
    "docs/implementation/alk-v2/fixtures/config-defaults.json",
}


def permitted(rel: str) -> bool:
    return rel.startswith(ALLOWED_PREFIXES) or rel in ALLOWED_FILES


class Incomplete(Exception):
    """A path the application fetches is not on disk."""


def read(path: Path) -> str:
    if not path.exists():
        raise Incomplete(f"{path.relative_to(ROOT)} is missing — nothing can be derived from it")
    return path.read_text(encoding="utf-8")


def required_paths() -> list[str]:
    """Every path the app fetches, relative to the repository root."""
    needed: list[str] = []

    def add(ref: str, base: Path) -> None:
        resolved = (base / ref).resolve()
        try:
            rel = resolved.relative_to(ROOT).as_posix()
        except ValueError:
            raise Incomplete(f"{ref} resolves outside the repository, to {resolved}")
        if rel not in needed:
            needed.append(rel)

    # 1. The offline shell, which is the authoritative statement of what the app
    #    needs with no network. Both tiers: the shell is precached atomically,
    #    the runtime in the background, and a deploy needs both.
    sw = read(APP / "sw.js")
    for block in ("SHELL_FILES", "ENGINE_FILES"):
        m = re.search(block + r"\s*=\s*\[(.*?)\n\];", sw, re.S)
        if not m:
            raise Incomplete(f"app/sw.js no longer declares {block}; this script cannot derive the tree")
        refs = re.findall(r'"((?:\./|\.\./)[^"]+)"', m.group(1))
        if not refs:
            raise Incomplete(f"app/sw.js declares {block} but it is empty")
        for ref in refs:
            add(ref, APP)

    # 2. The icons. `index.html` and the manifest name them; the service worker
    #    now precaches them too, but this reads the references rather than the
    #    cache list so the two are checked against each other rather than
    #    trusted to agree.
    manifest = json.loads(read(APP / "manifest.webmanifest"))
    for icon in manifest.get("icons", []):
        add(icon["src"], APP)
    add("manifest.webmanifest", APP)

    html = read(APP / "index.html")
    for ref in re.findall(r'(?:src|href)="([^":]+)"', html):
        add(ref, APP)
    add("index.html", APP)

    # 3. The service worker itself.
    #
    #    It is not in its own precache list — a service worker does not cache
    #    itself — and `index.html` does not reference it, because `main.js`
    #    registers it at run time. So nothing above names it, and the first
    #    version of this script built a tree without it: the app loaded and
    #    ran, and could never install or work offline, which is the whole
    #    point of deploying it to a phone. Found by running the browser smoke
    #    against the tree, not by reading it.
    #
    #    Read from the registration call rather than written down here, so
    #    moving or renaming it cannot leave this behind.
    main_js = read(APP / "src" / "main.js")
    reg = re.search(r'register\(\s*new URL\(\s*"([^"]+)"', main_js)
    if not reg:
        raise Incomplete(
            "app/src/main.js no longer registers a service worker in a shape this "
            "script can read. The deploy tree cannot be trusted to be installable; "
            "fix the pattern here rather than hardcoding the path."
        )
    add(reg.group(1), APP / "src")

    # 4. The vendored runtime, wholesale. `sw.js` names five files; Pyodide may
    #    ask for more at run time, and the fetch handler's runtime tier exists
    #    precisely because it might. Shipping the directory costs nothing and
    #    removes a guess.
    vendor = APP / "vendor" / "pyodide"
    if not vendor.is_dir():
        raise Incomplete(
            "app/vendor/pyodide/ is not present.\n"
            "  It is deliberately not in git. Run:  python3 tools/app/vendor-runtime.py"
        )
    for f in sorted(vendor.rglob("*")):
        if f.is_file():
            add(f.relative_to(APP).as_posix(), APP)

    return needed


def check_on_disk(needed: list[str]) -> None:
    missing = [p for p in needed if not (ROOT / p).is_file()]
    if missing:
        raise Incomplete(
            "these paths are fetched by the application and are not on disk:\n"
            + "".join(f"    {p}\n" for p in missing)
        )

    leaked = sorted(p for p in needed if not permitted(p))
    if leaked:
        raise Incomplete(
            "the required set reaches outside what may be published:\n"
            + "".join(f"    {p}\n" for p in leaked)
            + "  Only app/, engine/alk_v2/ and the two named docs files may be\n"
            "  deployed. This tree becomes a public URL, so widening it is a\n"
            "  disclosure decision and belongs to the owner. Stopping."
        )


# The content types that decide whether this works, keyed by extension.
#
# Only `.wasm` is load-bearing in the strict sense: `WebAssembly.instantiate-
# Streaming` refuses anything but `application/wasm`. The rest are here because
# a host that guesses wrongly produces an app that loads and then does nothing,
# and guessing is what hosts do with extensions they do not know — `.py` above
# all, which is fifteen files of engine.
#
# Written as EXACT PATHS rather than as `/*.wasm`. Netlify's `_headers` matches
# a trailing wildcard only — `/path/*` — so an extension glob would silently
# match nothing, which is the worst of both worlds: a config file that looks
# like it is working. The exact paths come from the file list this script has
# already derived, so they cannot disagree with what is deployed.
CONTENT_TYPES = {
    ".wasm": "application/wasm",
    ".mjs": "text/javascript; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".webmanifest": "application/manifest+json; charset=utf-8",
    ".zip": "application/zip",
    ".py": "text/plain; charset=utf-8",
    ".md": "text/plain; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".svg": "image/svg+xml",
    ".png": "image/png",
    ".html": "text/html; charset=utf-8",
}

HEADERS_FILE = "_headers"


def headers_text(needed: list[str]) -> str:
    """The `_headers` file, generated from the tree it describes.

    One file, two hosts: Netlify and Cloudflare Pages read the same format, so
    there is no second copy of this for a second host to drift from.
    """
    lines = [
        "# Generated by tools/app/build-deploy-tree.py. Do not edit by hand —",
        "# rebuild the tree instead, or this stops describing what is deployed.",
        "#",
        "# Exact paths, not extension globs: Netlify's _headers matches a",
        "# trailing wildcard only, so /*.wasm would match nothing at all and",
        "# look like it was working.",
        "",
    ]
    for rel in needed:
        ctype = CONTENT_TYPES.get(Path(rel).suffix)
        if not ctype:
            continue
        lines.append(f"/{rel}")
        lines.append(f"  Content-Type: {ctype}")
    lines.append("")
    return "\n".join(lines)


def build(out: Path, needed: list[str]) -> None:
    if out.exists():
        shutil.rmtree(out)
    for rel in needed:
        dest = out / rel
        dest.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(ROOT / rel, dest)

    # Verify the TREE, not the plan. Copying can fail in ways the plan cannot
    # see, and a tree that is checked only before it is written is not checked.
    missing = [p for p in needed if not (out / p).is_file()]
    if missing:
        raise Incomplete(
            "the tree was written but is incomplete:\n" + "".join(f"    {p}\n" for p in missing)
        )

    # INSTALLABILITY, as a post-condition rather than a hope.
    #
    # The first tree this script built served the whole application and could
    # never be installed, because `sw.js` was absent — every file that the app
    # FETCHES was present, and the one it REGISTERS was not. Everything looked
    # right until a browser tried to install it.
    #
    # These are the four things without which what is deployed is a web page
    # and not an installable offline application. This is a statement of that
    # property, not a second copy of the file list.
    needs = {
        "a service worker": lambda p: p.endswith("/sw.js"),
        "an entry document": lambda p: p.endswith("app/index.html"),
        "a web app manifest": lambda p: p.endswith(".webmanifest"),
        "the WebAssembly runtime": lambda p: p.endswith(".wasm"),
        "the engine's Python source": lambda p: p.startswith("engine/alk_v2/") and p.endswith(".py"),
    }
    absent = [what for what, test in needs.items() if not any(test(p) for p in needed)]
    if absent:
        raise Incomplete(
            "the tree would not be an installable application; it is missing:\n"
            + "".join(f"    {a}\n" for a in absent)
        )

    # The host configuration, generated last so it describes the tree that was
    # actually written rather than the one that was planned.
    (out / HEADERS_FILE).write_text(headers_text(needed), encoding="utf-8")

    allowed = set(needed) | {HEADERS_FILE}
    stray = sorted(
        p.relative_to(out).as_posix()
        for p in out.rglob("*")
        if p.is_file() and p.relative_to(out).as_posix() not in allowed
    )
    if stray:
        raise Incomplete(
            "the tree contains files nothing asked for:\n" + "".join(f"    {p}\n" for p in stray)
        )


def summarise(out: Path, needed: list[str]) -> None:
    total = sum((out / p).stat().st_size for p in needed)
    groups: dict[str, list[str]] = {}
    for p in needed:
        key = "app/vendor/pyodide" if p.startswith("app/vendor/pyodide") else p.rsplit("/", 1)[0]
        groups.setdefault(key, []).append(p)

    print(f"deploy tree: {out}")
    print()
    for key in sorted(groups):
        size = sum((out / p).stat().st_size for p in groups[key])
        print(f"  {key + '/':<48} {len(groups[key]):>4} file(s)  {size / 1e6:>7.2f} MB")
    print()
    print(f"  {'total':<48} {len(needed):>4} file(s)  {total / 1e6:>7.2f} MB")
    print()
    print("  docs/ files included, and only these:")
    for p in sorted(x for x in needed if x.startswith("docs/")):
        print(f"    {p}")


# --------------------------------------------------------------------------
# Checking a DEPLOYED site.
#
# The two ways a static host breaks this application are not visible in the
# files: a `.wasm` served as anything but `application/wasm` fails
# `WebAssembly.instantiateStreaming`, and a `.py` or `.md` served as a download
# — or not served at all — takes the engine and its reason-code catalogue with
# it. Both produce an app that loads and then does nothing, which reads as a
# bug in the application.
#
# So this asks the deployed site rather than trusting the host's documentation.
# --------------------------------------------------------------------------

WASM_OK = "application/wasm"
# A `.py` or `.md` is fine as any text type. What is NOT fine is a type that
# makes the browser download it, or an attachment disposition.
TEXTISH = ("text/", "application/json", "application/javascript", "application/octet-stream")


def check_deployed(base: str, needed: list[str]) -> int:
    import urllib.error
    import urllib.request

    base = base.rstrip("/")
    problems: list[str] = []

    def head(path: str):
        req = urllib.request.Request(f"{base}/{path}", method="GET")
        req.add_header("User-Agent", "dosing-wizard-deploy-check")
        try:
            with urllib.request.urlopen(req, timeout=30) as r:
                return r.status, r.headers, r.read(64)
        except urllib.error.HTTPError as e:
            return e.code, e.headers, b""
        except Exception as e:  # noqa: BLE001 — the reason is what we report
            return None, {"x-error": str(e)}, b""

    samples = [
        "app/index.html",
        "app/sw.js",
        "app/manifest.webmanifest",
        "app/src/main.js",
        "app/src/strings.js",
        "app/assets/icon-180.png",
        "app/vendor/pyodide/pyodide.mjs",
        "app/vendor/pyodide/pyodide.asm.wasm",
        "app/vendor/pyodide/python_stdlib.zip",
        "engine/alk_v2/engine.py",
        "engine/alk_v2/adapter.py",
        "docs/implementation/alk-v2/ALK-V2-REASON-CODES.md",
        "docs/implementation/alk-v2/fixtures/config-defaults.json",
    ]
    samples = [s for s in samples if s in needed]

    print(f"checking {base}")
    print()
    for path in samples:
        status, headers, _ = head(path)
        ctype = (headers.get("Content-Type") or "").split(";")[0].strip().lower()
        disp = (headers.get("Content-Disposition") or "").lower()
        note = ""

        if status != 200:
            note = f"NOT SERVED ({status or headers.get('x-error')})"
            problems.append(f"{path}: {note}")
        elif path.endswith(".wasm") and ctype != WASM_OK:
            note = f"wrong type: {ctype!r}, needs {WASM_OK!r}"
            problems.append(f"{path}: {note}")
        elif path.endswith((".py", ".md")):
            if "attachment" in disp:
                note = "served as a download (Content-Disposition: attachment)"
                problems.append(f"{path}: {note}")
            elif not ctype.startswith(TEXTISH):
                note = f"unexpected type {ctype!r} — check the browser does not download it"
                problems.append(f"{path}: {note}")

        print(f"  {path:<52} {status}  {ctype or '-':<26} {note}")

    # HTTPS is not a nicety here: a service worker will not register without it,
    # and without a service worker there is no install and no offline.
    if not base.startswith("https://"):
        problems.append("the site is not on HTTPS — a service worker will not register, so it cannot be installed")

    print()
    if problems:
        print("PROBLEMS")
        for p in problems:
            print(f"  - {p}")
        print()
        print("RESULT: RED")
        return 1
    print(f"{len(samples)} paths served, .wasm typed correctly, .py and .md served as text.")
    print()
    print("RESULT: GREEN")
    return 0


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--out", default="deploy", help="where to write the tree (default: deploy)")
    ap.add_argument("--check", metavar="URL", help="check a DEPLOYED site instead of building")
    args = ap.parse_args()

    try:
        needed = required_paths()
        check_on_disk(needed)
    except Incomplete as e:
        print("DEPLOY TREE NOT BUILT", file=sys.stderr)
        print(f"  {e}", file=sys.stderr)
        return 2

    if args.check:
        return check_deployed(args.check, needed)

    out = (ROOT / args.out).resolve()
    try:
        build(out, needed)
    except Incomplete as e:
        print("DEPLOY TREE NOT BUILT", file=sys.stderr)
        print(f"  {e}", file=sys.stderr)
        return 2

    summarise(out, needed)
    print()
    print(f"  {HEADERS_FILE} sets the content types, and is read by both Netlify")
    print("  and Cloudflare Pages. It is generated from the file list above.")
    print()
    print("  Upload the CONTENTS of that directory as the site root, so that")
    print("  the app is at /app/ and the engine at /engine/ — the paths the")
    print("  service worker precaches.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
