/**
 * Route-change breadcrumbs (ENG-P1-003-IMP-02).
 *
 * Per the ENG-P1-003 Operational Observability Blueprint §5:
 * navigation history is useful diagnostic context ("which route was
 * the user on before this exception"). Uses `react-router-dom`'s own
 * `useLocation()` — the app's existing routing primitive — rather than
 * a new navigation-tracking mechanism.
 *
 * Renders nothing; mounted once inside `<BrowserRouter>` in `main.tsx`
 * purely for its side effect. A `useRef` guard (not a module-level
 * one) is enough here — the effect only needs to dedupe against
 * `StrictMode`'s double-invoke for *this* component instance, not
 * across instances the way the `window`-listener modules do.
 */

import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import type { ObservabilityService } from "./observabilityService";

type Props = {
  service: ObservabilityService;
};

export function RouteTracker({ service }: Props): null {
  const location = useLocation();
  const previousPathname = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (previousPathname.current !== location.pathname) {
      service.addBreadcrumb({
        category: "navigation",
        message: location.pathname,
        data: { from: previousPathname.current, to: location.pathname },
      });
      previousPathname.current = location.pathname;
    }
  }, [location.pathname, service]);

  return null;
}
