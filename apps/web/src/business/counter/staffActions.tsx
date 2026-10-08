/**
 * Quick actions that cross from the Staff shell into the persistent Counter
 * (`EA-BL-001-CORR-002-B`, Founder Preview Pass 3).
 *
 * The permanent destinations (Counter / Activity / Profile) are real routes. A quick ACTION is not a
 * place: "Scan customer QR" has to start the existing scanner INSIDE the Counter that is already
 * mounted, so the shell publishes a request and the Counter honours it once. Requests carry no data.
 */

import { createContext, useContext, useEffect, useRef } from "react";

export type StaffActionRequest = { readonly action: "scan"; readonly tick: number } | null;

export const StaffActionRequestContext = createContext<StaffActionRequest>(null);

/**
 * Runs `onRequest` once per request for `action` (never replays an old request on mount). While
 * `enabled` is false the request is HELD, not dropped, and honoured the moment it becomes true: the
 * shell navigates with a (deferred) router transition, so the Counter can see the request before it is
 * the visible place — it must not start its camera while hidden.
 */
export function useStaffActionRequest(action: "scan", onRequest: () => void, enabled = true) {
  const request = useContext(StaffActionRequestContext);
  const handler = useRef(onRequest);
  const handledTick = useRef(request?.tick ?? 0);

  useEffect(() => {
    handler.current = onRequest;
  });

  useEffect(() => {
    if (!enabled || !request || request.tick === handledTick.current) return;
    handledTick.current = request.tick;
    if (request.action === action) handler.current();
  }, [request, action, enabled]);
}
