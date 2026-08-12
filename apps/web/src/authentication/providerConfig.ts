/**
 * Closed, disabled-by-default authentication provider registry (AUTH-04).
 *
 * AUTH-BP §3/§15 (as amended by `AUTH-CORR-003`, per the Founder multi-provider
 * decision): MVP providers are **Google Sign-In + Email/Password + Phone OTP**
 * (Phone OTP is optional/non-default; Apple / email-link / passkeys stay
 * deferred and additive). Every provider is **disabled by default** and enabled
 * only by an explicit, exact-"true" build flag — fail closed for absent,
 * "false", or malformed values so a misconfigured build never silently exposes
 * a live sign-in path.
 *
 * The provider ids are the exact `referenceType` strings the AUTH-03
 * `authenticate` callable accepts (and that AUTH-02's verified-provider map
 * derives); this module does not widen that set. Follows `config/env.ts` /
 * `harnessGate.ts`: an explicit source is passed in rather than reading
 * `import.meta.env` internally, so the gate is pure and directly testable at
 * every call site.
 */

export type AuthProviderId = "phone_otp" | "google_sign_in" | "email";

/** The closed MVP registry — no other provider may be added without governance. */
export const AUTH_PROVIDER_IDS: readonly AuthProviderId[] = [
  "google_sign_in",
  "email",
  "phone_otp",
];

type AuthProviderFlagSource = Record<string, string | undefined>;

const PROVIDER_FLAG: Record<AuthProviderId, string> = {
  phone_otp: "VITE_AUTH_ENABLE_PHONE_OTP",
  google_sign_in: "VITE_AUTH_ENABLE_GOOGLE_SIGN_IN",
  email: "VITE_AUTH_ENABLE_EMAIL_PASSWORD",
};

/** True only when the provider's flag is exactly the string "true". */
export function isAuthProviderEnabled(
  source: AuthProviderFlagSource,
  provider: AuthProviderId,
): boolean {
  return source[PROVIDER_FLAG[provider]] === "true";
}

/** The set of providers explicitly enabled by the given source (empty by default). */
export function resolveEnabledAuthProviders(
  source: AuthProviderFlagSource,
): ReadonlySet<AuthProviderId> {
  return new Set(AUTH_PROVIDER_IDS.filter((provider) => isAuthProviderEnabled(source, provider)));
}
