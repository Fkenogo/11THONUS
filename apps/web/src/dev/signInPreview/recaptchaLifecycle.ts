/**
 * Managed reCAPTCHA verifier lifecycle for the optional Phone flow
 * (AUTH-PREVIEW-READINESS-001).
 *
 * A `RecaptchaVerifier` owns injected iframe/widget resources; constructing a
 * new one per send without clearing the previous one leaks widgets and
 * listeners for the page's lifetime (mirrors the `phoneAuthHarness` teardown
 * discipline). This helper retains the current verifier + its container node
 * and tears both down before creating the next and on unmount. Kept pure and
 * dependency-injected so the lifecycle is unit-testable without Firebase/DOM.
 */

export interface ManagedVerifier {
  clear(): void;
}

export interface RecaptchaLifecycleDeps<V extends ManagedVerifier> {
  /** Construct a verifier bound to the given fresh container node. */
  createVerifier: (node: HTMLElement) => V;
  /** Create and attach a fresh container node, returning it. */
  createNode: () => HTMLElement;
  /** Detach a previously created container node. */
  removeNode: (node: HTMLElement) => void;
}

export interface ManagedRecaptcha<V extends ManagedVerifier> {
  /** Tear down any current verifier/node, then create and retain a fresh pair. */
  getVerifier: () => V;
  /** Clear the current verifier and remove its node (idempotent; safe if none). */
  teardown: () => void;
}

export function createManagedRecaptcha<V extends ManagedVerifier>(
  deps: RecaptchaLifecycleDeps<V>,
): ManagedRecaptcha<V> {
  let current: { verifier: V; node: HTMLElement } | null = null;

  function teardown(): void {
    if (!current) return;
    const { verifier, node } = current;
    // Reset state first so a throwing clear() can never leave a stale current
    // reference. clear() is best-effort widget cleanup (runs on unmount/before
    // replace) — a failure must never crash teardown or block node removal.
    current = null;
    try {
      verifier.clear();
    } catch {
      // Ignore: the container node is removed below regardless.
    }
    deps.removeNode(node);
  }

  function getVerifier(): V {
    teardown();
    const node = deps.createNode();
    const verifier = deps.createVerifier(node);
    current = { verifier, node };
    return verifier;
  }

  return { getVerifier, teardown };
}
