// Pure request classification for the phone proxy. No I/O: everything the proxy may forward is
// decided here, so the deny-by-default boundary is directly unit-testable.
import {
  AUTH_ROUTES,
  IDENTITY_PATH,
  CALLABLE_ALLOWLIST,
  EMULATOR_FUNCTIONS_BASE,
  FUNCTIONS_PREFIX,
} from "./config.mjs";

const authRouteKeys = new Set(AUTH_ROUTES.map(([m, p]) => `${m} ${p}`));
const callables = new Set(CALLABLE_ALLOWLIST);

const deny = (reason) => ({ kind: "deny", reason });

/** Static assets: GET/HEAD only, no traversal, never an emulator-looking path. */
function classifyStatic(method, pathname) {
  if (method !== "GET" && method !== "HEAD") return deny("method");
  if (pathname.includes("..") || pathname.includes("\\") || pathname.includes("\0")) {
    return deny("path");
  }
  return { kind: "static" };
}

/**
 * @param {{method:string, pathname:string, search:string, headers:Record<string,string|undefined>}} req
 * @returns {{kind:"static"}|{kind:"auth",path:string}|{kind:"functions",path:string}|{kind:"deny",reason:string}}
 */
export function classify({ method, pathname, search, headers }) {
  // Encoded dots / slashes / backslashes could smuggle a different route past the exact matches.
  if (/%(2e|2f|5c|00)/i.test(pathname)) return deny("encoded-path");

  if (pathname === IDENTITY_PATH) {
    return method === "GET" ? { kind: "identity" } : deny("method");
  }

  if (pathname.startsWith(FUNCTIONS_PREFIX)) {
    const name = pathname.slice(FUNCTIONS_PREFIX.length);
    if (method !== "POST") return deny("method");
    if (!callables.has(name)) return deny("callable-not-allowed");
    if (!/^application\/json\b/i.test(headers["content-type"] ?? "")) return deny("content-type");
    return { kind: "functions", path: `${EMULATOR_FUNCTIONS_BASE}${name}` };
  }

  if (authRouteKeys.has(`${method} ${pathname}`)) {
    // Admin semantics: the Auth emulator treats `Authorization: Bearer owner` as project admin.
    // Browser-client routes never send Authorization (the ID token travels in the body).
    if (headers.authorization !== undefined) return deny("auth-authorization-header");
    const params = new URLSearchParams(search);
    for (const key of params.keys()) if (key !== "key") return deny("auth-query");
    if (!/^application\/(json|x-www-form-urlencoded)\b/i.test(headers["content-type"] ?? "")) {
      return deny("content-type");
    }
    return { kind: "auth", path: `${pathname}${search}` };
  }

  // Any other emulator-shaped path is an explicit deny with its own reason (clearer logs).
  if (
    pathname.startsWith("/emulator") ||
    pathname.startsWith("/identitytoolkit.googleapis.com") ||
    pathname.startsWith("/securetoken.googleapis.com") ||
    pathname.startsWith("/www.googleapis.com") ||
    pathname.startsWith("/google.firestore") ||
    pathname.startsWith("/v1/projects") ||
    pathname.startsWith("/demo-")
  ) {
    return deny("emulator-route");
  }

  return classifyStatic(method, pathname);
}
