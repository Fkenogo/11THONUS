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
  hub: "Firebase Emulator Hub",
  logging: "Firebase Emulator logging service",
  web: "web dev server",
});

function bindProbe(port, host) {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.unref();
    server.once("error", (error) => {
      // EACCES can mean the OS reserves the port even when no process owns it. Other errors do
      // not prove availability and must fail closed.
      if (error.code === "EADDRINUSE" || error.code === "EACCES") resolve(false);
      else reject(error);
    });
    server.listen({ port, host, exclusive: true }, () => server.close(() => resolve(true)));
  });
}

/** True when the preview's IPv4 loopback address can bind `port`. */
export async function isPortFree(port) {
  // All preview clients use 127.0.0.1. Firebase's emulator port selection can use its primary
  // localhost address when a secondary address is occupied, so an IPv6-only listener is irrelevant.
  return bindProbe(port, LOOPBACK);
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
      `Cannot start the Firebase emulators — a required port is unavailable:\n${list}\n` +
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
