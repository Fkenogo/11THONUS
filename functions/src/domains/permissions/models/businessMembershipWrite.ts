/**
 * `businessMembership` write-side construction (`ENG-P2-003B`).
 *
 * TRD10 §10.6.4's authoritative schema, exactly as `businessMembershipDocument.ts`
 * (the read-only `ENG-P2-004B` evaluator reader) already parses it — this
 * module is the write-side counterpart `ENG-P2-003A` explicitly left
 * unbuilt ("No `businessMembership` write/repository/converter was created
 * by 003A — deferred to 003B").
 *
 * Per the resolved FD-2-STAFF model (§5.1 addendum), a `businessMembership`
 * is created for the first time **only** by successful invitation
 * acceptance, and is created directly `active` — there is no `invited`
 * membership state under this model. `permissions` (overrides) starts
 * empty — no implicit `PermissionOverride` grant is ever created here
 * (Phase P). `permissionSetId` is left unset — its serialization remains
 * undesigned/out of scope (`ENG-P2-004D`'s own disclosed boundary,
 * unchanged by this package).
 */

import type { Role } from "./role";
import { ownerCannotBeInvitationRoleError } from "./permissionErrors";

export type BusinessMembershipRecord = {
  readonly id: string;
  readonly userId: string;
  readonly businessId: string;
  readonly role: Role;
  readonly permissions: readonly [];
  readonly status: "active";
  readonly invitedBy: string;
  readonly invitedAt: Date;
  readonly acceptedAt: Date;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly schemaVersion: number;
};

export type CreateActiveBusinessMembershipParams = {
  id: string;
  userId: string;
  businessId: string;
  role: Role;
  invitedBy: string;
  invitedAt: Date;
  acceptedAt: Date;
};

/**
 * Constructs the membership record created by a successful invitation
 * ACCEPT (design §8a step 6). The ordinary caller supplies `role` from
 * `invitationRoleAsRole`, whose source type (`InvitationRole`) already
 * structurally excludes `"owner"` at compile time — but this function's own
 * parameter type is the wider `Role` (matching the persisted schema), so a
 * runtime guard is kept here too, defense-in-depth against Phase Q's "no
 * request may inject Owner through malformed data": a bug or a future
 * caller that bypasses the `InvitationRole` type cannot construct an
 * Owner-creating membership through this function.
 */
export function createActiveBusinessMembership(
  params: CreateActiveBusinessMembershipParams,
): BusinessMembershipRecord {
  if (params.role === "owner") {
    throw ownerCannotBeInvitationRoleError();
  }
  return {
    id: params.id,
    userId: params.userId,
    businessId: params.businessId,
    role: params.role,
    permissions: [],
    status: "active",
    invitedBy: params.invitedBy,
    invitedAt: params.invitedAt,
    acceptedAt: params.acceptedAt,
    createdAt: params.acceptedAt,
    updatedAt: params.acceptedAt,
    schemaVersion: 1,
  };
}
