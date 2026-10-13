// Runs `vite build` for the phone bundle through Vite's JS API so `envDir` can be isolated
// (the CLI has no such flag). Args: <envDir> <outDir>. The caller has already stripped VITE_* from
// this process' environment; the only VITE_* values Vite can see are in <envDir>/.env.
import { createRequire } from "node:module";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { repoRoot } from "../lib/config.mjs";

const [envDir, outDir] = process.argv.slice(2);
if (!envDir || !outDir) throw new Error("usage: build-worker.mjs <envDir> <outDir>");

const webDir = path.join(repoRoot, "apps/web");
const vitePath = createRequire(path.join(webDir, "package.json")).resolve("vite");
const { build } = await import(pathToFileURL(vitePath).href);

await build({
  root: webDir,
  configFile: path.join(webDir, "vite.config.ts"),
  mode: "production",
  envDir,
  build: { outDir, emptyOutDir: true },
});
