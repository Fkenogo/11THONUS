/**
 * Provider-neutral observability contract (ENG-P1-003-IMP-01).
 *
 * Per the ENG-P1-003 Operational Observability Blueprint §6.1: a small,
 * stable interface application code programs against — never a
 * provider-specific concept (Sentry scopes, hubs, envelopes, DSNs, or
 * provider-issued event IDs). A future Sentry adapter implements this
 * same interface; nothing outside `observability/` may import a
 * provider SDK directly.
 */

/** A bounded, structured value — sanitized before it reaches a provider. */
export type DiagnosticContext = Record<string, unknown>;

export type Breadcrumb = {
  message: string;
  category?: string;
  data?: DiagnosticContext;
  timestamp?: string;
};

/** Approved identity context only — never a name, phone number, or address. */
export type ObservabilityUserContext = {
  actorId?: string;
  businessId?: string;
  customerId?: string;
};

export interface DiagnosticsProvider {
  captureException(error: unknown, context?: DiagnosticContext): void;
  captureMessage(message: string, context?: DiagnosticContext): void;
  addBreadcrumb(breadcrumb: Breadcrumb): void;
  setContext(key: string, context: DiagnosticContext): void;
  clearContext(key: string): void;
  setUserContext(context: ObservabilityUserContext | undefined): void;
  flush(): Promise<void>;
  isEnabled(): boolean;
}
