/**
 * WP-COM-06a -- the scheduled and signal-triggered Functions are really exported/discoverable, the
 * cadence is a deployment-time constant, and the dependency/boundary rules hold.
 *
 * Discovery: `firebase deploy` / the emulator load `lib/index.js` and enumerate its exports; a
 * v2 trigger carries its deployable description on `__endpoint`. Importing `./index` here is that
 * same enumeration. (A side-effect import in index.ts would NOT be discovered.)
 */

import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import * as entrypoint from "./index";
import {
  HELD_PURCHASE_RECOVERY_SCHEDULE,
  HELD_PURCHASE_SIGNAL_DOCUMENT,
} from "./composition/heldPurchaseProcessorWiring";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.join(__dirname, "..", "..");

type Endpoint = {
  scheduleTrigger?: { schedule?: string; retryConfig?: { retryCount?: number } };
  eventTrigger?: { eventType?: string; eventFilterPathPatterns?: Record<string, string> };
  maxInstances?: number;
  region?: string[];
  timeoutSeconds?: number;
};
const endpointOf = (name: string): Endpoint => {
  const fn = (entrypoint as unknown as Record<string, { __endpoint?: Endpoint }>)[name];
  expect(fn, `${name} must be an export of the Functions entrypoint`).toBeDefined();
  expect(fn.__endpoint, `${name} must be a deployable trigger`).toBeDefined();
  return fn.__endpoint!;
};

function sources(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = path.join(dir, name);
    if (statSync(full).isDirectory()) return sources(full);
    return full.endsWith(".ts") && !full.endsWith(".test.ts") ? [full] : [];
  });
}
const code = (file: string) =>
  readFileSync(file, "utf8")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/(^|[^:])\/\/.*$/gm, "$1");
const importsOf = (file: string) =>
  [...code(file).matchAll(/from\s+["']([^"']+)["']/g)].map((m) => m[1]);

describe("WP-COM-06a Function export / discovery", () => {
  it("recoverHeldPurchases is an exported scheduled Function on the deployment-time cadence", () => {
    const endpoint = endpointOf("recoverHeldPurchases");
    expect(endpoint.scheduleTrigger?.schedule).toBe(HELD_PURCHASE_RECOVERY_SCHEDULE);
    expect(HELD_PURCHASE_RECOVERY_SCHEDULE).toBe("every 5 minutes");
    expect(endpoint.maxInstances).toBe(1);
    expect(endpoint.scheduleTrigger?.retryConfig?.retryCount).toBe(0);
    expect(endpoint.region).toEqual(["europe-west1"]);
    expect(endpoint.timeoutSeconds).toBe(300);
  });

  it("reevaluateHeldPurchasesOnSignal is an exported Firestore onCreate Function on the signal collection", () => {
    const endpoint = endpointOf("reevaluateHeldPurchasesOnSignal");
    expect(endpoint.eventTrigger?.eventType).toBe("google.cloud.firestore.document.v1.created");
    expect(endpoint.eventTrigger?.eventFilterPathPatterns?.["document"]).toBe(
      HELD_PURCHASE_SIGNAL_DOCUMENT,
    );
    expect(endpoint.region).toEqual(["europe-west1"]);
  });

  it("the schedule is NOT runtime configurable: no environment variable or config read decides it", () => {
    const wiring = code(path.join(__dirname, "composition", "heldPurchaseProcessorWiring.ts"));
    expect(wiring).toMatch(/HELD_PURCHASE_RECOVERY_SCHEDULE\s*=\s*"every 5 minutes"/);
    expect(wiring).not.toMatch(/process\.env\[?["']?\w*SCHEDULE/i);
  });
});

describe("WP-COM-06a dependency direction and boundaries", () => {
  const commercialFiles = sources(path.join(__dirname, "domains", "commercial"));
  const purchaseFiles = sources(path.join(__dirname, "domains", "purchase"));

  it("Commercial imports NOTHING from the Purchase domain (it only calls its own port)", () => {
    for (const file of commercialFiles) {
      for (const spec of importsOf(file)) {
        expect(spec, `${path.relative(__dirname, file)} -> ${spec}`).not.toMatch(
          /(^|\/)purchase(\/|$)|composition\//,
        );
      }
    }
  });

  it("Purchase imports NOTHING from Commercial", () => {
    for (const file of purchaseFiles) {
      for (const spec of importsOf(file)) {
        expect(spec, `${path.relative(__dirname, file)} -> ${spec}`).not.toMatch(
          /(^|\/)commercial(\/|$)/,
        );
      }
    }
  });

  it("the new wiring imports no Commercial module (the port is satisfied structurally)", () => {
    const wiring = path.join(__dirname, "composition", "heldPurchaseProcessorWiring.ts");
    for (const spec of importsOf(wiring)) expect(spec).not.toMatch(/(^|\/)commercial(\/|$)/);
  });

  it("no domain code schedules anything: onSchedule/onDocumentCreated live only in index.ts", () => {
    for (const file of [...commercialFiles, ...purchaseFiles]) {
      expect(code(file), path.relative(__dirname, file)).not.toMatch(
        /onSchedule|onDocumentCreated|setInterval/,
      );
    }
    expect(code(path.join(__dirname, "index.ts"))).toMatch(/onSchedule\(/);
  });

  it("admission logic is not duplicated: the recovery code calls the canonical processor and never the decision primitives", () => {
    for (const file of [
      path.join(__dirname, "domains", "purchase", "services", "heldPurchaseRecovery.ts"),
      path.join(__dirname, "composition", "heldPurchaseProcessorWiring.ts"),
    ]) {
      const src = code(file);
      expect(src).not.toMatch(
        /admitOrHoldPurchase|admitPurchaseToLoyalty|decideCommercialAdmission/,
      );
      expect(src).not.toMatch(/INSERT\s+INTO|UPDATE\s+\w+\s+SET|DELETE\s+FROM|FOR\s+UPDATE/i);
    }
    expect(
      code(path.join(__dirname, "domains", "purchase", "services", "heldPurchaseRecovery.ts")),
    ).toContain("reevaluatePendingAdmissions(");
  });

  it("the signal is sent only by the command runner, only after commit, and never inside a transaction callback", () => {
    const runner = code(
      path.join(
        __dirname,
        "domains",
        "commercial",
        "services",
        "commercialAdministratorCommand.ts",
      ),
    );
    const iCommit = runner.indexOf("runCommercialCommand(");
    const iSignal = runner.indexOf("await sendCapacitySignal(");
    expect(iCommit).toBeGreaterThan(-1);
    expect(iSignal).toBeGreaterThan(iCommit);
    // No command body mentions the notifier: it cannot run inside the transaction.
    for (const file of commercialFiles.filter((f) => /services\/[a-zA-Z]+\.ts$/.test(f))) {
      if (file.endsWith("commercialAdministratorCommand.ts")) continue;
      expect(code(file), path.relative(__dirname, file)).not.toMatch(
        /capacityIncreaseNotifier|sendCapacitySignal|\.notify\(/,
      );
    }
  });

  it("the Commercial admission gate stays DEFAULT OFF: no committed configuration enables enforce", () => {
    const candidates = [
      path.join(repoRoot, "firebase.json"),
      path.join(repoRoot, "functions", ".env"),
      path.join(repoRoot, "functions", ".env.local"),
      path.join(repoRoot, ".env"),
      path.join(repoRoot, ".github", "workflows", "ci.yml"),
    ];
    for (const file of candidates) {
      let text: string;
      try {
        text = readFileSync(file, "utf8");
      } catch {
        continue; // file absent: nothing committed there
      }
      expect(text, file).not.toMatch(/PURCHASE_ADMISSION_GATE_MODE|HELD_PURCHASE_PROCESSOR_MODE/);
    }
    // The only reader of the gate flag treats anything but the literal "enforce" as off.
    const index = code(path.join(__dirname, "index.ts"));
    expect(index).toMatch(/admissionGateMode === "enforce"/);
  });
});
