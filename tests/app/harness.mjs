/* ============================================================================
   A very small test harness
   ----------------------------------------------------------------------------
   Node's own runner would do, but the repository has no `package.json` and no
   dependency on one, and adding both to assert twenty facts is a worse trade
   than forty lines here.

   The shape is the conformance harness's, deliberately. A test states what it
   checks; `mutations.mjs` states the source change that must turn it red; and
   `run-app-tests.mjs --mutations` proves each one does. A test nobody has seen
   fail is a test nobody has seen work.
   ========================================================================= */

export function suite(name) {
  const cases = [];
  return {
    name,
    test(id, description, fn) {
      cases.push({ id, description, fn });
    },
    cases,
  };
}

export function eq(actual, expected, what) {
  if (!Object.is(actual, expected)) {
    throw new Error(`${what}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
}

export function ok(value, what) {
  if (!value) throw new Error(`${what}: expected a truthy value, got ${JSON.stringify(value)}`);
}

export function deepEq(actual, expected, what) {
  const a = JSON.stringify(actual);
  const b = JSON.stringify(expected);
  if (a !== b) throw new Error(`${what}:\n  expected ${b}\n  got      ${a}`);
}

export async function throws(fn, matching, what) {
  try {
    await fn();
  } catch (e) {
    if (matching && !new RegExp(matching, "i").test(e.message)) {
      throw new Error(
        `${what}: refused, but with "${e.message}" rather than something matching /${matching}/`
      );
    }
    return e;
  }
  throw new Error(`${what}: expected it to refuse, and it did not`);
}
