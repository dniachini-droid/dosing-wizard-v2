#!/usr/bin/env python3
"""Serve the repository so the application can be opened on a phone.

    python3 tools/app/serve.py            # http://<this machine>:8000/app/
    python3 tools/app/serve.py --port 8080

The application is served from the repository root rather than from `app/`,
because it reads two things that live outside it and must not be copied:

  - `engine/alk_v2/*.py`, the engine itself. A copy would be a second owner of
    every threshold in the canon.
  - `docs/implementation/alk-v2/ALK-V2-REASON-CODES.md` and
    `fixtures/config-defaults.json`, which own the reason-code table and the
    canon's default configuration. A copy of either would drift.

There is no build step and no bundler. What is served is what is in the
repository.

A service worker needs a secure context, which means HTTPS or localhost. On a
phone that is a real constraint and the README says how to meet it.
"""

from __future__ import annotations

import argparse
import functools
import http.server
import os
import socket

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


class Handler(http.server.SimpleHTTPRequestHandler):
    extensions_map = {
        **http.server.SimpleHTTPRequestHandler.extensions_map,
        ".js": "text/javascript",
        ".mjs": "text/javascript",
        ".json": "application/json",
        ".wasm": "application/wasm",
        ".webmanifest": "application/manifest+json",
        ".css": "text/css",
        ".svg": "image/svg+xml",
        ".py": "text/plain",
        ".md": "text/plain",
        ".zip": "application/zip",
    }

    def end_headers(self):
        # No caching from the dev server: the service worker is the cache, and a
        # stale 304 from here makes an update look like a service-worker bug.
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def log_message(self, fmt, *args):
        if "404" in (fmt % args):
            super().log_message(fmt, *args)


def local_ip() -> str:
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        s.connect(("10.255.255.255", 1))
        return s.getsockname()[0]
    except Exception:  # noqa: BLE001
        return "127.0.0.1"
    finally:
        s.close()


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--port", type=int, default=8000)
    args = ap.parse_args()

    if not os.path.exists(os.path.join(ROOT, "app", "vendor", "pyodide", "pyodide.mjs")):
        print(
            "The Python runtime is not vendored yet, so the assessment will not run.\n"
            "  python3 tools/app/vendor-runtime.py\n"
        )

    handler = functools.partial(Handler, directory=ROOT)
    httpd = http.server.ThreadingHTTPServer(("0.0.0.0", args.port), handler)
    print(f"  on this machine   http://localhost:{args.port}/app/")
    print(f"  on your phone     http://{local_ip()}:{args.port}/app/")
    print(
        "\nA phone will not install it over plain http from an IP address — a service\n"
        "worker needs localhost or HTTPS. See app/README.md for the two ways round that.\n"
    )
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        pass
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
