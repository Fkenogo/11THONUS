/// <reference types="vitest/config" />
import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";
import { htmlEntryForMode, includePwaForMode } from "./viteBuildModes.js";

// Three dedicated hosted builds each get their own `vite build --mode …`
// handling here, driven by the pure, unit-tested `viteBuildModes.ts` helper:
// `test-harness` and `sign-in-preview` swap in their own single HTML entry
// instead of the ordinary app's `index.html` — the mechanism that keeps
// every customer/business/admin route structurally out of that build's
// module graph, not merely gated at runtime. `founder-qa-preview`
// (ENG-P3-002C-PREVIEW-001) is different: it deliberately keeps the
// ordinary `index.html`/module graph — the real `/business` routes must
// stay reachable — so `htmlEntryForMode` returns `undefined` for it, same
// as an ordinary build; only its *preview sign-in route* is separately
// gated in `App.tsx`. All three modes share one thing here: `includePwaForMode`
// omits the PWA service worker for every one of them (a stray cached SW must
// never outlive a torn-down preview), which is why it is driven by the wider
// `isTemporaryPreviewMode` check, not the narrower HTML-entry one. Every
// other build (`vite dev`, ordinary `vite build`) is completely unaffected:
// `mode` is `"development"`/`"production"` in those cases, so every
// conditional below falls through to its original behaviour.

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const htmlEntry = htmlEntryForMode(mode);

  return {
    plugins: [
      react(),
      tailwindcss(),
      // The PWA service worker/precache manifest has no purpose on a
      // temporary, torn-down-after-testing preview, and a stray cached SW
      // is exactly the kind of thing that could outlive the preview
      // channel in a tester's browser — omitted entirely for those modes
      // rather than merely left unregistered.
      ...(includePwaForMode(mode)
        ? [
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
          ]
        : []),
    ],
    resolve: {
      alias: {
        "@": fileURLToPath(new URL("./src", import.meta.url)),
      },
    },
    build: htmlEntry
      ? {
          rollupOptions: {
            input: fileURLToPath(new URL(`./${htmlEntry}`, import.meta.url)),
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
