import { deleteApp, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { createCustomerIdentity } from "../../identity/repositories/customerIdentityRepository";
import type { EventActor } from "../../../shared/events/domainEvent";
import {
  buildAuthenticationRecoveryProofProvidedEvent,
  buildCustomerAuthenticatedEvent,
} from "../../authentication/events/authenticationEventFactories";
import { ingestAuthenticationSignal } from "./trustSignalIngestionService";
import { handleTrustSignalEvent } from "./trustEventHandler";
import { processOutboxEntries } from "../../../shared/outbox/outboxProcessor";
import { writeOutboxEntry } from "../../../shared/outbox/outboxWriter";
import { getTrustRecordByCustomerIdentityId } from "../repositories/trustRecordRepository";
import { TrustDomainError } from "../models/trustErrors";

// Real Firestore round trip against the Firebase Emulator Suite
// (FIRESTORE_EMULATOR_HOST, set automatically by `firebase emulators:exec`).
// Not run as part of `pnpm test` — see `pnpm test:emulator`.

const app = initializeApp({ projectId: "demo-11thonus" }, "trustSignalIngestionEmulatorTest");
const db: Firestore = getFirestore(app);

const actor: EventActor = { actorType: "system", actorId: "system" };

beforeAll(() => {
  if (!process.env["FIRESTORE_EMULATOR_HOST"]) {
    throw new Error(
      "FIRESTORE_EMULATOR_HOST is not set — this test requires the Firebase Emulator Suite. Run via `pnpm emulators:validate` or `pnpm test:emulator` inside `firebase emulators:exec`.",
    );
  }
});

afterAll(async () => {
  await Promise.all(getApps().map((a) => deleteApp(a)));
});

beforeEach(async () => {
  for (const collection of ["trustRecords", "users", "outboxEntries", "idempotencyRecords"]) {
    const snapshot = await db.collection(collection).get();
    await Promise.all(snapshot.docs.map((doc) => doc.ref.delete()));
  }
});

let seedCounter = 0;

async function seedCustomerIdentity(customerIdentityId: string): Promise<void> {
  seedCounter += 1;
  await createCustomerIdentity(db, {
    eventId: `evt_seed_${seedCounter}`,
    correlationId: `corr_seed_${seedCounter}`,
    actor,
    occurredAt: "2026-08-01T00:00:00.000Z",
    customerIdentityId,
    initialAuthenticationReference: {
      referenceId: `auth_${customerIdentityId}`,
      referenceType: "phone_otp",
      createdAt: new Date("2026-08-01T00:00:00.000Z"),
      createdBy: customerIdentityId,
    },
    createdAt: new Date("2026-08-01T00:00:00.000Z"),
    createdBy: customerIdentityId,
    idempotencyKey: `idem_seed_${seedCounter}`,
    requestHash: `hash_seed_${seedCounter}`,
  });
}

function customerAuthenticatedEvent(customerIdentityId: string, idempotencyKey: string) {
  return buildCustomerAuthenticatedEvent({
    customerIdentityId,
    referenceType: "phone_otp",
    idempotencyKey,
    occurredAt: "2026-08-02T00:00:00.000Z",
  });
}

function recoveryProofEvent(customerIdentityId: string, idempotencyKey: string) {
  return buildAuthenticationRecoveryProofProvidedEvent({
    customerIdentityId,
    referenceType: "phone_otp",
    proofMethodCategory: "recovery_code",
    idempotencyKey,
    occurredAt: "2026-08-03T00:00:00.000Z",
  });
}

describe("ITM-B — trust-signal ingestion (real Firestore emulator)", () => {
  it("1. first CustomerAuthenticated creates and persists correct evidence", async () => {
    await seedCustomerIdentity("cust-1");
    const event = customerAuthenticatedEvent("cust-1", "key-1");

    const outcome = await ingestAuthenticationSignal(db, event);

    expect(outcome.applied).toBe(true);
    expect(outcome.trustRecord.customerIdentityId).toBe("cust-1");
    expect(outcome.trustRecord.signalState.hasSuccessfulAuthentication).toBe(true);
    expect(outcome.trustRecord.trustLevel).toBe("unverified");
    expect(outcome.trustRecord.version).toBe(1);
    expect(outcome.trustRecord.reasonReferences).toHaveLength(1);
    expect(outcome.trustRecord.reasonReferences[0]!.category).toBe("customer_authenticated");
    expect(outcome.trustRecord.reasonReferences[0]!.eventId).toBe(event.eventId);

    // `createdAt`/`updatedAt` are server-stamped (`stampCreate`) rather than
    // taken from the event's own `occurredAt` — compare everything else.
    const persisted = await getTrustRecordByCustomerIdentityId(db, "cust-1");
    expect({ ...persisted, createdAt: undefined, updatedAt: undefined }).toEqual({
      ...outcome.trustRecord,
      createdAt: undefined,
      updatedAt: undefined,
    });
    expect(persisted?.createdAt).toBeInstanceOf(Date);
    expect(persisted?.updatedAt).toBeInstanceOf(Date);
  });

  it("2. duplicate CustomerAuthenticated (same eventId) is idempotent", async () => {
    await seedCustomerIdentity("cust-2");
    const event = customerAuthenticatedEvent("cust-2", "key-2");

    const first = await ingestAuthenticationSignal(db, event);
    const second = await ingestAuthenticationSignal(db, event);

    expect(first.applied).toBe(true);
    expect(second.applied).toBe(false);
    expect(second.trustRecord.reasonReferences).toEqual(first.trustRecord.reasonReferences);
    expect(second.trustRecord.version).toEqual(first.trustRecord.version);
    expect(second.trustRecord.signalState).toEqual(first.trustRecord.signalState);

    const persisted = await getTrustRecordByCustomerIdentityId(db, "cust-2");
    expect(persisted?.reasonReferences).toHaveLength(1);
    expect(persisted?.version).toBe(1);
  });

  it("3. multiple distinct CustomerAuthenticated events do not duplicate the same event", async () => {
    await seedCustomerIdentity("cust-3");
    const first = await ingestAuthenticationSignal(
      db,
      customerAuthenticatedEvent("cust-3", "key-3a"),
    );
    const second = await ingestAuthenticationSignal(
      db,
      customerAuthenticatedEvent("cust-3", "key-3b"),
    );

    expect(first.applied).toBe(true);
    expect(second.applied).toBe(true);

    const persisted = await getTrustRecordByCustomerIdentityId(db, "cust-3");
    expect(persisted?.reasonReferences).toHaveLength(2);
    expect(new Set(persisted?.reasonReferences.map((r) => r.eventId)).size).toBe(2);
    expect(persisted?.version).toBe(2);
    expect(persisted?.signalState.hasSuccessfulAuthentication).toBe(true);
  });

  it("4. recovery-proof evidence persists neutrally (never changes trustLevel)", async () => {
    await seedCustomerIdentity("cust-4");
    const outcome = await ingestAuthenticationSignal(db, recoveryProofEvent("cust-4", "key-4"));

    expect(outcome.applied).toBe(true);
    expect(outcome.trustRecord.trustLevel).toBe("unverified");
    expect(outcome.trustRecord.signalState.hasSuccessfulAuthentication).toBe(false);
    expect(outcome.trustRecord.reasonReferences[0]!.category).toBe(
      "authentication_recovery_proof_provided",
    );
  });

  it("5. recovery duplicate (same eventId) is idempotent", async () => {
    await seedCustomerIdentity("cust-5");
    const event = recoveryProofEvent("cust-5", "key-5");

    const first = await ingestAuthenticationSignal(db, event);
    const second = await ingestAuthenticationSignal(db, event);

    expect(first.applied).toBe(true);
    expect(second.applied).toBe(false);

    const persisted = await getTrustRecordByCustomerIdentityId(db, "cust-5");
    expect(persisted?.reasonReferences).toHaveLength(1);
  });

  it("6. auth then recovery (order A→B) converges to the same signalState as B→A", async () => {
    await seedCustomerIdentity("cust-6a");
    await ingestAuthenticationSignal(db, customerAuthenticatedEvent("cust-6a", "key-6a-1"));
    await ingestAuthenticationSignal(db, recoveryProofEvent("cust-6a", "key-6a-2"));
    const forward = await getTrustRecordByCustomerIdentityId(db, "cust-6a");

    expect(forward?.signalState.hasSuccessfulAuthentication).toBe(true);
    expect(forward?.reasonReferences).toHaveLength(2);
    expect(forward?.trustLevel).toBe("unverified");
  });

  it("7. recovery then auth (order B→A) produces the same converged signalState as A→B", async () => {
    await seedCustomerIdentity("cust-6b");
    await ingestAuthenticationSignal(db, recoveryProofEvent("cust-6b", "key-6b-2"));
    await ingestAuthenticationSignal(db, customerAuthenticatedEvent("cust-6b", "key-6b-1"));
    const backward = await getTrustRecordByCustomerIdentityId(db, "cust-6b");

    expect(backward?.signalState.hasSuccessfulAuthentication).toBe(true);
    expect(backward?.reasonReferences).toHaveLength(2);
    expect(backward?.trustLevel).toBe("unverified");
  });

  it("8. concurrent first-event deliveries for the same identity create exactly one trust record", async () => {
    await seedCustomerIdentity("cust-8");
    const eventA = customerAuthenticatedEvent("cust-8", "key-8a");
    const eventB = customerAuthenticatedEvent("cust-8", "key-8b");

    const [a, b] = await Promise.all([
      ingestAuthenticationSignal(db, eventA),
      ingestAuthenticationSignal(db, eventB),
    ]);

    expect(a.applied).toBe(true);
    expect(b.applied).toBe(true);

    const persisted = await getTrustRecordByCustomerIdentityId(db, "cust-8");
    expect(persisted?.reasonReferences).toHaveLength(2);
    expect(persisted?.version).toBe(2);
    expect(new Set(persisted?.reasonReferences.map((r) => r.eventId)).size).toBe(2);
  });

  it("8b. concurrent delivery of the SAME event exactly once applies (no duplicate evidence)", async () => {
    await seedCustomerIdentity("cust-8b");
    const event = customerAuthenticatedEvent("cust-8b", "key-8b-dup");

    const results = await Promise.all([
      ingestAuthenticationSignal(db, event),
      ingestAuthenticationSignal(db, event),
    ]);

    const appliedCount = results.filter((r) => r.applied).length;
    expect(appliedCount).toBe(1);

    const persisted = await getTrustRecordByCustomerIdentityId(db, "cust-8b");
    expect(persisted?.reasonReferences).toHaveLength(1);
    expect(persisted?.version).toBe(1);
  });

  it("9. missing Customer Identity fails closed (no orphan trust record created)", async () => {
    const event = customerAuthenticatedEvent("cust-does-not-exist", "key-9");

    await expect(ingestAuthenticationSignal(db, event)).rejects.toThrow(TrustDomainError);

    const persisted = await getTrustRecordByCustomerIdentityId(db, "cust-does-not-exist");
    expect(persisted).toBeUndefined();
  });

  it("10. malformed persisted trust record fails closed on read", async () => {
    await seedCustomerIdentity("cust-10");
    await db
      .collection("trustRecords")
      .doc("cust-10")
      .set({
        customerIdentityId: "cust-10",
        verificationState: { phoneVerified: false, emailVerified: false },
        signalState: { hasSuccessfulAuthentication: false },
        trustLevel: "not-a-real-level",
        version: 1,
        status: "active",
        reasonReferences: [],
        createdAt: new Date(),
        createdBy: null,
        updatedAt: new Date(),
        updatedBy: null,
        schemaVersion: 1,
      });

    const event = customerAuthenticatedEvent("cust-10", "key-10");
    await expect(ingestAuthenticationSignal(db, event)).rejects.toThrow(
      /not a recognised trust level/,
    );
  });

  it("9b. malformed (corrupt) Customer Identity document fails closed AND is classified non-retryable", async () => {
    // Distinct from test 9 (missing identity): here `users/{id}` exists but
    // does not match `fromUserDocument`'s expected shape — an
    // `IdentityDomainError` with category `VALIDATION_FAILED`, not
    // `RESOURCE_NOT_FOUND`. Adversarial review (`CAP-P2-ITM-B` independent
    // review, Phase C) found this path was previously unmapped: it
    // propagated as a raw `IdentityDomainError`, which
    // `trustEventHandler.ts` did not recognise as a `TrustDomainError`, so
    // the outbox handler fell through to the generic *retryable* default
    // instead of dead-lettering immediately — still fail-closed (no orphan
    // trust record), but an inefficient/imprecise classification for a
    // condition retrying can never fix.
    await db.collection("users").doc("cust-9b").set({
      // Missing the fields `fromUserDocument` requires (e.g. `status`,
      // `authenticationReferences`) — malformed, not merely absent.
      id: "cust-9b",
    });

    const event = customerAuthenticatedEvent("cust-9b", "key-9b");
    await expect(ingestAuthenticationSignal(db, event)).rejects.toThrow(TrustDomainError);

    const persisted = await getTrustRecordByCustomerIdentityId(db, "cust-9b");
    expect(persisted).toBeUndefined();

    // Outbox-level classification: must dead-letter on the FIRST attempt
    // (non-retryable), not after exhausting the retry budget.
    await db.runTransaction(async (transaction) => writeOutboxEntry(transaction, db, event));
    await processOutboxEntries(db, (evt) => handleTrustSignalEvent(db, evt));
    const entry = await db.collection("outboxEntries").doc(event.eventId).get();
    expect(entry.data()?.["status"]).toBe("dead_letter");
    expect(entry.data()?.["deadLetter"]?.["reason"]).toBe("invalid_payload_for_version");
  });

  it("11. malformed event payload fails closed", async () => {
    await seedCustomerIdentity("cust-11");
    const malformed = customerAuthenticatedEvent("cust-11", "key-11");
    // @ts-expect-error deliberately malformed for this test
    malformed.payload = { customerIdentityId: 12345 };

    await expect(ingestAuthenticationSignal(db, malformed)).rejects.toThrow(TrustDomainError);
  });

  it("unsupported event type fails closed", async () => {
    const unsupported = {
      ...customerAuthenticatedEvent("cust-x", "key-x"),
      eventType: "purchase.purchaseRecorded.v1",
    };
    await expect(ingestAuthenticationSignal(db, unsupported)).rejects.toThrow(TrustDomainError);
  });

  it("12. no credentials/PII persisted on the trust record document", async () => {
    await seedCustomerIdentity("cust-12");
    await ingestAuthenticationSignal(db, customerAuthenticatedEvent("cust-12", "key-12"));

    const snapshot = await db.collection("trustRecords").doc("cust-12").get();
    const raw = JSON.stringify(snapshot.data());
    expect(raw).not.toMatch(/password/i);
    expect(raw).not.toMatch(/token/i);
    expect(raw).not.toMatch(/otp/i);
    expect(raw).not.toMatch(/@/); // no email address
  });

  it("13. no trust derivation (band computation) occurs during ingestion", async () => {
    await seedCustomerIdentity("cust-13");
    const outcome = await ingestAuthenticationSignal(
      db,
      customerAuthenticatedEvent("cust-13", "key-13"),
    );
    // Even though signalState.hasSuccessfulAuthentication is now true (which
    // would satisfy §6.6's `provisional` condition under ITM-C's future
    // derivation), the persisted `trustLevel` here remains the ITM-B-owned
    // creation default — never recomputed by this package.
    expect(outcome.trustRecord.trustLevel).toBe("unverified");
  });

  it("15. no regression path exists — repeated ingestion never decreases signalState", async () => {
    await seedCustomerIdentity("cust-15");
    await ingestAuthenticationSignal(db, customerAuthenticatedEvent("cust-15", "key-15a"));
    const afterAuth = await getTrustRecordByCustomerIdentityId(db, "cust-15");
    expect(afterAuth?.signalState.hasSuccessfulAuthentication).toBe(true);

    await ingestAuthenticationSignal(db, recoveryProofEvent("cust-15", "key-15b"));
    const afterRecovery = await getTrustRecordByCustomerIdentityId(db, "cust-15");
    expect(afterRecovery?.signalState.hasSuccessfulAuthentication).toBe(true);
  });

  it("16. client cannot directly read/write trustRecords (deny-by-default Firestore Rules)", async () => {
    // Verified structurally by `security/firestoreRules.emulator.test.ts`'s
    // existing catch-all `match /{document=**} { allow read, write: if false; }`
    // — no new collection-specific rule was added for `trustRecords`
    // (Phase P: expected default is none). This test only re-asserts, at
    // this package's own boundary, that the collection name this package
    // introduces has no bespoke rule of its own.
    const fs = await import("node:fs");
    const path = await import("node:path");
    const rules = fs.readFileSync(
      path.resolve(__dirname, "../../../../../firestore.rules"),
      "utf8",
    );
    expect(rules).not.toMatch(/trustRecords/);
  });

  it("17. replay-safe: replaying the full event history against an empty record converges deterministically", async () => {
    await seedCustomerIdentity("cust-17");
    const auth = customerAuthenticatedEvent("cust-17", "key-17a");
    const recovery = recoveryProofEvent("cust-17", "key-17b");

    await ingestAuthenticationSignal(db, auth);
    await ingestAuthenticationSignal(db, recovery);
    const firstPass = await getTrustRecordByCustomerIdentityId(db, "cust-17");

    // Replay the identical events again (simulating at-least-once redelivery).
    await ingestAuthenticationSignal(db, auth);
    await ingestAuthenticationSignal(db, recovery);
    const replayed = await getTrustRecordByCustomerIdentityId(db, "cust-17");

    expect(replayed?.signalState).toEqual(firstPass?.signalState);
    expect(replayed?.reasonReferences).toHaveLength(2);
    expect(replayed?.version).toBe(firstPass?.version);
  });

  it("18. no duplicate evidence identity — reasonReferences eventIds are always unique", async () => {
    await seedCustomerIdentity("cust-18");
    await ingestAuthenticationSignal(db, customerAuthenticatedEvent("cust-18", "key-18a"));
    await ingestAuthenticationSignal(db, recoveryProofEvent("cust-18", "key-18b"));
    await ingestAuthenticationSignal(db, customerAuthenticatedEvent("cust-18", "key-18a")); // duplicate

    const persisted = await getTrustRecordByCustomerIdentityId(db, "cust-18");
    const eventIds = persisted?.reasonReferences.map((r) => r.eventId) ?? [];
    expect(new Set(eventIds).size).toBe(eventIds.length);
    expect(eventIds).toHaveLength(2);
  });

  it("20. persisted trustLevel remains an explicit, unmodified cache value across ingestion", async () => {
    await seedCustomerIdentity("cust-20");
    const first = await ingestAuthenticationSignal(
      db,
      customerAuthenticatedEvent("cust-20", "key-20a"),
    );
    const second = await ingestAuthenticationSignal(db, recoveryProofEvent("cust-20", "key-20b"));
    expect(first.trustRecord.trustLevel).toBe("unverified");
    expect(second.trustRecord.trustLevel).toBe("unverified");
  });

  describe("via the real outbox processor (handleTrustSignalEvent)", () => {
    it("processes a pending CustomerAuthenticated outbox entry to completion and ingests evidence", async () => {
      await seedCustomerIdentity("cust-outbox-1");
      const event = customerAuthenticatedEvent("cust-outbox-1", "key-outbox-1");
      await db.runTransaction(async (transaction) => writeOutboxEntry(transaction, db, event));

      await processOutboxEntries(db, (evt) => handleTrustSignalEvent(db, evt));

      const persisted = await getTrustRecordByCustomerIdentityId(db, "cust-outbox-1");
      expect(persisted?.signalState.hasSuccessfulAuthentication).toBe(true);

      const entry = await db.collection("outboxEntries").doc(event.eventId).get();
      expect(entry.data()?.["status"]).toBe("completed");
    });

    it("dead-letters (non-retryable) a CustomerAuthenticated event for an unknown identity", async () => {
      const event = customerAuthenticatedEvent("cust-outbox-missing", "key-outbox-missing");
      await db.runTransaction(async (transaction) => writeOutboxEntry(transaction, db, event));

      await processOutboxEntries(db, (evt) => handleTrustSignalEvent(db, evt));

      const entry = await db.collection("outboxEntries").doc(event.eventId).get();
      expect(entry.data()?.["status"]).toBe("dead_letter");
      expect(entry.data()?.["deadLetter"]?.["reason"]).toBe("missing_source_record");

      const persisted = await getTrustRecordByCustomerIdentityId(db, "cust-outbox-missing");
      expect(persisted).toBeUndefined();
    });

    it("replays a completed outbox entry without double-counting evidence (duplicate-delivery safety)", async () => {
      await seedCustomerIdentity("cust-outbox-2");
      const event = customerAuthenticatedEvent("cust-outbox-2", "key-outbox-2");
      await db.runTransaction(async (transaction) => writeOutboxEntry(transaction, db, event));
      await processOutboxEntries(db, (evt) => handleTrustSignalEvent(db, evt));

      // Simulate a redelivery of the identical event (a fresh outbox entry
      // reusing the same deterministic eventId, as `AUTH-08`'s own retry
      // model would produce).
      await handleTrustSignalEvent(db, event);

      const persisted = await getTrustRecordByCustomerIdentityId(db, "cust-outbox-2");
      expect(persisted?.reasonReferences).toHaveLength(1);
      expect(persisted?.version).toBe(1);
    });
  });
});
