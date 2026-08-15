/**
 * Unit-level proof that a thrown Firestore SDK error is caught and mapped
 * to `"transient_failure"` (design §11 `TEMPORARY_UNAVAILABLE`), not
 * propagated as an uncaught exception. Uses a minimal mock `Firestore`
 * rather than the emulator — this specifically isolates the catch branch
 * (`businessRepository.emulator.test.ts` proves the real-document-read
 * path against genuine Firestore state).
 */

import { describe, it, expect, vi } from "vitest";
import { getBusinessById } from "./businessRepository";
import type { Firestore } from "firebase-admin/firestore";

function dbThatThrowsOnGet(): Firestore {
  const doc = { get: vi.fn().mockRejectedValue(new Error("simulated Firestore unavailable")) };
  const collection = { doc: vi.fn().mockReturnValue(doc) };
  return { collection: vi.fn().mockReturnValue(collection) } as unknown as Firestore;
}

describe("getBusinessById — transient failure handling", () => {
  it("maps a thrown Firestore read error to transient_failure, never allow", async () => {
    const result = await getBusinessById(dbThatThrowsOnGet(), "biz-a");
    expect(result).toEqual({ kind: "transient_failure" });
  });
});
