/**
 * Actor validation — the "authenticate" step (ENG-P1-002).
 *
 * TRD11 §11.7's own text: "The server shall populate or verify actor
 * information from trusted authentication context. Client-supplied actor
 * authority shall never be trusted on its own." This implements the
 * "populate" option: `CommandActor` is built entirely from the trusted
 * auth context; any client-supplied actor fields are never read.
 *
 * `userId` and `authUid` are both set to the trusted `uid` — TRD11 §11.7
 * defines both fields but does not elaborate a distinction between a
 * platform-internal user ID and the raw Firebase Auth UID; treating them
 * as equal is this work package's own disclosed assumption, to be
 * confirmed once Identity (Phase 2) introduces its own user-ID model.
 */

import type { CommandActor } from "../commands/commandEnvelope";

export type TrustedAuthContext = {
  uid: string;
  token?: {
    roleContext?: string;
    businessId?: string;
    membershipId?: string;
  };
};

export function resolveTrustedActor(auth: TrustedAuthContext): CommandActor {
  return {
    userId: auth.uid,
    authUid: auth.uid,
    ...(auth.token?.roleContext ? { roleContext: auth.token.roleContext } : {}),
    ...(auth.token?.businessId ? { businessId: auth.token.businessId } : {}),
    ...(auth.token?.membershipId ? { membershipId: auth.token.membershipId } : {}),
  };
}
