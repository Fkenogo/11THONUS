// Founder Preview (EA-002-CORR-001) — port preflight.
//
// Before the Firebase emulators are launched, every port they must bind is probed. A port that is
// already in use makes the launch refuse with an explicit message naming the port and the
// service that needs it. The probe only tries to *bind* the port and releases it immediately: it
// never connects to, signals, or inspects whatever owns the port, so an unrelated local project
// (for example one using :4000) is left entirely alone.
import net from "node:net";
import { LOOPBACK, emulatorLaunchPorts, ports as defaultPorts } from "./config.mjs";

const PORT_PURPOSE = Object.freeze({
  auth: "Firebase Auth emulator",
  functions: "Firebase Functions emulator",
  firestore: "Firebase Firestore emulator",
  emulatorUi: "Firebase Emulator UI",
  web: "web dev server",
});

// IPv4 and IPv6 loopback: the Firebase emulators resolve `localhost` to either.
const PROBE_HOSTS = [LOOPBACK, "::1"];

function bindProbe(port, host) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.unref();
    server.once("error", (error) => {
      // Only "in use" counts as occupied. A host family this machine lacks (EADDRNOTAVAIL,
      // EAFNOSUPPORT) cannot hold the port, so it is not a conflict.
      resolve(error.code !== "EADDRINUSE");
    });
    server.listen({ port, host, exclusive: true }, () => server.close(() => resolve(true)));
  });
}

/** True when nothing is bound to `port` on IPv4 or IPv6 loopback. */
export async function isPortFree(port) {
  for (const host of PROBE_HOSTS) {
    if (!(await bindProbe(port, host))) return false;
  }
  return true;
}

/** Returns `[{ name, port, purpose }]` for each requested port that is already taken. */
export async function findOccupiedPorts(
  { ports = defaultPorts, names = emulatorLaunchPorts, probe = isPortFree } = {},
) {
  const occupied = [];
  for (const name of names) {
    if (!(await probe(ports[name]))) {
      occupied.push({ name, port: ports[name], purpose: PORT_PURPOSE[name] ?? name });
    }
  }
  return occupied;
}

export class PortConflictError extends Error {
  constructor(occupied) {
    const list = occupied.map((o) => `  - ${o.port} (needed by the ${o.purpose})`).join("\n");
    super(
      `Cannot start the Firebase emulators — a required port is already in use by another process:\n${list}\n` +
        "The preview does not stop or modify processes it did not start. Free the port (or stop the other " +
        "service yourself) and retry. If it is a previous 11thONUS preview, run `pnpm preview:stop`.",
    );
    this.name = "PortConflictError";
    this.occupied = occupied;
  }
}

export async function assertEmulatorPortsFree(options) {
  const occupied = await findOccupiedPorts(options);
  if (occupied.length > 0) throw new PortConflictError(occupied);
}
