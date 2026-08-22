/* ============================================================================
   HOW TALL THE SCREEN ACTUALLY IS, RIGHT NOW — ONE OWNER
   ----------------------------------------------------------------------------
   Owner findings 21, 7 and 22. Three faults, one cause.

   THE UNITS ALL LIE, EACH IN ITS OWN WAY.

   `100vh` is the LARGE viewport — the height the page would have if the
   browser's toolbars were hidden. On a phone with the toolbar showing it is
   taller than the screen. Round four established that half: `min-h-screen` was
   forcing the shell past the visible area and the tab bar sat below the fold.

   `100dvh` is the dynamic viewport, and it is better, but it is not live. The
   toolbar does not appear and disappear instantly — it slides, driven by the
   scroll — and iOS does not reflow the page continuously while it does. So a
   shell measured in `dvh` is the right height before the gesture and the right
   height after it, and briefly the wrong height during it. That is exactly what
   the owner reported: the bar "is sometimes correct" and "scrolling up detaches
   it from the bottom". A scroll gesture is the only thing that moves it.

   `window.visualViewport.height` is the one measurement that is neither. It is
   what is visible at this instant, and it fires `resize` AND `scroll` all the
   way through the toolbar's travel.

   WHY THE SHEETS ARE THE SAME BUG.

   Every sheet in the app sized itself in `vh` — 85, 88, 92 — and a sheet at
   85% of the LARGE viewport is taller than 85% of the screen. Its lower portion
   is simply off the bottom, under the toolbar and behind the tab bar, and
   because the sheet is a fixed, centred box there is nothing to scroll to reach
   it. The tab bar is not drawn in front of the sheet: the sheet is taller than
   the screen. That is why findings 7 and 22 are one rule and not two.

   So there is one number, published once as a custom property, and everything
   that needs to fit on the screen is measured against it.

   IT IS A PROGRESSIVE ENHANCEMENT, NOT A DEPENDENCY. The stylesheet keeps
   `100vh` then `100dvh` then `var(--app-vh)` as three declarations of one
   property: a browser with no `visualViewport` never defines the variable, the
   `dvh` declaration stands, and the app is exactly as good as it was before.
   ========================================================================= */

/* The property every layout rule reads. Named once here so a search finds both
   the writer and its readers. */
export const APP_VH = "--app-vh";

/* How much of that height the tab bar is standing on.

   A sheet is centred in the screen, and centring it in the WHOLE screen puts
   its lower edge behind the bar however short the sheet is — which is the
   remaining half of findings 7 and 22. The space a sheet may use is the screen
   minus the bar, so the bar's height is published too.

   Measured rather than written down: the bar is `md:hidden`, so on a wide
   screen it is not there at all and the answer is zero. A number typed here
   would be a second statement of the bar's height, and the day the padding
   changed the two would disagree. */
export const APP_NAV_H = "--app-nav-h";

/* Publish the visible height onto the document element.

   Returns a function that stops watching, so a caller in a component can clean
   up after itself. Safe to call where there is no window at all — the app's
   own tests run in Node.
*/
export function watchViewport() {
  if (typeof window === "undefined" || typeof document === "undefined") return () => {};
  const vv = window.visualViewport;
  const root = document.documentElement;
  if (!vv || !root || !root.style) return () => {};

  /* Rounded DOWN to a whole pixel. A fractional height rounded up is a shell
     one pixel taller than the screen, which is a document that can scroll —
     and a document that can scroll is the whole of what this exists to
     prevent. */
  const apply = () => {
    root.style.setProperty(APP_VH, `${Math.floor(vv.height)}px`);
    /* `offsetHeight` is zero for a hidden element, which is exactly the answer
       wanted on a screen wide enough that the bar is not rendered. */
    const nav = document.querySelector("nav[data-app-nav]");
    root.style.setProperty(APP_NAV_H, `${nav ? Math.ceil(nav.offsetHeight) : 0}px`);
  };
  apply();

  /* `scroll` as well as `resize`, and that is the load-bearing half. On iOS the
     toolbar's travel is reported as the visual viewport SCROLLING within the
     layout viewport, not as a resize, so a listener on `resize` alone misses
     the entire gesture the owner described. */
  vv.addEventListener("resize", apply);
  vv.addEventListener("scroll", apply);
  window.addEventListener("orientationchange", apply);

  return () => {
    vv.removeEventListener("resize", apply);
    vv.removeEventListener("scroll", apply);
    window.removeEventListener("orientationchange", apply);
  };
}
