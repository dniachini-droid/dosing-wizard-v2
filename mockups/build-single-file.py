#!/usr/bin/env python3
"""Fold the whole mockup set into one self-contained HTML file.

The owner opens the set on a phone. Thirty-two files, two stylesheets and a
script do not travel: this produces one file that does, with the stylesheets and
the script inlined and every screen turned into a section that the in-file
navigation switches between.

    python3 mockups/build-single-file.py

Writes `mockups/dosing-wizard-v2-mockups.html`. That file is deliberately NOT
committed — it is a build artefact and it is in `.gitignore`. The script is the
thing under version control, so the artefact can always be rebuilt and can never
drift from the screens it was made from.
"""

import html
import pathlib
import re
import sys

HERE = pathlib.Path(__file__).resolve().parent
OUT = HERE / "dosing-wizard-v2-mockups.html"

BODY = re.compile(r'<body[^>]*>(.*)</body>', re.S)
TITLE = re.compile(r'<title>(.*?)</title>', re.S)
SCRIPT_TAG = re.compile(r'<script src="moments\.js"></script>')


def screens():
    """index first, then every screen in file order."""
    files = sorted(p for p in HERE.glob("*.html")
                   if p.name not in {"index.html", OUT.name})
    return [HERE / "index.html"] + files


def slug(name: str) -> str:
    """An id, not a filename. Prefixed because an id starting with a digit is
    legal HTML and an invalid CSS selector, which is a trap worth not setting."""
    return "s-" + name[:-len(".html")]


def main() -> int:
    tokens = (HERE / "tokens.css").read_text()
    app = (HERE / "app.css").read_text()
    moments = (HERE / "moments.js").read_text()
    # In the combined file the wrapper decides when a moment plays, because
    # every screen is present at once. In the separate files it plays on load.
    moments = moments.replace("  play(document);", "  /* combined build: the wrapper calls playMoments */")

    pages = screens()
    if len(pages) < 2:
        print("No screens found beside index.html — refusing to write a stub.",
              file=sys.stderr)
        return 1

    sections, nav = [], []
    for i, path in enumerate(pages):
        raw = path.read_text()
        m = BODY.search(raw)
        if not m:
            print("No <body> in %s" % path.name, file=sys.stderr)
            return 1
        body = SCRIPT_TAG.sub("", m.group(1))

        # In-file navigation: every link to another screen becomes a hash link.
        body = re.sub(r'href="(\d[0-9a-z-]*|index)\.html(#[^"]*)?"',
                      lambda mm: 'href="#s-%s"' % mm.group(1), body)

        title = TITLE.search(raw)
        title = html.unescape(title.group(1)) if title else path.name
        title = title.split("·")[0].strip()

        sections.append(
            '<section class="page" id="%s" %s>\n<!-- %s -->\n%s\n</section>'
            % (slug(path.name), "" if i == 0 else 'hidden', path.name, body))
        nav.append('<option value="%s">%s</option>' % (slug(path.name), html.escape(title)))

    out = """<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>Dosing Wizard V2 &mdash; every screen</title>
<style>
%s
%s

/* --- The single-file wrapper -------------------------------------------
   Present only in the combined build. It is not part of any screen and it
   has no equivalent in the app. */
.page[hidden] { display: none; }
.filepicker {
  position: sticky; top: 0; z-index: 20;
  background: var(--card-gradient);
  border-bottom: 1px solid var(--border);
  padding: var(--sp-2) var(--gutter);
  display: flex; gap: var(--sp-2); align-items: center;
}
.filepicker .lbl {
  font-size: var(--t-micro); font-weight: var(--w-bold);
  letter-spacing: var(--ls-caps); text-transform: uppercase; color: var(--faint);
  flex: none;
}
.filepicker select {
  flex: 1; min-width: 0;
  font-family: var(--font); font-size: var(--t-small); font-weight: var(--w-semi);
  color: var(--ink); background: var(--card-top);
  border: 1px solid var(--border); border-radius: var(--r-field);
  padding: var(--sp-2);
}
</style>
</head>
<body>

<div class="filepicker">
  <span class="lbl">Screen</span>
  <select id="pick" aria-label="Choose a screen">
%s
  </select>
</div>

%s

<script>
%s
</script>
<script>
/* Show one screen at a time, and keep the address bar honest so the back
   button behaves. Nothing else in the file depends on this. */
(function () {
  var pick = document.getElementById("pick");
  var pages = Array.prototype.slice.call(document.querySelectorAll(".page"));
  function show(id) {
    var found = false;
    pages.forEach(function (p) {
      var on = p.id === id;
      p.hidden = !on;
      if (on) found = true;
    });
    if (!found) { pages[0].hidden = false; id = pages[0].id; }
    pick.value = id;
    window.scrollTo(0, 0);
    /* Every screen is in this file at once, so a moment would otherwise have
       played to the end while it was hidden. Replay the one now on screen. */
    var page = document.getElementById(id);
    if (page && window.playMoments) window.playMoments(page);
  }
  pick.addEventListener("change", function () { location.hash = pick.value; });
  window.addEventListener("hashchange", function () { show(location.hash.slice(1)); });
  show(location.hash.slice(1) || pages[0].id);
})();
</script>
</body>
</html>
""" % (tokens, app, "\n".join("    " + n for n in nav), "\n\n".join(sections), moments)

    OUT.write_text(out)
    size = OUT.stat().st_size
    print("Wrote %s — %d screens, %.0f kB." % (OUT.name, len(pages), size / 1024))
    print("Not committed: it is a build artefact and is in .gitignore.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
