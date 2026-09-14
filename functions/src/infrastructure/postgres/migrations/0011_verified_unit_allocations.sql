-- Allocation positions (current) + allocation history (PLATFORM-BASELINE-006A;
-- design §§15/20, CORR-002/003).
--
-- verified_unit_allocations: CURRENT allocation positions.
-- Conservation invariant: credit.quantity = SUM(position quantities) at
-- all times, positions = allocated + pending rows. Whole-position movement
-- converts ON THE SAME ROW when the next cycle opens; a pending position
-- larger than the next cycle's remaining capacity is split
-- quantity-conservingly by the future forward-allocation package (current
-- rows only, never history). History lives in allocation events, never here.
CREATE TABLE verified_unit_allocations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  verified_unit_id UUID NOT NULL,
  loyalty_cycle_id UUID NULL REFERENCES loyalty_cycles (id) ON DELETE RESTRICT,
  business_id TEXT NOT NULL,
  customer_identity_id TEXT NOT NULL,
  reward_program_id UUID NOT NULL,
  reward_program_version_id UUID NOT NULL,
  allocated_quantity INTEGER NOT NULL CHECK (allocated_quantity >= 1),
  allocation_order INTEGER NOT NULL CHECK (allocation_order >= 0),
  state TEXT NOT NULL CHECK (state IN ('allocated','pending')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT verified_unit_allocations_pending_shape CHECK (
    (state = 'pending') = (loyalty_cycle_id IS NULL)),
  -- Allocation rows prove their copied scope against the EXACT credit
  -- tuple (version pins the credit's own snapshot).
  CONSTRAINT verified_unit_allocations_match_unit FOREIGN KEY
    (verified_unit_id, business_id, customer_identity_id,
     reward_program_id, reward_program_version_id)
    REFERENCES verified_units (id, business_id, customer_identity_id,
     reward_program_id, reward_program_version_id) ON DELETE RESTRICT,
  -- D. allocated rows prove the cycle's Business/Customer/Program scope.
  -- (MATCH SIMPLE: pending rows with NULL cycle id skip this FK and prove
  -- scope through the unit FK instead — exactly the intended split.)
  CONSTRAINT verified_unit_allocations_cycle_scope FOREIGN KEY
    (loyalty_cycle_id, business_id, customer_identity_id, reward_program_id)
    REFERENCES loyalty_cycles (id, business_id, customer_identity_id,
     reward_program_id) ON DELETE RESTRICT
);
CREATE INDEX verified_unit_allocations_unit_idx
  ON verified_unit_allocations (verified_unit_id, allocation_order);
CREATE INDEX verified_unit_allocations_cycle_idx
  ON verified_unit_allocations (loyalty_cycle_id, allocation_order)
  WHERE loyalty_cycle_id IS NOT NULL;
CREATE INDEX verified_unit_allocations_pending_idx
  ON verified_unit_allocations (customer_identity_id, reward_program_id, created_at)
  WHERE state = 'pending';

-- verified_unit_allocation_events: append-only movement history.
-- NEVER read as current quantity. Current-position queries touch only the
-- positions table; audits and reconciliation read here.
CREATE TABLE verified_unit_allocation_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  allocation_position_id UUID NOT NULL REFERENCES verified_unit_allocations (id) ON DELETE RESTRICT,
  verified_unit_id UUID NOT NULL REFERENCES verified_units (id) ON DELETE RESTRICT,
  from_state TEXT NOT NULL CHECK (from_state IN ('none','pending','allocated')),
  to_state TEXT NOT NULL CHECK (to_state IN ('pending','allocated','reversed')),
  from_cycle_id UUID NULL REFERENCES loyalty_cycles (id) ON DELETE RESTRICT,
  to_cycle_id UUID NULL REFERENCES loyalty_cycles (id) ON DELETE RESTRICT,
  quantity INTEGER NOT NULL CHECK (quantity >= 1),
  reason TEXT NOT NULL
    CHECK (reason IN ('initial_placement','pending_to_allocated','correction_adjustment')),
  correlation_id TEXT NOT NULL,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  schema_version INTEGER NOT NULL DEFAULT 1,
  CONSTRAINT verified_unit_allocation_events_shape CHECK (
    (reason = 'initial_placement' AND from_state = 'none'
      AND from_cycle_id IS NULL
      AND (to_state = 'pending') = (to_cycle_id IS NULL)) OR
    (reason = 'pending_to_allocated' AND from_state = 'pending'
      AND to_state = 'allocated'
      AND from_cycle_id IS NULL AND to_cycle_id IS NOT NULL) OR
    (reason = 'correction_adjustment'))
);
CREATE INDEX verified_unit_allocation_events_position_idx
  ON verified_unit_allocation_events (allocation_position_id, occurred_at);
CREATE INDEX verified_unit_allocation_events_unit_idx
  ON verified_unit_allocation_events (verified_unit_id, occurred_at);
