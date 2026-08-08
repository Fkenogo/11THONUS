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
    files: ["*.{js,ts}", "**/*.config.{js,ts}"],
    languageOptions: {
      ecmaVersion: 2023,
      globals: { ...globals.node },
    },
  },
);
