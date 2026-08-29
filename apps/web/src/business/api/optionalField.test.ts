import { describe, expect, it } from "vitest";
import { optionalField } from "./optionalField";

describe("optionalField (ENG-P3-002-UI-IMP-H Phase C finding)", () => {
  it("omits the key entirely for an empty string", () => {
    expect(optionalField("businessTypeId", "")).toEqual({});
    expect("businessTypeId" in optionalField("businessTypeId", "")).toBe(false);
  });

  it("omits the key entirely for null/undefined", () => {
    expect(optionalField("businessTypeId", null)).toEqual({});
    expect(optionalField("businessTypeId", undefined)).toEqual({});
  });

  it("includes the key with the value when non-empty", () => {
    expect(optionalField("businessTypeId", "cat_bakery_general")).toEqual({
      businessTypeId: "cat_bakery_general",
    });
  });

  it("spreads cleanly alongside required fields, never leaving an `undefined`-valued key", () => {
    const payload = {
      displayName: "Kigwena Kitchen",
      ...optionalField("businessTypeId", ""),
    };
    expect(Object.keys(payload)).toEqual(["displayName"]);
    expect(JSON.stringify(payload)).toBe('{"displayName":"Kigwena Kitchen"}');
  });
});
