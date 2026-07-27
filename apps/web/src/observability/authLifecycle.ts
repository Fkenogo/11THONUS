/**
 * Correlation and identity-context cleanup on sign-out
 * (ENG-P1-003-IMP-02).
 *
 * Per the Founder-approved Stage 2 correlation scope: correlation and
 * approved identity context must clear "on logout". No logout UI
 * exists anywhere in the application yet, so this hooks into Firebase
 * Auth's own `onAuthStateChanged` — an existing primitive from
 * `ENG-P1-001`, not new invented UI — and reacts only to a real
 * sign-out transition (`user === null`), never a fabricated one.
 */

import { onAuthStateChanged, type Auth, type Unsubscribe } from "firebase/auth";
import { clearCorrelationId } from "./correlationContext";
import type { ObservabilityService } from "./observabilityService";

export function registerAuthLifecycle(auth: Auth, service: ObservabilityService): Unsubscribe {
  return onAuthStateChanged(auth, (user) => {
    if (user === null) {
      clearCorrelationId();
      service.setUserContext(undefined);
    }
  });
}
