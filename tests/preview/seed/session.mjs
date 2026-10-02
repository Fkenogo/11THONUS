// Founder Preview (EA-002) — the seed "session": identity registry, token cache,
// deterministic idempotency keys and thin wrappers over the REAL callables.
//
// Rule of the seed: a product fact is created by calling the same callable the web app
// calls (with a real Auth-emulator ID token). The only in-process service calls are the
// ones that have NO callable today — Platform-Administrator bootstrap, Business activation
// and the Commercial commands (see `adminServices.mjs`).
import fs from "node:fs";
import path from "node:path";
import { callable, signIn, signUpOrIn, verifyEmailViaEmulator } from "../lib/emulatorClient.mjs";
import { repoRoot } from "../lib/config.mjs";

const identitiesPath = path.join(repoRoot, "tests/preview/identities.json");

export function loadIdentities() {
  return JSON.parse(fs.readFileSync(identitiesPath, "utf8"));
}

export class SeedSession {
  constructor({ log = () => {} } = {}) {
    const file = loadIdentities();
    this.password = file.password;
    this.identities = new Map(file.identities.map((i) => [i.key, { ...i }]));
    this.log = log;
    this.tokens = new Map();
    this.keyCounter = 0;
    /** Everything the seed creates that a test might need to look up (ids only; no secrets). */
    this.state = {
      identities: {},
      businesses: {},
      programmes: {},
      qualifyingItems: {},
      purchases: {},
    };
  }

  identity(key) {
    const id = this.identities.get(key);
    if (!id) throw new Error(`Unknown preview identity "${key}".`);
    return id;
  }

  /** Deterministic, ordered idempotency key: the same seed run always produces the same keys. */
  nextKey(label) {
    this.keyCounter += 1;
    return `preview:${String(this.keyCounter).padStart(5, "0")}:${label}`;
  }

  /** Registers the account (Auth emulator) and runs the real `authenticate` callable. */
  async register(key) {
    const identity = this.identity(key);
    const account = await signUpOrIn({ email: identity.email, password: this.password });
    this.tokens.set(key, account.idToken);
    const auth = await callable("authenticate", {
      rawToken: account.idToken,
      referenceType: "email",
      idempotencyKey: this.nextKey(`authenticate:${key}`),
    });
    identity.customerIdentityId = auth.customerIdentityId;
    identity.firebaseUid = account.localId;
    await this.as(key, "setDisplayName", { displayName: identity.displayName });
    this.state.identities[key] = { customerIdentityId: auth.customerIdentityId };
    return identity;
  }

  /** Completes the real email-verification flow (required for invitation acceptance). */
  async verifyEmail(key) {
    const identity = this.identity(key);
    const { idToken } = await signIn({ email: identity.email, password: this.password });
    await verifyEmailViaEmulator({ idToken, email: identity.email });
  }

  async token(key) {
    const cached = this.tokens.get(key);
    if (cached) return cached;
    const identity = this.identity(key);
    const { idToken } = await signIn({ email: identity.email, password: this.password });
    this.tokens.set(key, idToken);
    return idToken;
  }

  /** Calls a real callable as the given identity; adds actor + a deterministic idempotency key. */
  async as(key, name, payload = {}, { idempotent = true } = {}) {
    const rawToken = await this.token(key);
    const data = { ...payload, rawToken, referenceType: "email" };
    if (idempotent && data.idempotencyKey === undefined) {
      data.idempotencyKey = this.nextKey(`${name}:${key}`);
    }
    return callable(name, data);
  }

  /** Read-style callables take no idempotency key. */
  read(key, name, payload = {}) {
    return this.as(key, name, payload, { idempotent: false });
  }
}
