import { describe, expect, it } from "vitest";
import { isValidCommandEnvelopeShape } from "./requestValidation";

const validEnvelope = {
  commandId: "cmd-1",
  commandType: "purchase.recordPurchase.v1",
  commandVersion: 1,
  idempotencyKey: "idem-1",
  actor: { userId: "user-1", authUid: "auth-1" },
  correlationId: "corr-1",
  payload: { amount: 100 },
};

describe("isValidCommandEnvelopeShape", () => {
  it("accepts a well-formed envelope", () => {
    expect(isValidCommandEnvelopeShape(validEnvelope)).toBe(true);
  });

  it.each([
    "commandId",
    "commandType",
    "commandVersion",
    "idempotencyKey",
    "correlationId",
    "actor",
  ])("rejects an envelope missing %s", (field) => {
    const rest: Record<string, unknown> = { ...validEnvelope };
    delete rest[field];
    expect(isValidCommandEnvelopeShape(rest)).toBe(false);
  });

  it("rejects a non-object value", () => {
    expect(isValidCommandEnvelopeShape("not an object")).toBe(false);
    expect(isValidCommandEnvelopeShape(null)).toBe(false);
    expect(isValidCommandEnvelopeShape(undefined)).toBe(false);
  });

  it("rejects an envelope whose actor is not an object", () => {
    expect(isValidCommandEnvelopeShape({ ...validEnvelope, actor: "not-an-object" })).toBe(false);
  });

  it("rejects an envelope with no payload key at all", () => {
    const rest: Record<string, unknown> = { ...validEnvelope };
    delete rest["payload"];
    expect(isValidCommandEnvelopeShape(rest)).toBe(false);
  });
});
