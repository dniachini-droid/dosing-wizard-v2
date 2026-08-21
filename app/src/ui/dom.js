/* ============================================================================
   A very small DOM helper
   ----------------------------------------------------------------------------
   No framework. The whole application is plain ES modules, which keeps the
   dependency count at zero — matching the discipline the engine and the
   conformance harness already hold themselves to — and keeps the served bundle
   small enough that the Python runtime is the only large thing to download.

   `h()` builds an element. `text()` sets textContent, never innerHTML, so
   nothing the keeper types can become markup.
   ========================================================================= */

export function h(tag, attrs, ...children) {
  const el = document.createElement(tag);
  if (attrs) {
    for (const [k, v] of Object.entries(attrs)) {
      if (v == null || v === false) continue;
      if (k === "class") el.className = v;
      else if (k === "style" && typeof v === "object") Object.assign(el.style, v);
      else if (k.startsWith("on") && typeof v === "function") el.addEventListener(k.slice(2), v);
      else if (k === "html") el.innerHTML = v; /* only ever called with app-authored markup */
      else el.setAttribute(k, v === true ? "" : String(v));
    }
  }
  add(el, children);
  return el;
}

export function svg(tag, attrs, ...children) {
  const el = document.createElementNS("http://www.w3.org/2000/svg", tag);
  if (attrs) {
    for (const [k, v] of Object.entries(attrs)) {
      if (v == null || v === false) continue;
      if (k.startsWith("on") && typeof v === "function") el.addEventListener(k.slice(2), v);
      else el.setAttribute(k, String(v));
    }
  }
  add(el, children);
  return el;
}

function add(el, children) {
  for (const c of children.flat(Infinity)) {
    if (c == null || c === false) continue;
    el.appendChild(c instanceof Node ? c : document.createTextNode(String(c)));
  }
}

export function clear(el) {
  while (el.firstChild) el.removeChild(el.firstChild);
  return el;
}

export function mount(host, node) {
  clear(host);
  if (node) host.appendChild(node);
  return host;
}

/* Correct modal dismissal in two lines. Ported from V1 `backup.jsx:484`
   (`useEscape`), `PORT_AS_IS`. */
export function onEscape(fn) {
  const handler = (e) => {
    if (e.key === "Escape") fn();
  };
  document.addEventListener("keydown", handler);
  return () => document.removeEventListener("keydown", handler);
}
