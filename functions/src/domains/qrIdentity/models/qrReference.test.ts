import { describe, expect, it } from "vitest";
import { createQrReference } from "./qrReference";
import { QrIdentityDomainError } from "./qrIdentityErrors";

describe("createQrReference", () => {
  it("accepts a well-formed opaque token", () => {
    expect(createQrReference("aZ9_-token123")).toBe("aZ9_-token123");
  });

  it("trims surrounding whitespace", () => {
    expect(createQrReference("  token123  ")).toBe("token123");
  });

  it("rejects an empty value", () => {
    expect(() => createQrReference("")).toThrow(QrIdentityDomainError);
    expect(() => createQrReference("   ")).toThrow(QrIdentityDomainError);
  });

  it("rejects characters outside the safe token charset", () => {
    expect(() => createQrReference("token with spaces")).toThrow(QrIdentityDomainError);
    expect(() => createQrReference('{"a":1}')).toThrow(QrIdentityDomainError);
    expect(() => createQrReference("token/with/slash")).toThrow(QrIdentityDomainError);
  });

  it("two references created from equivalent input are equal by value", () => {
    const a = createQrReference("abc123");
    const b = createQrReference(" abc123 ");
    expect(a).toBe(b);
  });

  it("round-trips through JSON unchanged (serialization boundary)", () => {
    const value = createQrReference("abc123");
    const parsed = JSON.parse(JSON.stringify({ qrReference: value })) as { qrReference: string };
    expect(parsed.qrReference).toBe("abc123");
  });

  it("is case-sensitive, unlike the loyalty number (an opaque token, not a human-quoted code)", () => {
    expect(createQrReference("AbC123")).toBe("AbC123");
    expect(createQrReference("AbC123")).not.toBe(createQrReference("abc123"));
  });
});
