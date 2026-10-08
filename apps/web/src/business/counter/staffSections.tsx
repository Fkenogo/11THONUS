/**
 * In-page section navigation for the bounded Staff Counter (Founder Preview Pass 1 correction —
 * Staff mobile shell). Counter / New customer / Activity are parts of ONE Counter experience, not
 * separate routes: the shell publishes a "section request" and the section that owns the matching
 * anchor reveals itself, scrolls into view and takes focus. Nothing here touches the transaction
 * state, the URL or the history stack, so tapping a destination never resets a transaction and
 * Browser Back keeps its normal meaning.
 */

import { createContext, useContext, useEffect, useRef } from "react";

export type StaffSection = "counter" | "newCustomer" | "activity";

export const STAFF_SECTION_IDS: Record<StaffSection, string> = {
  counter: "staff-section-counter",
  newCustomer: "staff-section-new-customer",
  activity: "staff-section-activity",
};

export type StaffSectionRequest = { section: StaffSection; tick: number } | null;

export const StaffSectionRequestContext = createContext<StaffSectionRequest>(null);

/** Runs `onRequest` once per request addressed to `section` (never replays an old one on mount). */
export function useStaffSectionRequest(section: StaffSection, onRequest: () => void) {
  const request = useContext(StaffSectionRequestContext);
  const handler = useRef(onRequest);
  const handledTick = useRef(request?.tick ?? 0);

  useEffect(() => {
    handler.current = onRequest;
  });

  useEffect(() => {
    if (!request || request.tick === handledTick.current) return;
    handledTick.current = request.tick;
    if (request.section === section) handler.current();
  }, [request, section]);
}

/** Brings a section to the top of the view and moves focus to its heading (no-op where unsupported). */
export function revealSection(container: HTMLElement | null, focusTarget: HTMLElement | null) {
  const reduceMotion =
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  container?.scrollIntoView?.({ block: "start", behavior: reduceMotion ? "auto" : "smooth" });
  focusTarget?.focus({ preventScroll: true });
}
