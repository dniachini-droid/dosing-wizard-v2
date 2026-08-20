#!/usr/bin/env python3
"""Owner decision 9, as a check rather than a promise.

No reason-code identifier and no canon variable name may appear in any visible
string. They are allowed in exactly one place: inside a `<details class="devview">`
block, which says on its face that it is not part of the interface.

This is deliberately a check and not a review note. A rule that can be pinned by
a failing test should be.

    python3 mockups/check-plain-english.py

Exit status 0 if clean, 1 if anything leaked. Every non-zero path reaches the
exit code — a check that cannot fail is worse than no check.
"""

import pathlib
import re
import sys

HERE = pathlib.Path(__file__).resolve().parent

# The developer view is the one sanctioned home for this vocabulary.
DEVVIEW = re.compile(r'<details[^>]*\bclass="devview"[^>]*>.*?</details>', re.S)

# Comments are source, not screen.
COMMENT = re.compile(r'<!--.*?-->', re.S)

# SCREAMING_SNAKE of two or more words: the shape of every reason code and
# every enumerated state name in the contract.
REASON_CODE = re.compile(r'\b[A-Z][A-Z0-9]*(?:_[A-Z0-9]+)+\b')

# Canon rule and marker identifiers: M-7, X-INV-004, ALK-014, WG-ALK-066,
# DEC-003, OI-RETEST-001, SH-2.
CANON_MARKER = re.compile(
    r'\b(?:M|X|SH|DEC|OD|OI|ALK|WG|CANON)-[A-Z0-9]+(?:-[A-Z0-9]+)*\b')

# Canon variable names as they appear in a payload: lowerCamelCase with a
# trailing unit, or a single-letter symbol used as a label.
CANON_VARIABLE = re.compile(
    r'\b(?:[a-z]+(?:[A-Z][a-zA-Z0-9]*)+|sigma[A-Z0-9]|[A-Z]_[a-z]+)\b')

# Words that legitimately look like the above and are not contract vocabulary.
ALLOWED = {
    # File names, which appear in notes addressed to the owner.
    "tokens.css", "app.css", "index.html", "moments.css", "moments.js",
    "CONTRACT-GAPS.md", "README.md",
    # Parameter identity marks.
    "ALK", "CA", "MG", "NO3", "PO4", "SAL",
    # Units. They are what a reef keeper writes on a test kit, not contract
    # vocabulary — but they happen to match the camelCase shape.
    "dKH", "mL", "mEq", "mS", "pH", "gPerL", "ppm",
    # Product and platform names, which share the camelCase shape by accident.
    "iOS", "iPhone", "iPad", "macOS", "JavaScript", "IndexedDB",
    # HTML/CSS incidentals inside inline style attributes.
    "dataMax", "dataMin",
}


def visible_text(html: str) -> str:
    """What a reader actually sees: markup and the developer view removed."""
    body = DEVVIEW.sub(" ", html)
    body = COMMENT.sub(" ", body)
    # Drop inline style and attribute payloads — they are not read.
    body = re.sub(r'<style\b.*?</style>', " ", body, flags=re.S)
    body = re.sub(r'<script\b.*?</script>', " ", body, flags=re.S)
    body = re.sub(r'<[^>]+>', " ", body)
    return body


def check(path: pathlib.Path):
    text = visible_text(path.read_text())
    found = []
    for pattern, what in ((REASON_CODE, "reason code"),
                          (CANON_MARKER, "canon marker"),
                          (CANON_VARIABLE, "canon variable name")):
        for hit in pattern.findall(text):
            if hit in ALLOWED:
                continue
            found.append((what, hit))
    return found


def main() -> int:
    failures = 0
    for path in sorted(HERE.glob("*.html")):
        found = check(path)
        if found:
            failures += 1
            print("%s:" % path.name)
            for what, hit in sorted(set(found)):
                print("    %-20s %s" % (what, hit))
    if failures:
        print("\n%d file(s) show contract vocabulary outside a developer view." % failures)
        return 1
    print("Clean: no reason code, canon marker or canon variable name is visible "
          "outside a developer view.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
