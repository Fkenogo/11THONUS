/**
 * Observability configuration (ENG-P1-003-IMP-01).
 *
 * Mirrors `apps/web/src/config/env.ts`'s pattern exactly: a pure
 * function over an explicit `EnvSource` object (never reading
 * `import.meta.env` directly), so it is testable without Vite's
 * build-time env substitution.
 *
 * Per the ENG-P1-003 Operational Observability Blueprint §6.4: no DSN,
 * no secret — only enabled/disabled, provider identifier, environment,
 * and an optional release identifier. `"noop"` is the only supported
 * provider at this stage (DEC-PROV-005's confirmed architecture defers
 * any real provider integration to a later, separately authorized
 * stage). Safe default is disabled + no-op.
 */

export type ObservabilityProviderId = "noop";

export type ObservabilityConfig = {
  enabled: boolean;
  provider: ObservabilityProviderId;
  environment: string;
  release?: string;
};

type EnvSource = Record<string, string | undefined>;

const KNOWN_PROVIDERS: readonly ObservabilityProviderId[] = ["noop"];

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
    };
  }

  return {
    enabled: requestedEnabled,
    provider: requestedProvider,
    environment: viteEnv.MODE,
    release: source.VITE_OBSERVABILITY_RELEASE,
  };
}
