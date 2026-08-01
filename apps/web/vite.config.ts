/// <reference types="vitest/config" />
import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";

// CR3: the dedicated hosted test-harness build (`vite build --mode
// test-harness`) uses `harness.html` as its sole entry instead of the
// ordinary app's `index.html` — this is the mechanism that keeps every
// customer/business/admin route, and the PWA service worker, structurally
// out of that build's module graph, not merely gated at runtime. Every
// other build (`vite dev`, ordinary `vite build`) is completely
// unaffected: `mode` is `"development"`/`"production"` in those cases,
// so both conditionals below fall through to their original behaviour.
const TEST_HARNESS_MODE = "test-harness";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const isTestHarnessBuild = mode === TEST_HARNESS_MODE;

  return {
    plugins: [
      react(),
      tailwindcss(),
      // The PWA service worker/precache manifest has no purpose on a
      // temporary, torn-down-after-testing preview, and a stray cached SW
      // is exactly the kind of thing that could outlive the preview
      // channel in a tester's browser — omitted entirely for this mode
      // rather than merely left unregistered.
      ...(isTestHarnessBuild
        ? []
        : [
            VitePWA({
              registerType: "autoUpdate",
              includeAssets: ["favicon.svg"],
              manifest: {
                name: "11thONUS",
                short_name: "11thONUS",
                description: "11thONUS engineering foundation",
                theme_color: "#0a0a0a",
                background_color: "#ffffff",
                display: "standalone",
                icons: [
                  {
                    src: "favicon.svg",
                    sizes: "any",
                    type: "image/svg+xml",
                    purpose: "any",
                  },
                ],
              },
            }),
          ]),
    ],
    resolve: {
      alias: {
        "@": fileURLToPath(new URL("./src", import.meta.url)),
      },
    },
    build: isTestHarnessBuild
      ? {
          rollupOptions: {
            input: fileURLToPath(new URL("./harness.html", import.meta.url)),
          },
        }
      : undefined,
    test: {
      environment: "jsdom",
      globals: true,
      setupFiles: ["./src/test/setup.ts"],
    },
  };
});
