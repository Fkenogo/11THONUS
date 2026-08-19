import { describe, it, expect } from "vitest";
import {
  isInvitationStatus,
  isValidInvitationStatusTransition,
  isTerminalInvitationStatus,
} from "./invitationStatus";

describe("invitationStatus", () => {
  it("pending is valid", () => {
    expect(isInvitationStatus("pending")).toBe(true);
  });

  it("accepted/revoked/expired are valid", () => {
    expect(isInvitationStatus("accepted")).toBe(true);
    expect(isInvitationStatus("revoked")).toBe(true);
    expect(isInvitationStatus("expired")).toBe(true);
  });

  it("rejects an unknown status", () => {
    expect(isInvitationStatus("cancelled")).toBe(false);
  });

  it("pending -> accepted/revoked/expired are permitted", () => {
    expect(isValidInvitationStatusTransition("pending", "accepted")).toBe(true);
    expect(isValidInvitationStatusTransition("pending", "revoked")).toBe(true);
    expect(isValidInvitationStatusTransition("pending", "expired")).toBe(true);
  });

  it("no transition is permitted out of a terminal state", () => {
    expect(isValidInvitationStatusTransition("accepted", "pending")).toBe(false);
    expect(isValidInvitationStatusTransition("revoked", "pending")).toBe(false);
    expect(isValidInvitationStatusTransition("expired", "pending")).toBe(false);
    expect(isValidInvitationStatusTransition("accepted", "revoked")).toBe(false);
  });

  it("accepted/revoked/expired are terminal; pending is not", () => {
    expect(isTerminalInvitationStatus("accepted")).toBe(true);
    expect(isTerminalInvitationStatus("revoked")).toBe(true);
    expect(isTerminalInvitationStatus("expired")).toBe(true);
    expect(isTerminalInvitationStatus("pending")).toBe(false);
  });
});
