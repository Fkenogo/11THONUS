/** Adapter for `submitBusinessForVerification` — the sole `draft → pending_verification` integration (design §18). */

import { httpsCallable, type Functions } from "firebase/functions";
import { toCallWithActor, type AuthenticatedActor } from "./businessCallableClient";
import { unwrapMutationResult, type MutationOutcome } from "./mutationOutcome";
import type { BusinessStatus } from "./businessContext";

export type SubmitBusinessForVerificationRequest = { businessId: string; idempotencyKey: string };
export type SubmitBusinessForVerificationResult = { businessId: string; status: BusinessStatus };

type BoundCallable = (
  payload: Record<string, unknown>,
) => Promise<{ data: MutationOutcome<SubmitBusinessForVerificationResult> }>;

export function toCallSubmitBusinessForVerification(
  callable: BoundCallable,
): (
  actor: AuthenticatedActor,
  payload: SubmitBusinessForVerificationRequest,
) => Promise<SubmitBusinessForVerificationResult | undefined> {
  const call = toCallWithActor<
    SubmitBusinessForVerificationRequest,
    MutationOutcome<SubmitBusinessForVerificationResult>
  >(callable);
  return async (actor, payload) => unwrapMutationResult(await call(actor, payload));
}

export function makeCallSubmitBusinessForVerification(
  functions: Functions,
): (
  actor: AuthenticatedActor,
  payload: SubmitBusinessForVerificationRequest,
) => Promise<SubmitBusinessForVerificationResult | undefined> {
  return toCallSubmitBusinessForVerification(
    httpsCallable(functions, "submitBusinessForVerification"),
  );
}
