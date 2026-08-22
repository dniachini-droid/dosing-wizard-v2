import React from 'react'
import { createRoot } from 'react-dom/client'
import { ReefConsole } from './App.jsx'
import './index.css'

createRoot(document.getElementById('root')).render(React.createElement(ReefConsole))

/* ============================================================================
   OFFLINE — ROUND THREE, ITEM 10
   ----------------------------------------------------------------------------
   The service worker did not survive the build change, so the app needed the
   network to open. A reef tank is very often in a garage or a fish room with
   no signal, and `PRODUCT-VISION.md` wants an app a keeper uses standing at
   the tank.

   Registered AFTER the first render and on `load`, so it competes with
   nothing: the app paints, then the worker installs and precaches the shell,
   the engine's own Python files and the frozen reason-code catalogue.

   Only in a built app. The dev server has no `/app/sw.js` to register, and a
   service worker caching a dev server's module graph makes every subsequent
   edit invisible. A failed registration is not fatal and is not dressed up as
   anything: the app works online exactly as it did.
   ========================================================================= */
if ("serviceWorker" in navigator && import.meta.env.PROD) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/app/sw.js", { scope: "/" }).catch(() => {
      /* No offline. Everything else is unaffected. */
    });
  });
}
