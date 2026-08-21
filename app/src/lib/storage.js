/* ============================================================================
   WHAT IS LEFT OF V1's STORAGE MODULE
   ----------------------------------------------------------------------------
   V1's `src/lib/storage.js` was 316 lines: two storage backends tried in
   order, a localStorage prefix, a photo store split underneath the key-value
   contract, quota detection and an orphan collector. All of it is deleted.

   V2 keeps its own storage — the append-only event ledger, stored assessments
   with their version stamps, the configuration history and the import — and
   the brief for this port is explicit that it stays: "Keep V2's storage layer
   entirely." A second key-value store beside it would be a second record of
   the same tank.

   What survives is the part that was never storage at all: the notification
   bus. `notify` puts a message on screen and `onToast` is how the shell
   subscribes to it. It sat in this file in V1 because the thing that most
   needed to say something was a failed write; it is kept here, under V1's
   path, so that every ported call site — `DeleteButton`, the task list, the
   dose forms — reaches it exactly where it always did.
   ========================================================================= */

/* Storage failures used to be swallowed, which made a full quota look like a
   successful save until the next reload. Surface them instead. */
export let toastHandler = null;
export function onToast(fn) { toastHandler = fn; }
/* Brief confirmation that something happened — used where the thing you acted
   on disappears, so there is otherwise no feedback that it worked. */
export function notify(message) { if (toastHandler) toastHandler(message); }

export let storageErrorHandler = null;
export function onStorageError(fn) { storageErrorHandler = fn; }

export function isQuotaError(e) {
  if (!e) return false;
  const n = e.name || "";
  const m = String(e.message || "");
  return n === "QuotaExceededError" || n === "NS_ERROR_DOM_QUOTA_REACHED" ||
         /quota|exceeded|storage is full|too large/i.test(m);
}
