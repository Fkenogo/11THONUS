import { describe, expect, it } from "vitest";
import * as functions from "./index";

interface FunctionWithEndpoint {
  __endpoint?: { region?: string[] };
}

describe("functions workspace scaffold", () => {
  it("exports the neutral ping placeholder function", () => {
    expect(functions.ping).toBeDefined();
  });

  it("deploys ping to the approved region (DEC-TECH-005: europe-west1)", () => {
    const endpoint = (functions.ping as FunctionWithEndpoint).__endpoint;

    expect(endpoint?.region).toEqual(["europe-west1"]);
  });
});
