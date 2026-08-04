import { describe, expect, it } from "vitest";
import { createQrPayload, serializeQrPayload, parseQrPayload } from "./qrPayload";
import { createQrReference } from "./qrReference";
import { QrIdentityDomainError } from "./qrIdentityErrors";

describe("createQrPayload", () => {
  it("wraps a valid QR reference", () => {
    const reference = createQrReference("abc123");
    const payload = createQrPayload(reference);
    expect(payload.qrReference).toBe("abc123");
  });

  it("contains only the approved qrReference field — no other keys ever appear", () => {
    const payload = createQrPayload(createQrReference("abc123"));
    expect(Object.keys(payload)).toEqual(["qrReference"]);
  });

  it("never carries name, phone, email, trust state, auth data, reward balance, or purchase history", () => {
    const payload = createQrPayload(createQrReference("abc123"));
    const serialized = JSON.stringify(payload);
    for (const forbidden of [
      "name",
      "phone",
      "email",
      "trust",
      "auth",
      "reward",
      "purchase",
      "balance",
    ]) {
      expect(serialized.toLowerCase()).not.toContain(forbidden);
    }
  });
});

describe("serializeQrPayload", () => {
  it("serializes to exactly the opaque reference, nothing more", () => {
    const payload = createQrPayload(createQrReference("abc123"));
    expect(serializeQrPayload(payload)).toBe("abc123");
  });
});

describe("parseQrPayload", () => {
  it("parses a raw reference string back into a payload", () => {
    const payload = parseQrPayload("abc123");
    expect(payload.qrReference).toBe("abc123");
  });

  it("rejects malformed raw payload input", () => {
    expect(() => parseQrPayload("")).toThrow(QrIdentityDomainError);
    expect(() => parseQrPayload('{"qrReference":"abc123","name":"x"}')).toThrow(
      QrIdentityDomainError,
    );
  });
});
