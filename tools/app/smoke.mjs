/* RETIRED BY THE V1 INTERFACE PORT.
 *
 * This served the repository over a tiny HTTP server and drove the no-build
 * application in Chromium. It was a development aid and never a committed
 * gate — the header said so.
 *
 * The application is now V1's React interface and has a real dev server, which
 * does the serving part properly, with the repository root as its root so the
 * engine worker still resolves `engine/alk_v2/*.py` and the frozen reason-code
 * catalogue exactly where it always did:
 *
 *     npm install
 *     npm run dev            # then open /app/index.html
 *
 * The tests that run with nothing but Node are still in `tests/app/`, and
 * `node tests/app/run-app-tests.mjs --mutations` still proves each one can
 * fail.
 */

console.log("Retired. Use `npm run dev` and open /app/index.html.");
