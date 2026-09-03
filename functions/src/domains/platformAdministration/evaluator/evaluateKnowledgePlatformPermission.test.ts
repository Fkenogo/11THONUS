import { describe, expect, it } from "vitest";
import { evaluateKnowledgePlatformPermission } from "./evaluateKnowledgePlatformPermission";

describe("evaluateKnowledgePlatformPermission", () => {
  it("allows an active knowledge_editor to create a draft (MFA satisfied)", () => {
    const decision = evaluateKnowledgePlatformPermission({
      administrator: { status: "active", roles: ["knowledge_editor"] },
      permission: "knowledge.create_draft",
      verifiedMfaSatisfied: true,
    });
    expect(decision).toEqual({ allowed: true });
  });

  it("allows an active knowledge_approver to publish (MFA satisfied)", () => {
    const decision = evaluateKnowledgePlatformPermission({
      administrator: { status: "active", roles: ["knowledge_approver"] },
      permission: "knowledge.publish",
      verifiedMfaSatisfied: true,
    });
    expect(decision).toEqual({ allowed: true });
  });

  it("denies with NO_ADMINISTRATOR_RECORD for an unknown administrator (e.g. an ordinary Business/customer identity)", () => {
    const decision = evaluateKnowledgePlatformPermission({
      administrator: null,
      permission: "knowledge.view",
      verifiedMfaSatisfied: true,
    });
    expect(decision).toEqual({ allowed: false, reason: "NO_ADMINISTRATOR_RECORD" });
  });

  it("denies an invited (not yet active) administrator", () => {
    const decision = evaluateKnowledgePlatformPermission({
      administrator: { status: "invited", roles: ["knowledge_editor"] },
      permission: "knowledge.view",
      verifiedMfaSatisfied: true,
    });
    expect(decision).toEqual({ allowed: false, reason: "ADMINISTRATOR_NOT_ACTIVE" });
  });

  it("denies a suspended administrator", () => {
    const decision = evaluateKnowledgePlatformPermission({
      administrator: { status: "suspended", roles: ["knowledge_approver"] },
      permission: "knowledge.view",
      verifiedMfaSatisfied: true,
    });
    expect(decision).toEqual({ allowed: false, reason: "ADMINISTRATOR_NOT_ACTIVE" });
  });

  it("denies a removed administrator", () => {
    const decision = evaluateKnowledgePlatformPermission({
      administrator: { status: "removed", roles: ["knowledge_editor"] },
      permission: "knowledge.view",
      verifiedMfaSatisfied: true,
    });
    expect(decision).toEqual({ allowed: false, reason: "ADMINISTRATOR_NOT_ACTIVE" });
  });

  it("denies with MFA_NOT_ESTABLISHED when verifiedMfaSatisfied is false, even for an otherwise-eligible active administrator", () => {
    const decision = evaluateKnowledgePlatformPermission({
      administrator: { status: "active", roles: ["knowledge_approver"] },
      permission: "knowledge.publish",
      verifiedMfaSatisfied: false,
    });
    expect(decision).toEqual({ allowed: false, reason: "MFA_NOT_ESTABLISHED" });
  });

  it("checks MFA before checking the role/permission grant (MFA failure reason wins even for a permission the role would never hold)", () => {
    const decision = evaluateKnowledgePlatformPermission({
      administrator: { status: "active", roles: ["knowledge_editor"] },
      permission: "knowledge.bulk_import",
      verifiedMfaSatisfied: false,
    });
    expect(decision).toEqual({ allowed: false, reason: "MFA_NOT_ESTABLISHED" });
  });

  it("denies a permission outside the caller's granted Knowledge scope (editor requesting an approver-only permission)", () => {
    const decision = evaluateKnowledgePlatformPermission({
      administrator: { status: "active", roles: ["knowledge_editor"] },
      permission: "knowledge.publish",
      verifiedMfaSatisfied: true,
    });
    expect(decision).toEqual({ allowed: false, reason: "PERMISSION_NOT_GRANTED" });
  });

  it("denies a permission no MVP role grants at all (knowledge.bulk_import), even for an active, MFA-satisfied administrator holding both roles", () => {
    const decision = evaluateKnowledgePlatformPermission({
      administrator: { status: "active", roles: ["knowledge_editor", "knowledge_approver"] },
      permission: "knowledge.bulk_import",
      verifiedMfaSatisfied: true,
    });
    expect(decision).toEqual({ allowed: false, reason: "PERMISSION_NOT_GRANTED" });
  });

  it("denies an administrator with no roles at all", () => {
    const decision = evaluateKnowledgePlatformPermission({
      administrator: { status: "active", roles: [] },
      permission: "knowledge.view",
      verifiedMfaSatisfied: true,
    });
    expect(decision).toEqual({ allowed: false, reason: "PERMISSION_NOT_GRANTED" });
  });

  it("allows a knowledge_editor holding both roles to also exercise approver-only permissions", () => {
    const decision = evaluateKnowledgePlatformPermission({
      administrator: { status: "active", roles: ["knowledge_editor", "knowledge_approver"] },
      permission: "knowledge.retire",
      verifiedMfaSatisfied: true,
    });
    expect(decision).toEqual({ allowed: true });
  });
});
