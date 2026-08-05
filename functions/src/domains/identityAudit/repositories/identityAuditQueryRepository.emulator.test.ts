import { deleteApp, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import type { DomainEvent } from "../../../shared/events/domainEvent";
import { IdentityAuditDomainError } from "../models/identityAuditErrors";
import {
  queryAuditRecordsByCorrelationId,
  queryAuditRecordsByCustomerIdentityId,
  queryAuditRecordsByEventId,
  queryAuditRecordsByEventType,
} from "./identityAuditQueryRepository";

// Real Firestore round trip against the Firebase Emulator Suite. Not run
// as part of `pnpm test` — see `pnpm test:emulator`.

const app = initializeApp(
  { projectId: "demo-11thonus" },
  "identityAuditQueryRepositoryEmulatorTest",
);
const db = getFirestore(app);

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
  const snapshot = await db.collection("outboxEntries").get();
  await Promise.all(snapshot.docs.map((doc) => doc.ref.delete()));
});

function makeEvent(overrides: Partial<DomainEvent<unknown>> = {}): DomainEvent<unknown> {
  return {
    eventId: "evt-1",
    eventType: "identity.customer_identity_activated.v1",
    eventVersion: 1,
    sourceDomain: "identity",
    aggregateType: "customer_identity",
    aggregateId: "cust_1",
    correlationId: "corr-1",
    actor: { actorType: "service", actorId: "svc-1" },
    occurredAt: "2026-08-05T10:00:00.000Z",
    payload: { customerIdentityId: "cust_1", previousStatus: "dormant" },
    ...overrides,
  };
}

async function seedEntry(
  docId: string,
  event: DomainEvent<unknown>,
  createdAt: Date,
  status: "pending" | "processing" | "completed" | "dead_letter" = "completed",
): Promise<void> {
  await db.collection("outboxEntries").doc(docId).set({
    event,
    status,
    retryCount: 0,
    createdAt,
  });
}

describe("queryAuditRecordsByCustomerIdentityId", () => {
  it("returns only records for the given customer identity, newest first", async () => {
    await seedEntry(
      "evt-a",
      makeEvent({ eventId: "evt-a", aggregateId: "cust_1" }),
      new Date("2026-08-05T09:00:00.000Z"),
    );
    await seedEntry(
      "evt-b",
      makeEvent({ eventId: "evt-b", aggregateId: "cust_1" }),
      new Date("2026-08-05T10:00:00.000Z"),
    );
    await seedEntry(
      "evt-other",
      makeEvent({ eventId: "evt-other", aggregateId: "cust_2" }),
      new Date("2026-08-05T09:30:00.000Z"),
    );

    const result = await queryAuditRecordsByCustomerIdentityId(db, "cust_1", "internal_service");

    expect(result.records.map((r) => r.eventId)).toEqual(["evt-b", "evt-a"]);
    expect(result.hasMore).toBe(false);
  });

  it("rejects an unrecognised authority category", async () => {
    await expect(
      queryAuditRecordsByCustomerIdentityId(db, "cust_1", "caller_supplied_claim"),
    ).rejects.toThrow(IdentityAuditDomainError);
  });

  it("rejects an empty customer identity id", async () => {
    await expect(queryAuditRecordsByCustomerIdentityId(db, "", "internal_service")).rejects.toThrow(
      IdentityAuditDomainError,
    );
  });

  it("bounds results by limit and reports hasMore", async () => {
    for (let i = 0; i < 3; i += 1) {
      await seedEntry(
        `evt-${i}`,
        makeEvent({ eventId: `evt-${i}`, aggregateId: "cust_bounded" }),
        new Date(`2026-08-05T0${i}:00:00.000Z`),
      );
    }

    const result = await queryAuditRecordsByCustomerIdentityId(
      db,
      "cust_bounded",
      "internal_service",
      {
        limit: 2,
      },
    );

    expect(result.records).toHaveLength(2);
    expect(result.hasMore).toBe(true);
  });

  it("filters by an inclusive occurredFrom/occurredTo range", async () => {
    await seedEntry(
      "evt-early",
      makeEvent({ eventId: "evt-early", aggregateId: "cust_range" }),
      new Date("2026-08-01T00:00:00.000Z"),
    );
    await seedEntry(
      "evt-mid",
      makeEvent({ eventId: "evt-mid", aggregateId: "cust_range" }),
      new Date("2026-08-05T00:00:00.000Z"),
    );
    await seedEntry(
      "evt-late",
      makeEvent({ eventId: "evt-late", aggregateId: "cust_range" }),
      new Date("2026-08-10T00:00:00.000Z"),
    );

    const result = await queryAuditRecordsByCustomerIdentityId(
      db,
      "cust_range",
      "internal_service",
      {
        occurredFrom: "2026-08-03T00:00:00.000Z",
        occurredTo: "2026-08-07T00:00:00.000Z",
      },
    );

    expect(result.records.map((r) => r.eventId)).toEqual(["evt-mid"]);
  });

  it("rejects a time range whose end precedes its start", async () => {
    await expect(
      queryAuditRecordsByCustomerIdentityId(db, "cust_1", "internal_service", {
        occurredFrom: "2026-08-10T00:00:00.000Z",
        occurredTo: "2026-08-01T00:00:00.000Z",
      }),
    ).rejects.toThrow(IdentityAuditDomainError);
  });

  it("never exposes internal outbox processing fields in returned records", async () => {
    await seedEntry(
      "evt-clean",
      makeEvent({ eventId: "evt-clean", aggregateId: "cust_clean" }),
      new Date("2026-08-05T10:00:00.000Z"),
    );

    const result = await queryAuditRecordsByCustomerIdentityId(
      db,
      "cust_clean",
      "internal_service",
    );

    expect(result.records[0]).not.toHaveProperty("retryCount");
    expect(result.records[0]).not.toHaveProperty("lastError");
    expect(result.records[0]).not.toHaveProperty("deadLetter");
    expect(result.records[0]).not.toHaveProperty("claimedAt");
  });

  it("skips a malformed outbox record and still returns the valid ones (fails safe)", async () => {
    await db
      .collection("outboxEntries")
      .doc("evt-malformed")
      .set({
        status: "completed",
        retryCount: 0,
        createdAt: new Date("2026-08-05T10:00:00.000Z"),
        // no `event` field at all
      });
    await seedEntry(
      "evt-valid",
      makeEvent({ eventId: "evt-valid", aggregateId: "cust_malformed" }),
      new Date("2026-08-05T09:00:00.000Z"),
    );

    // Force both docs into the same query window by aggregate — the
    // malformed doc has no aggregateId to match on, so query by a wide
    // event-type window instead to include it in the raw candidate set.
    const result = await queryAuditRecordsByEventType(
      db,
      "identity.customer_identity_activated.v1",
      "internal_service",
    );

    expect(result.records.map((r) => r.eventId)).toEqual(["evt-valid"]);
  });
});

describe("queryAuditRecordsByCorrelationId", () => {
  it("returns only records for the given correlation id", async () => {
    await seedEntry(
      "evt-c1",
      makeEvent({ eventId: "evt-c1", correlationId: "corr-shared" }),
      new Date("2026-08-05T09:00:00.000Z"),
    );
    await seedEntry(
      "evt-c2",
      makeEvent({ eventId: "evt-c2", correlationId: "corr-other" }),
      new Date("2026-08-05T09:05:00.000Z"),
    );

    const result = await queryAuditRecordsByCorrelationId(db, "corr-shared", "support");

    expect(result.records.map((r) => r.eventId)).toEqual(["evt-c1"]);
  });
});

describe("queryAuditRecordsByEventType", () => {
  it("returns only records for the given event type", async () => {
    await seedEntry(
      "evt-t1",
      makeEvent({ eventId: "evt-t1", eventType: "identity.identity_recovered.v1" }),
      new Date("2026-08-05T09:00:00.000Z"),
    );
    await seedEntry(
      "evt-t2",
      makeEvent({ eventId: "evt-t2", eventType: "identity.customer_identity_activated.v1" }),
      new Date("2026-08-05T09:05:00.000Z"),
    );

    const result = await queryAuditRecordsByEventType(
      db,
      "identity.identity_recovered.v1",
      "security_review",
    );

    expect(result.records.map((r) => r.eventId)).toEqual(["evt-t1"]);
  });
});

describe("queryAuditRecordsByEventId", () => {
  it("returns every sub-event of a multi-event command sharing one eventId, as distinct records", async () => {
    const sharedEventId = "cmd-multi-1";
    await seedEntry(
      "cmd-multi-1-0",
      makeEvent({
        eventId: sharedEventId,
        eventType: "loyaltyNumber.loyalty_number_issuance_collision_detected.v1",
      }),
      new Date("2026-08-05T09:00:00.000Z"),
    );
    await seedEntry(
      "cmd-multi-1-1",
      makeEvent({ eventId: sharedEventId, eventType: "loyaltyNumber.loyalty_number_issued.v1" }),
      new Date("2026-08-05T09:00:01.000Z"),
    );

    const result = await queryAuditRecordsByEventId(db, sharedEventId, "compliance_review");

    expect(result.records).toHaveLength(2);
    expect(result.records.every((r) => r.eventId === sharedEventId)).toBe(true);
  });

  it("rejects an empty event id", async () => {
    await expect(queryAuditRecordsByEventId(db, "", "administrator")).rejects.toThrow(
      IdentityAuditDomainError,
    );
  });
});
