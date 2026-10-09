// Physical-phone Founder Preview (infra/slice-b-phone-preview) — configuration and the ONE
// allow-list the phone proxy enforces. Everything not named here is denied.
import path from "node:path";
import { PROJECT_ID, FUNCTIONS_REGION, LOOPBACK, ports, previewStateDir } from "../lib/config.mjs";

/** Loopback port of the phone proxy (next free slot after postgres :28110). */
export const PROXY_PORT = 28111;
export const PROXY_ORIGIN = `http://${LOOPBACK}:${PROXY_PORT}`;
export const distDir = path.join(previewStateDir, "phone-dist");
export const tunnelStatePath = path.join(previewStateDir, "phone-tunnel.json");

/** Same-origin prefix the web app's Functions client uses (apps/web .../previewOrigin.ts). */
export const FUNCTIONS_PREFIX = "/__fn/";
export const EMULATOR_FUNCTIONS_BASE = `/${PROJECT_ID}/${FUNCTIONS_REGION}/`;

/** Only these upstream targets are ever contacted. */
export const upstream = Object.freeze({
  auth: { host: LOOPBACK, port: ports.auth },
  functions: { host: LOOPBACK, port: ports.functions },
});

/**
 * Callables the Staff + Customer Founder Preview flows use. Derived from the web app's import
 * closure and CONFIRMED by tracing the real UI (Staff: sign-in → Bella Salon → Counter with a
 * Loyalty Number + programme → Activity → Profile; Customer: sign-in → Circles/Activity/Profile):
 * authenticate, getAccessibleBusinesses, getBusinessContext, listRewardPrograms,
 * getCounterLoyaltyContext, listMyRecentCounterPurchases, getMyCustomerExperienceOverview,
 * getMyCustomerIdentityPresentation and listPurchasesWaitingForCustomer were observed on the wire.
 * recordPurchase and the customer confirm/reject/dispute actions are the user-initiated writes of
 * those same screens (not exercised by the read-only trace). Owner-only mutations, onboarding,
 * team, reward-programme editing and MFA/platform-admin callables are deliberately excluded.
 */
export const CALLABLE_ALLOWLIST = Object.freeze([
  // sign-in + context
  "authenticate",
  "getAccessibleBusinesses",
  "getBusinessContext",
  // Staff Counter / Activity / Profile
  "listRewardPrograms",
  "getCounterLoyaltyContext",
  "recordPurchase",
  "listMyRecentCounterPurchases",
  // Customer
  "getMyCustomerExperienceOverview",
  "getMyCustomerIdentityPresentation",
  "listPurchasesWaitingForCustomer",
  "getCustomerPurchaseRecord",
  "verifyPurchase",
  "rejectPurchase",
  "raisePurchaseDispute",
]);

/**
 * Browser-client Auth routes (Firebase Web SDK Email/Password: register, sign in, profile lookup,
 * token refresh). Exact method + path; the query string may only carry `key`.
 */
export const AUTH_ROUTES = Object.freeze([
  ["POST", "/identitytoolkit.googleapis.com/v1/accounts:signUp"],
  ["POST", "/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword"],
  ["POST", "/identitytoolkit.googleapis.com/v1/accounts:lookup"],
  ["POST", "/securetoken.googleapis.com/v1/token"],
]);

export const MAX_BODY_BYTES = 256 * 1024;

/** Identity + decision markers: the verifier accepts a denial only when the PROXY produced it. */
export const PROXY_ID = "11thonus-phone-preview";
export const IDENTITY_PATH = "/__phone-preview/identity";
export const HEADER_PROXY = "x-phone-preview-proxy";
export const HEADER_DECISION = "x-phone-preview-decision";
export const BUNDLE_META_FILE = "phone-preview.json";
export const DENY_BODY = "phone-preview: denied";
