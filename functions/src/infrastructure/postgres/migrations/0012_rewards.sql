-- Minimum Reward entitlement foundation (PLATFORM-BASELINE-006A; design
-- §§15-16/20, REQUIRED by BR-064/BR-069 + TRD10 §10.12.1).
--
-- rewards: created exactly once by the threshold transaction (§16); no
-- redemption behavior here. Shape follows the governed TRD10 §10.12.1
-- RewardDocument vocabulary (canonical states).
--
-- Reward terms governed by the CYCLE's governing version
-- (opened_under_version_id of the qualifying cycle, never program-current).
CREATE TABLE rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  loyalty_cycle_id UUID NOT NULL,
  business_id TEXT NOT NULL,
  customer_identity_id TEXT NOT NULL,
  reward_program_id UUID NOT NULL,
  -- Reward terms governed by the CYCLE's governing version:
  -- opened_under_version_id of the qualifying cycle, never program-current.
  reward_program_version_id UUID NOT NULL,
  reward_description TEXT NOT NULL,                 -- terms snapshot from the governing version
  reward_quantity INTEGER NOT NULL CHECK (reward_quantity = 1),
  state TEXT NOT NULL DEFAULT 'available'
    CHECK (state IN ('available','redeemed','cancelled','expired')),
  available_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  correlation_id TEXT NOT NULL,
  schema_version INTEGER NOT NULL DEFAULT 1,
  -- Same-scope relational integrity: reward pins the exact cycle tuple
  -- (which itself proves version-in-program and program-in-Business)…
  CONSTRAINT rewards_match_cycle FOREIGN KEY
    (loyalty_cycle_id, business_id, customer_identity_id, reward_program_id)
    REFERENCES loyalty_cycles (id, business_id, customer_identity_id,
     reward_program_id) ON DELETE RESTRICT,
  -- …and proves its terms version IS the cycle's governing version
  -- (opened_under_version_id) — relational, not a comment.
  CONSTRAINT rewards_governing_version FOREIGN KEY
    (loyalty_cycle_id, reward_program_version_id)
    REFERENCES loyalty_cycles (id, opened_under_version_id) ON DELETE RESTRICT
);
-- Exactly one Reward entitlement per qualifying Loyalty Cycle, created
-- exactly once by the threshold transaction (UNIQUE backstop + progress
-- re-checked under the cycle lock).
CREATE UNIQUE INDEX rewards_one_per_cycle
  ON rewards (loyalty_cycle_id);
