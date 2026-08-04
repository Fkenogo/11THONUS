/**
 * Firestore Rules tests for the Customer Identity persistence slice
 * (ENG-P2-001-05) — the first Rules tests in this repository.
 *
 * `users`, `customerProfiles`, `loyaltyNumbers`, and `qrIdentityRecords`
 * are all written exclusively by trusted server-side code (Cloud
 * Functions using the Admin SDK, which bypasses Security Rules
 * entirely). These tests only need to prove the CLIENT-facing posture:
 * every direct client read/write — unauthenticated or authenticated,
 * for a client's own identity or someone else's — is denied. There is
 * no "authenticated owner may read their own record" branch to test
 * because the rules grant none (see `firestore.rules`'s own comment on
 * why no direct customer read is opened yet).
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import { afterAll, beforeAll, beforeEach, describe, it } from "vitest";
import { setDoc, doc, getDoc, updateDoc } from "firebase/firestore";

const RULES_PATH = join(__dirname, "../../../firestore.rules");

function parseEmulatorHost(): { host: string; port: number } {
  const raw = process.env["FIRESTORE_EMULATOR_HOST"];
  if (!raw) {
    throw new Error(
      "FIRESTORE_EMULATOR_HOST is not set — this test requires the Firebase Emulator Suite. Run via `pnpm emulators:validate` or `pnpm test:emulator` inside `firebase emulators:exec`.",
    );
  }
  const [host, portText] = raw.split(":");
  return { host: host ?? "127.0.0.1", port: Number(portText ?? 8080) };
}

let testEnv: RulesTestEnvironment;

beforeAll(async () => {
  const { host, port } = parseEmulatorHost();
  testEnv = await initializeTestEnvironment({
    projectId: "demo-11thonus-rules",
    firestore: {
      rules: readFileSync(RULES_PATH, "utf8"),
      host,
      port,
    },
  });
});

afterAll(async () => {
  await testEnv.cleanup();
});

beforeEach(async () => {
  await testEnv.clearFirestore();
});

const SAMPLE_DOCS: Record<string, Record<string, unknown>> = {
  users: { id: "cust_1", status: "active", schemaVersion: 1 },
  customerProfiles: { id: "cust_1", userId: "cust_1", schemaVersion: 1, status: "active" },
  loyaltyNumbers: { id: "ABC234", loyaltyNumber: "ABC234", customerIdentityId: "cust_1" },
  qrIdentityRecords: {
    id: "ref_1",
    qrReference: "ref_1",
    customerIdentityId: "cust_1",
    status: "active",
  },
};

describe.each(Object.keys(SAMPLE_DOCS))("firestore.rules — %s", (collection) => {
  const sampleDoc = SAMPLE_DOCS[collection]!;
  const docPath = `${collection}/${sampleDoc["id"]}`;

  it("denies an unauthenticated write", async () => {
    const unauthed = testEnv.unauthenticatedContext();
    await assertFails(setDoc(doc(unauthed.firestore(), docPath), sampleDoc));
  });

  it("denies an unauthenticated read", async () => {
    await testEnv.withSecurityRulesDisabled(async (adminContext) => {
      await setDoc(doc(adminContext.firestore(), docPath), sampleDoc);
    });

    const unauthed = testEnv.unauthenticatedContext();
    await assertFails(getDoc(doc(unauthed.firestore(), docPath)));
  });

  it("denies a write from an ordinary authenticated client, even for their own identity", async () => {
    const authed = testEnv.authenticatedContext("cust_1");
    await assertFails(setDoc(doc(authed.firestore(), docPath), sampleDoc));
  });

  it("denies a read from an ordinary authenticated client", async () => {
    await testEnv.withSecurityRulesDisabled(async (adminContext) => {
      await setDoc(doc(adminContext.firestore(), docPath), sampleDoc);
    });

    const authed = testEnv.authenticatedContext("cust_1");
    await assertFails(getDoc(doc(authed.firestore(), docPath)));
  });

  it("denies a write from an authenticated client acting on someone else's identity", async () => {
    const authed = testEnv.authenticatedContext("someone-else");
    await assertFails(setDoc(doc(authed.firestore(), docPath), sampleDoc));
  });
});

describe("firestore.rules — qrIdentityRecords: no client-side status forging", () => {
  it("denies a client attempting to flip an invalidated record back to active", async () => {
    await testEnv.withSecurityRulesDisabled(async (adminContext) => {
      await setDoc(doc(adminContext.firestore(), "qrIdentityRecords/ref_2"), {
        id: "ref_2",
        qrReference: "ref_2",
        customerIdentityId: "cust_1",
        status: "invalidated",
        replacedByReference: "ref_3",
      });
    });

    const authed = testEnv.authenticatedContext("cust_1");
    await assertFails(
      updateDoc(doc(authed.firestore(), "qrIdentityRecords/ref_2"), { status: "active" }),
    );
  });
});

describe("firestore.rules — sanity: the fallback deny-all still holds for an unrelated collection", () => {
  it("denies read/write to a collection with no dedicated match block", async () => {
    const authed = testEnv.authenticatedContext("cust_1");
    await assertFails(
      setDoc(doc(authed.firestore(), "someUnrelatedCollection/doc1"), { value: 1 }),
    );
  });
});

// Sanity check on the harness itself: with rules disabled, admin writes succeed —
// proves failures above come from the rules, not from a broken test setup.
describe("firestore.rules — harness sanity", () => {
  it("allows a write when rules are disabled (proves the harness itself works)", async () => {
    await testEnv.withSecurityRulesDisabled(async (adminContext) => {
      await assertSucceeds(
        setDoc(doc(adminContext.firestore(), "users/cust_sanity"), { id: "cust_sanity" }),
      );
    });
  });
});
