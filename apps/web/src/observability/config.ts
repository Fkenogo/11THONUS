/**
 * Observability configuration (ENG-P1-003-IMP-01, extended under
 * ENG-P1-003-IMP-03).
 *
 * Mirrors `apps/web/src/config/env.ts`'s pattern exactly: a pure
 * function over an explicit `EnvSource` object (never reading
 * `import.meta.env` directly), so it is testable without Vite's
 * build-time env substitution.
 *
 * **Stage 3 addition:** `"sentry"` is now a recognized provider
 * identifier, and `dsn` is a new optional field. A DSN is a public,
 * client-embeddable identifier by Sentry's own design (analogous to a
 * Firebase client config value) — not a secret — so its presence here
 * does not violate Stage 1's "no secret" invariant, which still holds:
 * no API key, auth token, or other genuine credential is ever read
 * into this config. Safe default remains disabled + no-op regardless
 * of what `provider`/`dsn` are set to — see `selectProvider()` in
 * `providerSelection.ts` for the full activation gate.
 */

export type ObservabilityProviderId = "noop" | "sentry";

export type ObservabilityConfig = {
  enabled: boolean;
  provider: ObservabilityProviderId;
  environment: string;
  release?: string;
  /** Sentry DSN (ENG-P1-003-IMP-03). A public identifier, not a secret — see the module doc comment. Undefined unless explicitly configured. */
  dsn?: string;
};

type EnvSource = Record<string, string | undefined>;

const KNOWN_PROVIDERS: readonly ObservabilityProviderId[] = ["noop", "sentry"];

function parseBoolean(name: string, value: string | undefined): boolean | undefined {
  if (value === undefined) return undefined;
  if (value === "true") return true;
  if (value === "false") return false;
  throw new Error(`Invalid ${name} value: "${value}" (expected "true" or "false")`);
}

function isKnownProvider(value: string): value is ObservabilityProviderId {
  return (KNOWN_PROVIDERS as readonly string[]).includes(value);
}

export function loadObservabilityConfig(
  source: EnvSource,
  viteEnv: { MODE: string } = { MODE: "development" },
): ObservabilityConfig {
  const requestedProvider = source.VITE_OBSERVABILITY_PROVIDER ?? "noop";
  const requestedEnabled =
    parseBoolean("VITE_OBSERVABILITY_ENABLED", source.VITE_OBSERVABILITY_ENABLED) ?? false;

  if (!isKnownProvider(requestedProvider)) {
    // Fails safely: an unsupported provider identifier never activates
    // diagnostics — it falls back to disabled + no-op rather than
    // throwing or silently trusting an unrecognized value.
    return {
      enabled: false,
      provider: "noop",
      environment: viteEnv.MODE,
      release: source.VITE_OBSERVABILITY_RELEASE,
      dsn: source.VITE_OBSERVABILITY_DSN,
    };
  }

  return {
    enabled: requestedEnabled,
    provider: requestedProvider,
    environment: viteEnv.MODE,
    release: source.VITE_OBSERVABILITY_RELEASE,
    dsn: source.VITE_OBSERVABILITY_DSN,
  };
}
