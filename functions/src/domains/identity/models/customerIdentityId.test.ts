import { describe, expect, it } from "vitest";
import { createCustomerIdentityId } from "./customerIdentityId";
import { InvalidCustomerIdentityIdError } from "./identityErrors";

describe("createCustomerIdentityId", () => {
  it("accepts a non-empty string and returns it as the identity id", () => {
    const id = createCustomerIdentityId("cust_9f3a1c2b");
    expect(id).toBe("cust_9f3a1c2b");
  });

  it("rejects an empty string", () => {
    expect(() => createCustomerIdentityId("")).toThrow(InvalidCustomerIdentityIdError);
  });

  it("rejects a whitespace-only string", () => {
    expect(() => createCustomerIdentityId("   ")).toThrow(InvalidCustomerIdentityIdError);
  });
});
