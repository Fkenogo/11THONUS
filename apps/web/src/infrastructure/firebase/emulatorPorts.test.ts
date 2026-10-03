import { describe, expect, it } from "vitest";
import { FIREBASE_EMULATOR_PORTS, readEmulatorPort } from "./emulatorPorts";

describe("Firebase emulator port configuration", () => {
  it("defaults to the dedicated 11thONUS development port block", () => {
    expect(FIREBASE_EMULATOR_PORTS).toEqual({
      auth: 28101,
      functions: 28102,
      firestore: 28103,
      storage: 28104,
    });
  });

  it("rejects invalid Vite emulator port overrides", () => {
    expect(() => readEmulatorPort("AUTH", "9099x", 28101)).toThrow(/integer TCP port/);
    expect(() => readEmulatorPort("AUTH", "70000", 28101)).toThrow(/integer TCP port/);
    expect(readEmulatorPort("AUTH", undefined, 28101)).toBe(28101);
  });
});
