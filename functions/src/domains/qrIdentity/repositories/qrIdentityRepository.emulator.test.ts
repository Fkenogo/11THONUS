import { deleteApp, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import {
  issueQrIdentityForIdentity,
  regenerateQrIdentityForIdentity,
  getActiveQrIdentityByCustomerIdentityId,
  getActiveQrIdentityByReference,
  getQrIdentityRecordForAudit,
} from "./qrIdentityRepository";
import { QrIdentityDomainError } from "../models/qrIdentityErrors";
import type { QrReferenceGenerator } from "../services/qrReferenceGenerator";
import type { EventActor } from "../../../shared/events/domainEvent";

// Real Firestore round trip against the Firebase Emulator Suite. Not run
// as part of `pnpm test` — see `pnpm test:emulator`.

const app = initializeApp({ projectId: "demo-11thonus" }, "qrIdentityRepositoryEmulatorTest");
const db = getFirestore(app);

const actor: EventActor = { actorType: "system", actorId: "system" };

class SequenceGenerator implements QrReferenceGenerator {
  private index = 0;
  constructor(private readonly sequence: string[]) {}
  generateReference(): string {
    const value = this.sequence[this.index];
    if (value === undefined) {
      throw new Error("SequenceGenerator exhausted");
    }
    this.index++;
    return value;
  }
}

function buildIssueParams(
  customerIdentityId: string,
  idempotencyKey: string,
  generator: QrReferenceGenerator,
) {
  return {
    eventId: `evt_${idempotencyKey}`,
    correlationId: `corr_${idempotencyKey}`,
    actor,
    occurredAt: "2026-08-04T00:00:00.000Z",
    customerIdentityId,
    loyaltyNumber: "ABC234",
    issuedAt: new Date("2026-08-04T00:00:00.000Z"),
    createdBy: customerIdentityId,
    generator,
    idempotencyKey,
    requestHash: `hash_${idempotencyKey}`,
  };
}

function buildRegenerateParams(
  customerIdentityId: string,
  idempotencyKey: string,
  generator: QrReferenceGenerator,
) {
  return {
    eventId: `evt_${idempotencyKey}`,
    correlationId: `corr_${idempotencyKey}`,
    actor,
    occurredAt: "2026-08-04T00:00:00.000Z",
    customerIdentityId,
    regeneratedAt: new Date("2026-08-04T01:00:00.000Z"),
    createdBy: customerIdentityId,
    generator,
    idempotencyKey,
    requestHash: `hash_${idempotencyKey}`,
  };
}

afterAll(async () => {
  await Promise.all(getApps().map((a) => deleteApp(a)));
});

beforeAll(() => {
  if (!process.env["FIRESTORE_EMULATOR_HOST"]) {
    throw new Error(
      "FIRESTORE_EMULATOR_HOST is not set — this test requires the Firebase Emulator Suite. Run via `pnpm emulators:validate` or `pnpm test:emulator` inside `firebase emulators:exec`.",
    );
  }
});

beforeEach(async () => {
  for (const collection of [
    "qrIdentityRecords",
    "customerProfiles",
    "idempotencyRecords",
    "outboxEntries",
  ]) {
    const snapshot = await db.collection(collection).get();
    await Promise.all(snapshot.docs.map((doc) => doc.ref.delete()));
  }
});

describe("issueQrIdentityForIdentity", () => {
  it("persists a new qrIdentityRecords record and the customerProfiles projection", async () => {
    const association = await issueQrIdentityForIdentity(
      db,
      buildIssueParams("cust_1", "key_1", new SequenceGenerator(["ref_1"])),
    );

    expect(association.qrReference).toBe("ref_1");
    expect(association.status).toBe("active");

    const record = await db.collection("qrIdentityRecords").doc("ref_1").get();
    expect(record.exists).toBe(true);
    expect(record.data()?.["customerIdentityId"]).toBe("cust_1");

    const profile = await db.collection("customerProfiles").doc("cust_1").get();
    expect(profile.data()?.["qrReference"]).toBe("ref_1");
  });

  it("writes an outbox entry for the issuance event", async () => {
    await issueQrIdentityForIdentity(
      db,
      buildIssueParams("cust_2", "key_2", new SequenceGenerator(["ref_2"])),
    );

    const snapshot = await db.collection("outboxEntries").get();
    const events = snapshot.docs.map((doc) => doc.data()["event"]);
    expect(events.some((event: { eventType: string }) => event.eventType.includes("issued"))).toBe(
      true,
    );
  });

  it("is idempotent: a repeated call with the same idempotency key returns the same association without a new record", async () => {
    const params = buildIssueParams("cust_3", "key_3", new SequenceGenerator(["ref_3"]));

    const first = await issueQrIdentityForIdentity(db, params);
    const second = await issueQrIdentityForIdentity(db, params);

    expect(second.qrReference).toBe(first.qrReference);

    const snapshot = await db.collection("qrIdentityRecords").get();
    expect(snapshot.docs).toHaveLength(1);
  });

  it("rejects issuing a new QR over an identity that already has an active one (regeneration is the correct path, per ENG-P2-001-04)", async () => {
    await issueQrIdentityForIdentity(
      db,
      buildIssueParams("cust_3b", "key_3b", new SequenceGenerator(["ref_3b"])),
    );

    await expect(
      issueQrIdentityForIdentity(
        db,
        buildIssueParams("cust_3b", "key_3b_retry", new SequenceGenerator(["ref_3b_unused"])),
      ),
    ).rejects.toThrow(QrIdentityDomainError);

    const snapshot = await db.collection("qrIdentityRecords").get();
    expect(snapshot.docs).toHaveLength(1);
  });
});

describe("regenerateQrIdentityForIdentity", () => {
  it("atomically invalidates the old reference and activates a new one, preserving identity and loyalty number", async () => {
    await issueQrIdentityForIdentity(
      db,
      buildIssueParams("cust_4", "key_4", new SequenceGenerator(["ref_4a"])),
    );

    const result = await regenerateQrIdentityForIdentity(
      db,
      buildRegenerateParams("cust_4", "key_4_regen", new SequenceGenerator(["ref_4b"])),
    );

    expect(result.qrReference).toBe("ref_4b");
    expect(result.customerIdentityId).toBe("cust_4");
    expect(result.loyaltyNumber).toBe("ABC234");
    expect(result.status).toBe("active");

    const oldRecord = await db.collection("qrIdentityRecords").doc("ref_4a").get();
    expect(oldRecord.data()?.["status"]).toBe("invalidated");
    expect(oldRecord.data()?.["replacedByReference"]).toBe("ref_4b");

    const newRecord = await db.collection("qrIdentityRecords").doc("ref_4b").get();
    expect(newRecord.data()?.["status"]).toBe("active");

    const profile = await db.collection("customerProfiles").doc("cust_4").get();
    expect(profile.data()?.["qrReference"]).toBe("ref_4b");
  });

  it("writes outbox entries for both the invalidated and regenerated events", async () => {
    await issueQrIdentityForIdentity(
      db,
      buildIssueParams("cust_5", "key_5", new SequenceGenerator(["ref_5a"])),
    );
    await regenerateQrIdentityForIdentity(
      db,
      buildRegenerateParams("cust_5", "key_5_regen", new SequenceGenerator(["ref_5b"])),
    );

    const snapshot = await db.collection("outboxEntries").get();
    const events = snapshot.docs.map((doc) => doc.data()["event"]);
    expect(events.some((e: { eventType: string }) => e.eventType.includes("invalidated"))).toBe(
      true,
    );
    expect(events.some((e: { eventType: string }) => e.eventType.includes("regenerated"))).toBe(
      true,
    );
  });

  it("rolls back cleanly on failure: regenerating an identity with no active QR leaves no partial write", async () => {
    await expect(
      regenerateQrIdentityForIdentity(
        db,
        buildRegenerateParams("cust_6", "key_6", new SequenceGenerator(["ref_6b"])),
      ),
    ).rejects.toThrow(QrIdentityDomainError);

    const snapshot = await db.collection("qrIdentityRecords").get();
    expect(snapshot.docs).toHaveLength(0);
  });

  it("never leaves the prior reference resolvable for active lookup after regeneration (fails closed)", async () => {
    await issueQrIdentityForIdentity(
      db,
      buildIssueParams("cust_7", "key_7", new SequenceGenerator(["ref_7a"])),
    );
    await regenerateQrIdentityForIdentity(
      db,
      buildRegenerateParams("cust_7", "key_7_regen", new SequenceGenerator(["ref_7b"])),
    );

    await expect(getActiveQrIdentityByReference(db, "ref_7a")).rejects.toThrow(
      QrIdentityDomainError,
    );

    const active = await getActiveQrIdentityByReference(db, "ref_7b");
    expect(active.customerIdentityId).toBe("cust_7");
  });
});

describe("getActiveQrIdentityByCustomerIdentityId", () => {
  it("retrieves the currently active association", async () => {
    await issueQrIdentityForIdentity(
      db,
      buildIssueParams("cust_8", "key_8", new SequenceGenerator(["ref_8"])),
    );

    const association = await getActiveQrIdentityByCustomerIdentityId(db, "cust_8");
    expect(association?.qrReference).toBe("ref_8");
  });

  it("returns undefined for an identity with no issued QR", async () => {
    const association = await getActiveQrIdentityByCustomerIdentityId(db, "does-not-exist");
    expect(association).toBeUndefined();
  });
});

describe("getActiveQrIdentityByReference", () => {
  it("fails closed for an unknown reference", async () => {
    await expect(getActiveQrIdentityByReference(db, "unknown-ref")).rejects.toThrow(
      QrIdentityDomainError,
    );
  });
});

describe("getQrIdentityRecordForAudit", () => {
  it("returns an invalidated record for the audit path, ignoring active-only status", async () => {
    await issueQrIdentityForIdentity(
      db,
      buildIssueParams("cust_9", "key_9", new SequenceGenerator(["ref_9a"])),
    );
    await regenerateQrIdentityForIdentity(
      db,
      buildRegenerateParams("cust_9", "key_9_regen", new SequenceGenerator(["ref_9b"])),
    );

    const record = await getQrIdentityRecordForAudit(db, "ref_9a");
    expect(record?.status).toBe("invalidated");
  });
});
