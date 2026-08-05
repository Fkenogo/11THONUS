import { describe, expect, it } from "vitest";
import { createAuditQueryAuthority, AUDIT_QUERY_AUTHORITIES } from "./auditQueryAuthority";
import { IdentityAuditDomainError } from "./identityAuditErrors";

describe("createAuditQueryAuthority", () => {
  it.each(AUDIT_QUERY_AUTHORITIES)("accepts the known authority category %s", (value) => {
    expect(createAuditQueryAuthority(value)).toBe(value);
  });

  it("rejects an unrecognised authority category", () => {
    expect(() => createAuditQueryAuthority("caller_supplied_claim")).toThrow(
      IdentityAuditDomainError,
    );
  });

  it("rejects an empty string", () => {
    expect(() => createAuditQueryAuthority("")).toThrow(IdentityAuditDomainError);
  });
});
