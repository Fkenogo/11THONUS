/**
 * `PLATFORM-BASELINE-010B-CORR-001` (P2, independent review finding
 * `PLATFORM-BASELINE-010B-ITR-001`): a small, generic debounce hook --
 * introduced for the (since `PLATFORM-BASELINE-013B` removed)
 * `QualifyingNodeSelector` search box, which had no debouncing at all, so
 * `useSearchQualifyingNodesQuery`'s query key changed (and fired a new
 * callable request) on every keystroke. Retained as a shared utility for
 * the deferred optional-classification picker (`PLATFORM-BASELINE-013D`).
 * Delays updating the returned value until `value` has stopped changing
 * for `delayMs`, so a caller that feeds this into a query key gets one
 * request per pause in typing, not one per character.
 */
import { useEffect, useState } from "react";

export function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}
