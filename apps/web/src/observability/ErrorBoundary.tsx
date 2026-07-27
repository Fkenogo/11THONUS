/**
 * Provider-neutral React error boundary (ENG-P1-003-IMP-02).
 *
 * Per the ENG-P1-003 Operational Observability Blueprint §5/§6.7:
 * captures render/lifecycle failures through `createRenderErrorHandler`
 * (never a `DiagnosticsProvider` or a provider-specific React
 * component) and renders a minimal fallback instead of crashing.
 *
 * **Placement (Stage 2 decision, disclosed):** used once, at the
 * application root (`main.tsx`) — the only route-level or
 * high-risk-feature boundary this stage justifies, since the
 * application has exactly one route and no features built yet.
 * Additional boundaries belong at the point a second, meaningfully
 * independent route or a genuinely high-risk feature exists — not
 * built speculatively here.
 *
 * **Fallback UI (explicit Founder decision, ENG-P1-003-IMP-02):** a
 * temporary Phase 1 engineering placeholder only — neutral, unbranded,
 * "Something went wrong." plus a single Reload action, no internal
 * error detail, no stack trace, no correlation ID, no technical
 * information. This is **not** approved product UX. A Product
 * Experience decision on the real customer-facing failure state is a
 * carried-forward governance gap, not resolved by this stage.
 */

import { Component, type ErrorInfo, type ReactNode } from "react";
import { createRenderErrorHandler } from "./errorBoundaryIntegration";
import type { ObservabilityService } from "./observabilityService";

type Props = {
  service: ObservabilityService;
  children: ReactNode;
};

type State = {
  hasError: boolean;
};

function TemporaryFallback(): ReactNode {
  return (
    <div role="alert">
      <p>Something went wrong.</p>
      <button type="button" onClick={() => window.location.reload()}>
        Reload
      </button>
    </div>
  );
}

export class ObservabilityErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    const reportRenderError = createRenderErrorHandler(this.props.service);
    reportRenderError(error, { componentStack: info.componentStack });
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return <TemporaryFallback />;
    }
    return this.props.children;
  }
}
