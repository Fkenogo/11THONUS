/**
 * Invitation Acceptance Handoff contract (`ENG-P2-003A`, Phase J).
 *
 * Defines only the contract *boundary* a future `ENG-P2-003B` acceptance
 * command will implement — `ENG-P2-003-DESIGN-001` §8/§8a's ACCEPT
 * requirements (FD-3-STAFF): authenticated Customer Identity; valid
 * invitation proof; verified entitlement to the invitation target;
 * server-owned authoritative membership `userId`.
 *
 * **This module does not**: validate tokens, resolve Firebase principals,
 * query Customer Identity, create a membership, accept an invitation, or
 * implement the acceptance transaction. It is a pure request/result shape
 * plus the one structural check appropriate at this layer (non-blank
 * reference) — every other check listed above belongs to `ENG-P2-003B`.
 *
 * `AcceptInvitationRequest` structurally cannot carry a client-supplied
 * `userId` — the server derives the authoritative Customer Identity from
 * the authenticated principal, never from client input (Phase J's explicit
 * requirement, proven at compile time by
 * `invitationAcceptanceHandoff.test.ts`'s `AssertNoUserId` type check).
 */

import type { InvitationRole } from "./invitationRole";
import { invalidInvitationFieldError } from "./permissionErrors";

/**
 * The only thing a client submits to accept an invitation: the opaque,
 * unguessable invitation reference (never the invitation's own Firestore
 * document id, never a membership id, never a userId — §8's "authority to
 * accept comes from proving control of the delivery address, not from the
 * reference alone" is enforced by the future `003B` command, not this
 * type, but this type structurally cannot smuggle authority in via extra
 * fields it does not declare).
 */
export type AcceptInvitationRequest = {
  readonly invitationReference: string;
};

export function createAcceptInvitationRequest(
  input: AcceptInvitationRequest,
): AcceptInvitationRequest {
  if (
    typeof input.invitationReference !== "string" ||
    input.invitationReference.trim().length === 0
  ) {
    throw invalidInvitationFieldError("invitationReference", String(input.invitationReference));
  }
  return { invitationReference: input.invitationReference };
}

/**
 * The server-produced outcome of a successful ACCEPT (§8a). `userId` is
 * present here — as an *output*, server-derived value — never as
 * something the request type above could have supplied.
 */
export type AcceptInvitationResult = {
  readonly membershipId: string;
  readonly businessId: string;
  readonly userId: string;
  readonly role: InvitationRole;
  readonly acceptedAt: Date;
};
