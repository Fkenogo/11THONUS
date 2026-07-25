/**
 * Command contract (ENG-P1-002).
 *
 * `CommandEnvelope<T>`, exactly as TRD11 §11.7 defines it. The server
 * populates/verifies `actor` from trusted authentication context;
 * client-supplied actor authority is never trusted on its own (TRD11
 * §11.7's own text) — see `../validation/actorValidation.ts`.
 */

export type CommandActor = {
  userId: string;
  authUid: string;
  roleContext?: string;
  businessId?: string;
  membershipId?: string;
};

export type CommandEnvelope<T> = {
  commandId: string;
  commandType: string;
  commandVersion: number;
  idempotencyKey: string;
  actor: CommandActor;
  issuedAtClient?: string;
  correlationId: string;
  payload: T;
};
