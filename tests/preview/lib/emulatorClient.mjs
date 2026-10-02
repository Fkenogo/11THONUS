// Founder Preview (EA-002) — minimal client for the local Firebase emulators.
//
// Only talks to loopback. Real sign-up / sign-in happens against the Auth emulator's
// identitytoolkit REST surface (the same one the web SDK uses), and every product
// write goes through the Functions emulator's real callable endpoints with the
// resulting ID token — exactly what the web app does. Nothing here bypasses a callable.
import { LOOPBACK, PROJECT_ID, ports, urls } from "./config.mjs";

export class CallableError extends Error {
  constructor(name, status, body) {
    super(`callable ${name} failed: ${status} ${JSON.stringify(body)}`);
    this.name = "CallableError";
    this.callable = name;
    this.status = status;
    this.body = body;
  }
}

async function json(response) {
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
}

const identityToolkit = (path) =>
  `${urls.auth}/identitytoolkit.googleapis.com/v1/${path}?key=preview-fake-api-key`;

/** Registers (or signs in, if it already exists) an Email/Password user in the Auth emulator. */
export async function signUpOrIn({ email, password }) {
  const signUp = await fetch(identityToolkit("accounts:signUp"), {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email, password, returnSecureToken: true}),
  });
  const signUpBody = await json(signUp);
  if (signUp.ok) return { idToken: signUpBody.idToken, localId: signUpBody.localId };

  if (signUpBody?.error?.message === "EMAIL_EXISTS") return signIn({ email, password });
  throw new Error(`Auth emulator sign-up failed for ${email}: ${JSON.stringify(signUpBody)}`);
}

export async function signIn({ email, password }) {
  const response = await fetch(identityToolkit("accounts:signInWithPassword"), {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email, password, returnSecureToken: true }),
  });
  const body = await json(response);
  if (!response.ok) {
    throw new Error(`Auth emulator sign-in failed for ${email}: ${JSON.stringify(body)}`);
  }
  return { idToken: body.idToken, localId: body.localId };
}

/** Calls a real callable through the Functions emulator. Returns `result`. */
export async function callable(name, data, { fetchImpl = fetch } = {}) {
  const response = await fetchImpl(`${urls.functions}/${name}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ data }),
  });
  const body = await json(response);
  if (!response.ok || body.error) throw new CallableError(name, response.status, body);
  return body.result;
}

/** Wipes every Auth emulator account (documented emulator REST endpoint). */
export async function clearAuthAccounts() {
  const response = await fetch(`${urls.auth}/emulator/v1/projects/${PROJECT_ID}/accounts`, {
    method: "DELETE",
  });
  if (!response.ok) throw new Error(`Auth emulator clear failed: ${response.status}`);
}

/** Wipes every Firestore emulator document (documented emulator REST endpoint). */
export async function clearFirestore() {
  const response = await fetch(
    `${urls.firestore}/emulator/v1/projects/${PROJECT_ID}/databases/(default)/documents`,
    { method: "DELETE" },
  );
  if (!response.ok) throw new Error(`Firestore emulator clear failed: ${response.status}`);
}

/** True when the Auth, Functions and Firestore emulators all answer on loopback. */
export async function emulatorsReady() {
  const targets = [
    `http://${LOOPBACK}:${ports.auth}/`,
    `${urls.functions}/ping`,
    `http://${LOOPBACK}:${ports.firestore}/`,
  ];
  try {
    const results = await Promise.all(targets.map((url) => fetch(url)));
    return results.every((r) => r.status < 500);
  } catch {
    return false;
  }
}

/**
 * Completes the real email-verification flow against the Auth emulator: request the
 * verification code (`sendOobCode`), read it from the emulator's local OOB inbox, and
 * redeem it (`accounts:update` with the code) — exactly what clicking the emailed link
 * does. Needed because staff-invitation acceptance requires a *verified* email
 * (`lookupVerifiedContactByFirebaseUid`); the preview does not weaken that rule.
 */
export async function verifyEmailViaEmulator({ idToken, email }) {
  const send = await fetch(identityToolkit("accounts:sendOobCode"), {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ requestType: "VERIFY_EMAIL", idToken }),
  });
  if (!send.ok) throw new Error(`Auth emulator sendOobCode failed: ${send.status}`);

  const inbox = await fetch(`${urls.auth}/emulator/v1/projects/${PROJECT_ID}/oobCodes`);
  const { oobCodes = [] } = await json(inbox);
  const match = [...oobCodes].reverse().find((c) => c.email === email && c.requestType === "VERIFY_EMAIL");
  if (!match) throw new Error(`No verification code found in the Auth emulator for ${email}.`);

  const redeem = await fetch(identityToolkit("accounts:update"), {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ oobCode: match.oobCode }),
  });
  if (!redeem.ok) throw new Error(`Auth emulator email verification failed: ${redeem.status}`);
}
