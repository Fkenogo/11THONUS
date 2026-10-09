/**
 * Physical-phone Founder Preview transport seam (infra/slice-b-phone-preview).
 *
 * A phone cannot reach the laptop's `127.0.0.1` emulators, and an HTTPS page may not call plain-HTTP
 * emulator ports. When `VITE_FIREBASE_PREVIEW_ORIGIN` is set, Auth and Functions talk to that one
 * HTTPS origin (served by `tests/preview/phone/`) instead. UNSET (the default, and every production
 * build) leaves the existing emulator wiring untouched.
 */

/** Same-origin path the preview proxy maps onto the Functions emulator's callable routes. */
export const PREVIEW_FUNCTIONS_PATH = "/__fn";

/** Returns the normalised origin, `undefined` when unset, and throws on anything that is not a bare https origin. */
export function parsePreviewOrigin(value: string | undefined): string | undefined {
  if (value === undefined || value === "") return undefined;
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error("VITE_FIREBASE_PREVIEW_ORIGIN must be an absolute https origin.");
  }
  const bare = url.pathname === "/" && url.search === "" && url.hash === "" && url.username === "";
  if (url.protocol !== "https:" || !bare) {
    throw new Error(
      "VITE_FIREBASE_PREVIEW_ORIGIN must be a bare https origin (no path, query or credentials).",
    );
  }
  return url.origin;
}

export const FIREBASE_PREVIEW_ORIGIN = parsePreviewOrigin(
  import.meta.env.VITE_FIREBASE_PREVIEW_ORIGIN,
);

/** The preview origin only applies to emulator mode; setting it anywhere else fails closed. */
export function resolvePreviewOrigin(
  useEmulator: boolean,
  previewOrigin: string | undefined,
): string | undefined {
  if (previewOrigin !== undefined && !useEmulator) {
    throw new Error("VITE_FIREBASE_PREVIEW_ORIGIN requires Firebase emulator mode.");
  }
  return previewOrigin;
}
