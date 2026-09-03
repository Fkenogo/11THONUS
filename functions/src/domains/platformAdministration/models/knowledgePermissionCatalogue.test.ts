import { describe, expect, it } from "vitest";
import {
  GRANTABLE_KNOWLEDGE_PERMISSIONS,
  roleGrantsKnowledgePermission,
} from "./knowledgePermissionCatalogue";

describe("knowledgePermissionCatalogue", () => {
  it("grants knowledge_editor exactly view/create_draft/edit_draft", () => {
    expect(roleGrantsKnowledgePermission("knowledge_editor", "knowledge.view")).toBe(true);
    expect(roleGrantsKnowledgePermission("knowledge_editor", "knowledge.create_draft")).toBe(true);
    expect(roleGrantsKnowledgePermission("knowledge_editor", "knowledge.edit_draft")).toBe(true);
    expect(roleGrantsKnowledgePermission("knowledge_editor", "knowledge.approve")).toBe(false);
    expect(roleGrantsKnowledgePermission("knowledge_editor", "knowledge.publish")).toBe(false);
    expect(roleGrantsKnowledgePermission("knowledge_editor", "knowledge.retire")).toBe(false);
    expect(roleGrantsKnowledgePermission("knowledge_editor", "knowledge.bulk_import")).toBe(false);
  });

  it("grants knowledge_approver exactly view/approve/publish/retire", () => {
    expect(roleGrantsKnowledgePermission("knowledge_approver", "knowledge.view")).toBe(true);
    expect(roleGrantsKnowledgePermission("knowledge_approver", "knowledge.approve")).toBe(true);
    expect(roleGrantsKnowledgePermission("knowledge_approver", "knowledge.publish")).toBe(true);
    expect(roleGrantsKnowledgePermission("knowledge_approver", "knowledge.retire")).toBe(true);
    expect(roleGrantsKnowledgePermission("knowledge_approver", "knowledge.create_draft")).toBe(
      false,
    );
    expect(roleGrantsKnowledgePermission("knowledge_approver", "knowledge.edit_draft")).toBe(false);
    expect(roleGrantsKnowledgePermission("knowledge_approver", "knowledge.bulk_import")).toBe(
      false,
    );
  });

  it("grants knowledge.bulk_import to neither MVP role", () => {
    expect(GRANTABLE_KNOWLEDGE_PERMISSIONS).not.toContain("knowledge.bulk_import");
  });
});
