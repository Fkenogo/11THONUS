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
    files: ["*.{js,ts}", "**/*.config.{js,ts}"],
    languageOptions: {
      ecmaVersion: 2023,
      globals: { ...globals.node },
    },
  },
);
