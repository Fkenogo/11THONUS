-- Qualifying Commerce Knowledge references for a Reward Program Version (PLATFORM-BASELINE-005A).
--
-- A junction table, not an array column, so each node reference can
-- optionally carry its own business-display alias (Commerce Knowledge
-- Standard CKS-003) with normal relational indexing.
--
-- `knowledge_node_id` is an opaque Firestore KnowledgeNode id (type
-- standard_product/standard_service) -- never a PostgreSQL foreign key,
-- since Commerce Knowledge is Firestore-authoritative and is never copied
-- into PostgreSQL. Existence/type/active-status validation happens
-- server-side against Firestore at write time (draft add-time and,
-- authoritatively, at publish time -- PLATFORM-BASELINE-005-
-- REVIEW-FINDINGS-001 RF-3).
CREATE TABLE reward_program_version_qualifying_nodes (
  reward_program_version_id UUID NOT NULL REFERENCES reward_program_versions (id) ON DELETE CASCADE,
  knowledge_node_id TEXT NOT NULL,
  business_display_name TEXT NULL,
  PRIMARY KEY (reward_program_version_id, knowledge_node_id)
);

CREATE INDEX reward_program_version_qualifying_nodes_knowledge_node_id_idx
  ON reward_program_version_qualifying_nodes (knowledge_node_id);

COMMENT ON TABLE reward_program_version_qualifying_nodes IS
  'Junction: which Commerce Knowledge nodes (Firestore-owned, referenced by opaque id) qualify for a given Reward Program Version (PLATFORM-BASELINE-005A).';
