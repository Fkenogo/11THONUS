import { describe, expect, it } from "vitest";
import * as functions from "./index";

describe("functions workspace scaffold", () => {
  it("exports the neutral ping placeholder function", () => {
    expect(functions.ping).toBeDefined();
  });
});
