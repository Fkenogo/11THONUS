import { describe, expect, it } from "vitest";
import { buildEventType, isValidEventType, parseEventType } from "./eventNaming";

describe("buildEventType", () => {
  it("builds a name in <domain>.<event_name>.v<version> form", () => {
    expect(buildEventType("purchase", "purchaseRecorded", 1)).toBe("purchase.purchaseRecorded.v1");
  });
});

describe("isValidEventType", () => {
  it("accepts a well-formed event type", () => {
    expect(isValidEventType("purchase.purchaseRecorded.v1")).toBe(true);
  });

  it("rejects a missing version segment", () => {
    expect(isValidEventType("purchase.purchaseRecorded")).toBe(false);
  });

  it("rejects a version segment without the v prefix", () => {
    expect(isValidEventType("purchase.purchaseRecorded.1")).toBe(false);
  });

  it("rejects an empty string", () => {
    expect(isValidEventType("")).toBe(false);
  });
});

describe("parseEventType", () => {
  it("parses domain, event name, and version from a well-formed event type", () => {
    expect(parseEventType("purchase.purchaseRecorded.v1")).toEqual({
      domain: "purchase",
      eventName: "purchaseRecorded",
      version: 1,
    });
  });

  it("returns undefined for a malformed event type", () => {
    expect(parseEventType("not-an-event-type")).toBeUndefined();
  });
});
