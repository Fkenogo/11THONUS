/**
 * Unit-level proof that a thrown Firestore SDK error is caught and mapped
 * to `"transient_failure"` (design §11 `TEMPORARY_UNAVAILABLE`), not
 * propagated as an uncaught exception. See `businessRepository.test.ts`'s
 * header note for the same rationale.
 */

import { describe, it, expect, vi } from "vitest";
import { getBusinessMembershipByUserAndBusiness } from "./businessMembershipRepository";
import type { Firestore } from "firebase-admin/firestore";

function dbThatThrowsOnQuery(): Firestore {
  const query = {
    where: vi.fn(),
    limit: vi.fn(),
    get: vi.fn().mockRejectedValue(new Error("simulated Firestore unavailable")),
  };
  query.where.mockReturnValue(query);
  query.limit.mockReturnValue(query);
  const collection = { where: vi.fn().mockReturnValue(query) };
  return { collection: vi.fn().mockReturnValue(collection) } as unknown as Firestore;
}

describe("getBusinessMembershipByUserAndBusiness — transient failure handling", () => {
  it("maps a thrown Firestore query error to transient_failure, never allow", async () => {
    const result = await getBusinessMembershipByUserAndBusiness(
      dbThatThrowsOnQuery(),
      "user-1",
      "biz-a",
    );
    expect(result).toEqual({ kind: "transient_failure" });
  });
});
