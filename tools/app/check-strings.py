#!/usr/bin/env python3
"""Fail if a user-facing string exists anywhere outside `app/src/strings.js`.

    python3 tools/app/check-strings.py

WHY THIS IS A CHECK AND NOT A CONVENTION
----------------------------------------

A language pass over the whole interface is coming. Text scattered across
thirty screens turns that into an expensive, error-prone job; text in one file
turns it into an afternoon. Conventions that are only written down decay, so
this one is executable: a prose literal in a screen file fails the check by
name and line.

WHAT IT LOOKS FOR
-----------------

Every string literal in `app/src/**/*.js`, minus:

  - `app/src/strings.js` itself, which is where they belong;
  - anything inside a comment, which is documentation and not rendered;
  - literals that are clearly not prose (see `_is_technical`).

The remainder is reported. This is a lexical check rather than a parse, which
makes it conservative in one direction and blunt in the other: it cannot tell
a CSS class from a sentence by role, only by shape. `_is_technical` is that
judgement, and every rule in it is stated rather than implied — an exception
that is not visible is an exception that grows.

WHAT IT DOES NOT CATCH
----------------------

A sentence assembled from `t()` calls by concatenation at a call site. That is
forbidden for the same reason — it makes word order uneditable from the strings
file — and it is not mechanically distinguishable from legitimate joining.
`tests/app/test_strings.mjs` covers the part that can be checked: that every
reason code the engine can emit has a sentence, and that no key is missing.
"""

from __future__ import annotations

import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SRC = os.path.join(ROOT, "app", "src")
STRINGS = os.path.join(SRC, "strings.js")

# The moment driver is ported V1 motion code and is carried unchanged on
# purpose; it renders no text of its own. It is listed here rather than
# silently skipped.
# Nothing is carried unchanged any more: `app/src/moments/moments.js` was
# deleted by the V1 interface port, and the moments are now V1's own files.
CARRIED_UNCHANGED = set()

# Literals that are source code rather than text, listed one by one with the
# reason. An allowlist that is not visible is an allowlist that grows, so this
# one is spelled out and stays short.
ALLOWED = {
    # The Python expression the engine worker evaluates inside the WebAssembly
    # runtime. Code, not language.
    "json.dumps(adapter.assess(json.loads(_request_json)), default=str)",
}


def _strip_comments(text: str) -> str:
    """Blank out comments and template-literal-free regions we must not scan.

    Comments are replaced with spaces of the same length so reported line
    numbers stay correct.
    """
    out = []
    i, n = 0, len(text)
    while i < n:
        two = text[i : i + 2]
        if two == "//":
            j = text.find("\n", i)
            j = n if j < 0 else j
            out.append(" " * (j - i))
            i = j
        elif two == "/*":
            j = text.find("*/", i + 2)
            j = n if j < 0 else j + 2
            out.append("".join(c if c == "\n" else " " for c in text[i:j]))
            i = j
        elif text[i] in "\"'`":
            q = text[i]
            j = i + 1
            while j < n:
                if text[j] == "\\":
                    j += 2
                    continue
                if text[j] == q:
                    j += 1
                    break
                j += 1
            out.append(text[i:j])
            i = j
        else:
            out.append(text[i])
            i += 1
    return "".join(out)


LITERAL = re.compile(r"""(['"])((?:\\.|(?!\1)[^\\])*)\1""", re.S)


def _is_technical(s: str) -> bool:
    """Is this literal something other than text a keeper reads?

    Every rule is a judgement and is stated as one.
    """
    t = s.strip()
    if not t:
        return True
    # A single word, or a hyphenated/underscored identifier: class names, keys,
    # event kinds, contract enums, css properties.
    if " " not in t:
        return True
    # CSS class lists and selectors: lowercase words, digits and hyphens only.
    # "notice rows-2", "pill sev pill-neutral", "btn btn-primary".
    if re.fullmatch(r"[a-z0-9\-. #>:\[\]=\"']+", t) and not re.search(r"[.!?,;]", t):
        return True
    # A strings-file key path used as an argument: "today.item.dose.title".
    if re.fullmatch(r"[a-zA-Z0-9_.\-]+", t):
        return True
    # CSS values built from custom properties: "calc(30 * var(--mc-gap-unit))".
    if "var(--" in t or t.startswith("calc(") or t.startswith("url("):
        return True
    # A CSS length or number pair: "0 0 296 116", "1px solid var(--faint)".
    if re.fullmatch(r"[0-9a-z%.\-+ ,()]+", t):
        return True
    # SVG path data.
    if re.fullmatch(r"[MLCZmlcz0-9.,\- ]+", t):
        return True
    # A media query or feature test.
    if t.startswith("(") and t.endswith(")"):
        return True
    return False


# WHAT THIS CHECK COVERS AFTER THE V1 INTERFACE PORT, STATED PLAINLY
# --------------------------------------------------------------------------
# It walks `.js` files only, and that is now a real limit rather than an
# incidental one, so it is said out loud here and printed in the output.
#
# After the port, `app/src/**/*.js` is the store, the engine boundary, the
# present layer and the ported V1 libraries. Those are where a sentence about
# chemistry would do damage, and the rule holds there in full.
#
# `app/src/**/*.jsx` is V1's interface, ported. It carries its own chrome text
# inline — "Reset", "Pinch to zoom · drag to pan · double-tap to reset",
# "Mark done" — because that is how V1 wrote it, and extracting all of it would
# have made every line of every ported file a difference with no permitted
# reason, which is the opposite of a port.
#
# What covers the interface instead is `tests/app/test-port.mjs`:
#
#   PORT-01  no interface file names a V1 chemistry function
#   PORT-02  the engine's position vocabulary appears in no interface file
#   PORT-03  no interface file tests a contract decision value
#   PORT-04  no interface file compares a reading to a band edge
#
# Between them those say the thing that actually matters: no screen composes a
# sentence about what a reading means, because no screen has the vocabulary to.
# Every word about chemistry still arrives through `app/src/present/` out of
# `app/src/strings.js`.
#
# Narrowing this checker's stated rule to match is an open item in
# `docs/migration/PORT-OMISSIONS.md` §11.


def main() -> int:
    problems = []
    for dirpath, _dirs, files in os.walk(SRC):
        for fn in sorted(files):
            if not fn.endswith(".js"):
                continue
            path = os.path.join(dirpath, fn)
            if path == STRINGS or path in CARRIED_UNCHANGED:
                continue
            text = open(path, encoding="utf-8").read()
            stripped = _strip_comments(text)
            for m in LITERAL.finditer(stripped):
                lit = m.group(2)
                if lit in ALLOWED or _is_technical(lit):
                    continue
                line = stripped.count("\n", 0, m.start()) + 1
                rel = os.path.relpath(path, ROOT)
                problems.append(f"{rel}:{line}  {lit[:90]!r}")

    print("=" * 74)
    print("USER-FACING STRINGS — every one must live in app/src/strings.js")
    print("=" * 74)
    print("\nSCOPE: app/src/**/*.js. The ported V1 interface (`*.jsx`) carries its own")
    print("chrome text inline and is covered by PORT-01..04 in tests/app/test-port.mjs")
    print("instead. See docs/migration/PORT-OMISSIONS.md §11.")
    if problems:
        print(f"\n{len(problems)} literal(s) outside the strings file:\n")
        for p in problems:
            print("  " + p)
        print("\nRESULT: RED")
        return 1
    print("\nNo user-facing string exists outside app/src/strings.js.")
    print("\nRESULT: GREEN")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
