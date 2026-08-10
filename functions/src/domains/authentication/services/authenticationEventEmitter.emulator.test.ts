/**
 * AUTH-08 — authentication event emission against the real Firebase Emulator.
 *
 * Proves the durable, idempotent emission of the two AUTH-08-owned fire-and-forget
 * trust/audit signals through the *actual* shared outbox (`shared/outbox`) and the
 * *actual* merged AUTH-03 registration/sign-in + AUTH-06 recovery paths — wired
 * exactly as the `index.ts` callables wire them (orchestrate, then emit at the
 * composition boundary), so the completed AUTH-03/06/07 service internals stay
 * untouched.
 *
 * Founder-required proofs:
 *   - successful registration authentication emits `CustomerAuthenticated`, and
 *     the state-change events `-01`/`-08` already own are present but NOT
 *     re-emitted by AUTH-08;
 *   - successful returning sign-in emits `CustomerAuthenticated`;
 *   - the same logical authentication retry (same idempotency key) does not
 *     create a second/distinct authentication event, and does not disturb an
 *     already-processed entry (durable at-least-once + idempotent, dedup by
 *     `eventId`);
 *   - successful recovery proof emits `AuthenticationRecoveryProofProvided`, and
 *     the same logical recovery retry preserves event identity;
 *   - no credential/token/OTP/proof material ever enters an outbox payload.
 *
 * Not run under `pnpm test` — see `pnpm test:emulator` / `pnpm emulators:validate`.
 */

import { deleteApp, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { handleAuthenticate } from "./authenticationEndpointService";
import { handleRecoverIdentity } from "./identityRecoveryEndpointService";
import {
  emitAuthenticationRecoveryProofProvided,
  emitCustomerAuthenticated,
} from "./authenticationEventEmitter";
import { createAuthenticatedCredential } from "../models/authenticatedCredential";
import type { AuthenticatedCredential } from "../models/authenticatedCredential";
import type { RawProviderCredential, TokenVerifierPort } from "../ports/tokenVerifierPort";
import type { AuthenticationReferenceType } from "../../identity/models/authenticationReference";

const app = initializeApp({ projectId: "demo-11thonus" }, "authenticationEventEmitterEmulatorTest");
const db = getFirestore(app);

const verifiedAt = new Date("2026-08-10T12:00:00.000Z");

function stubVerifier(referenceId: string): TokenVerifierPort {
  return {
    async verify(raw: RawProviderCredential): Promise<AuthenticatedCredential> {
      return createAuthenticatedCredential({
        referenceType: raw.referenceType,
        referenceId,
        verifiedAt,
        authenticatedAt: verifiedAt,
        providerSignals: { signInProvider: raw.referenceType },
      });
    },
  };
}

async function outboxEventTypes(): Promise<string[]> {
  const snapshot = await db.collection("outboxEntries").get();
  return snapshot.docs.map((d) => d.data().event.eventType as string);
}

async function outboxDocs() {
  const snapshot = await db.collection("outboxEntries").get();
  return snapshot.docs.map((d) => d.data());
}

async function clearOutbox(): Promise<void> {
  const snapshot = await db.collection("outboxEntries").get();
  await Promise.all(snapshot.docs.map((d) => d.ref.delete()));
}

/** Mirror of the `index.ts authenticate` callable composition (AUTH-03 + AUTH-08). */
async function authenticateThenEmit(
  rawToken: string,
  referenceType: AuthenticationReferenceType,
  referenceId: string,
  idempotencyKey: string,
) {
  const result = await handleAuthenticate(
    db,
    { rawToken, referenceType, idempotencyKey },
    { verifier: stubVerifier(referenceId) },
  );
  await emitCustomerAuthenticated(db, {
    customerIdentityId: result.customerIdentityId,
    referenceType: result.session.authReference.referenceType,
    idempotencyKey,
  });
  return result;
}

describe("AUTH-08 authentication event emission (emulator)", () => {
  beforeEach(async () => {
    await clearOutbox();
  });

  afterAll(async () => {
    await deleteApp(app);
  });

  it("emits CustomerAuthenticated on successful registration, without re-emitting -01/-08 state-change events", async () => {
    const result = await authenticateThenEmit("tok-reg", "phone_otp", "uid-reg-1", "idem-reg-1");
    expect(result.mode).toBe("registered");

    const types = await outboxEventTypes();
    // -01 / -08 own and emit these inside the registration transaction:
    expect(types).toContain("identity.customer_identity_registered.v1");
    expect(types).toContain("identity.authentication_reference_linked.v1");
    // AUTH-08 emits exactly this, once:
    expect(types.filter((t) => t === "authentication.customer_authenticated.v1")).toHaveLength(1);
    // AUTH-08 does not duplicate any -01/-08 event:
    expect(types.filter((t) => t === "identity.customer_identity_registered.v1")).toHaveLength(1);
    expect(types.filter((t) => t === "identity.authentication_reference_linked.v1")).toHaveLength(
      1,
    );
  });

  it("emits CustomerAuthenticated on a returning-user sign-in", async () => {
    await authenticateThenEmit("tok-a", "phone_otp", "uid-signin-1", "idem-a");
    await clearOutbox();

    const result = await authenticateThenEmit("tok-a", "phone_otp", "uid-signin-1", "idem-b");
    expect(result.mode).toBe("signed_in");

    const types = await outboxEventTypes();
    expect(types.filter((t) => t === "authentication.customer_authenticated.v1")).toHaveLength(1);
    // Ordinary sign-in mutates no identity — no registration/link re-emitted:
    expect(types).not.toContain("identity.customer_identity_registered.v1");
  });

  it("is idempotent under the same logical authentication retry (single stable event, no reprocessing reset)", async () => {
    await authenticateThenEmit("tok-r", "phone_otp", "uid-retry-1", "idem-retry");

    const before = (await outboxDocs()).filter(
      (d) => d.event.eventType === "authentication.customer_authenticated.v1",
    );
    expect(before).toHaveLength(1);
    const eventId = before[0]!.event.eventId as string;

    // Simulate the processor having already completed the entry.
    await db
      .collection("outboxEntries")
      .doc(eventId)
      .set({ ...before[0], status: "completed" }, { merge: true });

    // Retry of the same logical operation (same idempotency key).
    await authenticateThenEmit("tok-r", "phone_otp", "uid-retry-1", "idem-retry");

    const after = (await outboxDocs()).filter(
      (d) => d.event.eventType === "authentication.customer_authenticated.v1",
    );
    expect(after).toHaveLength(1);
    expect(after[0]!.event.eventId).toBe(eventId);
    // The already-processed entry is NOT reset back to pending:
    expect(after[0]!.status).toBe("completed");
  });

  it("emits AuthenticationRecoveryProofProvided on a successful recovery proof, retry-stable", async () => {
    // Register + then suspend the identity so it is recovery-eligible.
    const reg = await authenticateThenEmit("tok-rec", "phone_otp", "uid-rec-1", "idem-rec-reg");
    const identityRef = db.collection("users").doc(reg.customerIdentityId);
    await identityRef.set({ status: "suspended" }, { merge: true });
    await clearOutbox();

    const recover = async (key: string) => {
      const result = await handleRecoverIdentity(
        db,
        { rawToken: "tok-rec", referenceType: "phone_otp", idempotencyKey: key },
        { verifier: stubVerifier("uid-rec-1") },
      );
      await emitAuthenticationRecoveryProofProvided(db, {
        customerIdentityId: result.customerIdentityId,
        referenceType: "phone_otp",
        proofMethodCategory: result.methodCategory,
        idempotencyKey: key,
      });
      return result;
    };

    await recover("idem-rec-1");
    const types = await outboxEventTypes();
    expect(
      types.filter((t) => t === "authentication.authentication_recovery_proof_provided.v1"),
    ).toHaveLength(1);
    // -06/-07 own IdentityRecovered — AUTH-08 does not emit it:
    expect(types).toContain("identity.identity_recovered.v1");

    const recEvent = (await outboxDocs()).find(
      (d) => d.event.eventType === "authentication.authentication_recovery_proof_provided.v1",
    );
    const eventId = recEvent!.event.eventId as string;

    // Same logical recovery retry preserves event identity (single entry).
    await recover("idem-rec-1");
    const recAfter = (await outboxDocs()).filter(
      (d) => d.event.eventType === "authentication.authentication_recovery_proof_provided.v1",
    );
    expect(recAfter).toHaveLength(1);
    expect(recAfter[0]!.event.eventId).toBe(eventId);
  });

  it("never places credential/token/proof material in an emitted authentication payload", async () => {
    await authenticateThenEmit("super-secret-raw-token", "phone_otp", "uid-priv-1", "idem-priv");
    const authEvent = (await outboxDocs()).find(
      (d) => d.event.eventType === "authentication.customer_authenticated.v1",
    );
    const serialized = JSON.stringify(authEvent!.event.payload);
    expect(serialized).not.toContain("super-secret-raw-token");
    expect(Object.keys(authEvent!.event.payload)).toEqual(["customerIdentityId", "referenceType"]);
  });
});
