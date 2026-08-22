import js from "@eslint/js";
import tseslint from "typescript-eslint";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import globals from "globals";

export default tseslint.config(
  {
    ignores: [
      "**/node_modules/**",
      "**/dist/**",
      "**/build/**",
      "**/lib/**",
      "**/dev-dist/**",
      "**/coverage/**",
      "**/playwright-report/**",
      "**/test-results/**",
      "**/.firebase/**",
      "docs/**",
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["apps/web/**/*.{ts,tsx}"],
    ignores: [
      "apps/web/src/observability/sentryProvider.ts",
      "apps/web/src/observability/*.test.{ts,tsx}",
    ],
    languageOptions: {
      ecmaVersion: 2023,
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
      "@typescript-eslint/no-unused-vars": "error",
      // ENG-P1-003-IMP-03: makes the provider-neutral architecture's own
      // documented rule ("nothing outside `observability/` may import a
      // provider SDK directly" — types.ts) machine-enforced, not just a
      // doc comment. `sentryProvider.ts` itself and its own tests are the
      // only exempt files (see `ignores` above).
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "@sentry/react",
              message:
                "Import @sentry/react only inside apps/web/src/observability/sentryProvider.ts — application code must use observabilityService (via getObservability()) instead.",
            },
          ],
        },
      ],
    },
  },
  {
    files: [
      "apps/web/src/observability/sentryProvider.ts",
      "apps/web/src/observability/*.test.{ts,tsx}",
    ],
    languageOptions: {
      ecmaVersion: 2023,
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
      "@typescript-eslint/no-unused-vars": "error",
    },
  },
  {
    files: ["functions/**/*.ts"],
    languageOptions: {
      ecmaVersion: 2023,
      globals: globals.node,
    },
    rules: {
      "@typescript-eslint/no-unused-vars": "error",
    },
  },
  {
    // ENG-P2-001-01: makes the Identity domain-foundation's own documented
    // rule ("the domain layer is framework-independent — no Firebase SDK
    // import") machine-enforced, not just a doc comment. Mirrors the
    // existing apps/web Sentry-isolation `no-restricted-imports` precedent
    // above.
    //
    // `repositories/` is excluded (ENG-P2-001-05): per Repository and
    // Folder Standards §4, it is the one subfolder in each domain whose
    // whole purpose is bridging to Firestore — the error message below
    // already named it as where persistence-layer mapping belongs.
    files: ["functions/src/domains/identity/**/*.ts"],
    ignores: ["functions/src/domains/identity/repositories/**"],
    languageOptions: {
      ecmaVersion: 2023,
      globals: globals.node,
    },
    rules: {
      "@typescript-eslint/no-unused-vars": "error",
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: [
                "firebase-admin",
                "firebase-admin/*",
                "firebase-functions",
                "firebase-functions/*",
              ],
              message:
                "The Identity domain-foundation layer (ENG-P2-001-01) is framework-independent — no Firebase SDK import is permitted here. Persistence-layer mapping belongs in a future ENG-P2-001-05 module instead.",
            },
          ],
        },
      ],
    },
  },
  {
    // ENG-P2-001-03: same machine-enforced boundary as the Identity
    // domain-foundation block above, scoped to the new Loyalty Number
    // domain-foundation module. `repositories/` excluded for the same
    // reason as the Identity block above (ENG-P2-001-05).
    files: ["functions/src/domains/loyaltyNumber/**/*.ts"],
    ignores: ["functions/src/domains/loyaltyNumber/repositories/**"],
    languageOptions: {
      ecmaVersion: 2023,
      globals: globals.node,
    },
    rules: {
      "@typescript-eslint/no-unused-vars": "error",
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: [
                "firebase-admin",
                "firebase-admin/*",
                "firebase-functions",
                "firebase-functions/*",
              ],
              message:
                "The Loyalty Number domain-foundation layer (ENG-P2-001-03) is framework-independent — no Firebase SDK import is permitted here. Persistence/uniqueness-index implementation belongs in a future ENG-P2-001-05 (or equivalent) module instead.",
            },
          ],
        },
      ],
    },
  },
  {
    // ENG-P2-001-04: same machine-enforced boundary as the Identity and
    // Loyalty Number domain-foundation blocks above, scoped to the new
    // QR Identity domain-foundation module. `repositories/` excluded for
    // the same reason as the Identity block above (ENG-P2-001-05).
    files: ["functions/src/domains/qrIdentity/**/*.ts"],
    ignores: ["functions/src/domains/qrIdentity/repositories/**"],
    languageOptions: {
      ecmaVersion: 2023,
      globals: globals.node,
    },
    rules: {
      "@typescript-eslint/no-unused-vars": "error",
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: [
                "firebase-admin",
                "firebase-admin/*",
                "firebase-functions",
                "firebase-functions/*",
              ],
              message:
                "The QR Identity domain-foundation layer (ENG-P2-001-04) is framework-independent — no Firebase SDK import is permitted here. Persistence implementation belongs in a future ENG-P2-001-05 (or equivalent) module instead.",
            },
          ],
        },
      ],
    },
  },
  {
    // AUTH-01: same machine-enforced boundary as the domain-foundation
    // blocks above, scoped to the new Authentication domain-contracts module
    // (AUTH-BP §15 — AUTH-01 is pure domain, no Firebase import). The Firebase
    // Admin ID-token verification adapter that implements `TokenVerifierPort`
    // is AUTH-02, a separate module outside this domain layer.
    files: ["functions/src/domains/authentication/**/*.ts"],
    // The Firebase adapter/service sub-layer (AUTH-02+) is the one place a
    // Firebase SDK import is permitted — mirroring identity's `repositories/**`
    // exclusion. Pure `models/`+`ports/` stay framework-independent.
    ignores: ["functions/src/domains/authentication/services/**"],
    languageOptions: {
      ecmaVersion: 2023,
      globals: globals.node,
    },
    rules: {
      "@typescript-eslint/no-unused-vars": "error",
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: [
                "firebase-admin",
                "firebase-admin/*",
                "firebase-functions",
                "firebase-functions/*",
              ],
              message:
                "The Authentication domain-contracts layer (AUTH-01) is framework-independent — no Firebase SDK import is permitted here. Firebase Admin ID-token verification belongs in the AUTH-02 adapter instead.",
            },
          ],
        },
      ],
    },
  },
  {
    // ENG-P2-004A: same machine-enforced boundary as the domain-foundation
    // blocks above, scoped to the Permission Contracts & Sensitive
    // Permission Catalogue domain (`ENG-P2-004-DESIGN-001` §6.15/§14 004A —
    // `models/` is framework-independent contract/configuration only).
    // `repositories/` and `service/` are excluded (ENG-P2-004B): per
    // Repository and Folder Standards §4 (same rationale as Identity's
    // `repositories/` exclusion above), `repositories/` bridges to
    // Firestore and `service/` holds the orchestrator
    // (`evaluatePermissionService.ts`) that performs those reads (design
    // §6.5, §6.15). `evaluator/` (the pure decision function,
    // `evaluateAuthorizationDecision`) is deliberately NOT excluded — it
    // must stay framework-independent (design §6.18 purity), and this
    // rule is what machine-enforces that.
    files: ["functions/src/domains/permissions/**/*.ts"],
    ignores: [
      "functions/src/domains/permissions/repositories/**",
      "functions/src/domains/permissions/service/**",
    ],
    languageOptions: {
      ecmaVersion: 2023,
      globals: globals.node,
    },
    rules: {
      "@typescript-eslint/no-unused-vars": "error",
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: [
                "firebase-admin",
                "firebase-admin/*",
                "firebase-functions",
                "firebase-functions/*",
              ],
              message:
                "The Permission Contracts domain-foundation layer (ENG-P2-004A) is framework-independent — no Firebase SDK import is permitted here. Permission evaluation and persistence belong to future ENG-P2-004B/004D modules instead.",
            },
          ],
        },
      ],
    },
  },
  {
    // CAP-P2-ITM-A: same machine-enforced boundary as the domain-foundation
    // blocks above, scoped to the Trust domain-contracts module
    // (ITM-DESIGN-001 §15 ITM-A — "Pure domain layer... no Firebase; no
    // persistence"). `repositories/`/`services/` are excluded (CAP-P2-ITM-B):
    // per `ITM-DESIGN-001` §12/§15, ITM-B adds the Firestore repository and
    // the AUTH-08 event-consumption service in this same domain — mirroring
    // the Identity/Loyalty Number/QR Identity/Permissions `repositories/`
    // carve-out precedent above. `models/` itself stays fully restricted.
    files: ["functions/src/domains/trust/**/*.ts"],
    ignores: [
      "functions/src/domains/trust/repositories/**",
      "functions/src/domains/trust/services/**",
    ],
    languageOptions: {
      ecmaVersion: 2023,
      globals: globals.node,
    },
    rules: {
      "@typescript-eslint/no-unused-vars": "error",
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: [
                "firebase-admin",
                "firebase-admin/*",
                "firebase-functions",
                "firebase-functions/*",
              ],
              message:
                "The Trust domain-contracts layer (CAP-P2-ITM-A) is framework-independent — no Firebase SDK import is permitted here. Persistence and event consumption belong to a future ITM-B module instead.",
            },
          ],
        },
      ],
    },
  },
  {
    // ENG-P2-002A/002B/002C: same machine-enforced boundary as the
    // domain-foundation blocks above, scoped to the Business Identity
    // domain (`models/` value types/readers/writers/errors stay
    // framework-independent by design, §20). `ENG-P2-002B` added the
    // persistence layer this block's own comment predicted: `repositories/`
    // (the Firestore bootstrap transaction) and the one Firebase-touching
    // `services/` file (`businessBootstrapEndpointService.ts`, which
    // resolves the authenticated owner through the Authentication/Identity
    // domains' own Firebase-adapter services). `ENG-P2-002C` adds its three
    // protected-command files (`businessProfileCommand.ts`,
    // `businessBranchProfileCommand.ts`, `businessLifecycleCommand.ts`),
    // each composing through `ENG-P2-004`'s `authorizeAndExecute` (itself a
    // Firestore-adapter service) — exempted by name/glob for the same
    // reason. `businessCodeGenerator.ts`/`randomBusinessCodeCandidateGenerator.ts`/
    // `businessCodeReservationService.ts` remain covered by the restriction
    // and stay framework-independent, matching `businessCodeGenerator.ts`'s
    // own header ("this port produces candidates only").
    files: ["functions/src/domains/business/**/*.ts"],
    ignores: [
      "functions/src/domains/business/repositories/**",
      "functions/src/domains/business/services/businessBootstrapEndpointService.ts",
      "functions/src/domains/business/services/businessProfileCommand.ts",
      "functions/src/domains/business/services/businessBranchProfileCommand.ts",
      "functions/src/domains/business/services/businessLifecycleCommand.ts",
      "functions/src/domains/business/services/authenticatedBusinessActor.ts",
      "functions/src/domains/business/services/businessProfileLifecycle.emulator.test.ts",
      // `ENG-P3-001C`: the Business-classification/Commerce-Knowledge
      // integration module takes a caller-owned `Transaction` (the same
      // reason `businessProfileCommand.ts` etc. above are exempted) and its
      // own emulator test — same precedent, not a new exception category.
      "functions/src/domains/business/services/businessClassificationValidation.ts",
      "functions/src/domains/business/services/businessClassificationValidation.emulator.test.ts",
      // `ENG-P3-002A`: the Business read-transport/Terms-acceptance modules
      // take a caller-owned `Transaction` or open their own (mirrors
      // `businessLifecycleCommand.ts`'s own exemption reasoning above) —
      // same precedent, not a new exception category.
      "functions/src/domains/business/services/businessCallerAuthority.ts",
      "functions/src/domains/business/services/businessReadService.ts",
      "functions/src/domains/business/services/businessReadService.emulator.test.ts",
      "functions/src/domains/business/services/acceptBusinessTermsCommand.ts",
      "functions/src/domains/business/services/acceptBusinessTermsCommand.emulator.test.ts",
      // `ENG-P3-002C`: the chained real-onboarding-journey emulator test
      // — same precedent as the emulator tests immediately above, an
      // emulator test file, not a new exception category.
      "functions/src/domains/business/services/businessOnboardingJourney.emulator.test.ts",
    ],
    languageOptions: {
      ecmaVersion: 2023,
      globals: globals.node,
    },
    rules: {
      "@typescript-eslint/no-unused-vars": "error",
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: [
                "firebase-admin",
                "firebase-admin/*",
                "firebase-functions",
                "firebase-functions/*",
              ],
              message:
                "The Business Identity domain-foundation layer (ENG-P2-002A) is framework-independent — no Firebase SDK import is permitted here. Persistence/transaction/callable implementation belongs to a future ENG-P2-002B module instead.",
            },
          ],
        },
      ],
    },
  },
  {
    // ENG-P3-001A/001B: same machine-enforced boundary as the
    // domain-contract blocks above, scoped to the Commerce Knowledge
    // domain (design §7/§20's `models/` layer is pure domain contracts).
    // `ENG-P3-001B` added the persistence layer this block's own comment
    // predicted: `repositories/` (Firestore converters/hierarchy
    // validation/cycle detection) and the one Firebase-touching seed file
    // (`seed/seedLoader.ts`, which composes the repositories to run the
    // idempotent seed load) — exempted for the same reason
    // `business/repositories/**` is. `seed/seedManifest.ts` and
    // `seed/burundiPilotSeedManifest.ts` remain covered by the
    // restriction and stay framework-independent (pure manifest
    // content/validation, design §10.3), matching this domain's own
    // `models/` precedent.
    files: ["functions/src/domains/commerceKnowledge/**/*.ts"],
    ignores: [
      "functions/src/domains/commerceKnowledge/repositories/**",
      "functions/src/domains/commerceKnowledge/seed/seedLoader.ts",
      "functions/src/domains/commerceKnowledge/seed/seedLoader.emulator.test.ts",
      // `ENG-P3-002A`: the Category/Business-Type read-transport service
      // composes the repositories above (already Firebase-adapter-capable)
      // — same exemption reasoning, not a new exception category.
      "functions/src/domains/commerceKnowledge/services/commerceKnowledgeReadService.ts",
      "functions/src/domains/commerceKnowledge/services/commerceKnowledgeReadService.emulator.test.ts",
    ],
    languageOptions: {
      ecmaVersion: 2023,
      globals: globals.node,
    },
    rules: {
      "@typescript-eslint/no-unused-vars": "error",
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: [
                "firebase-admin",
                "firebase-admin/*",
                "firebase-functions",
                "firebase-functions/*",
              ],
              message:
                "The Commerce Knowledge domain-contracts layer (ENG-P3-001A) is framework-independent — no Firebase SDK import is permitted here. Persistence/seed-loader implementation belongs to a future ENG-P3-001B module instead.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["*.{js,ts}", "**/*.config.{js,ts}"],
    languageOptions: {
      ecmaVersion: 2023,
      globals: { ...globals.node },
    },
  },
);
