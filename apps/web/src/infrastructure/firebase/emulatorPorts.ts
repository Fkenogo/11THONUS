/** Local emulator endpoints; Founder Preview pins these from its guarded environment. */
export function readEmulatorPort(
  name: string,
  value: string | undefined,
  fallback: number,
): number {
  const port = value === undefined || value === "" ? fallback : Number(value);
  if (!Number.isInteger(port) || port < 1 || port > 65_535) {
    throw new Error(`${name} must be an integer TCP port between 1 and 65535.`);
  }
  return port;
}

export const FIREBASE_EMULATOR_PORTS = Object.freeze({
  auth: readEmulatorPort(
    "VITE_FIREBASE_AUTH_EMULATOR_PORT",
    import.meta.env.VITE_FIREBASE_AUTH_EMULATOR_PORT,
    28101,
  ),
  functions: readEmulatorPort(
    "VITE_FIREBASE_FUNCTIONS_EMULATOR_PORT",
    import.meta.env.VITE_FIREBASE_FUNCTIONS_EMULATOR_PORT,
    28102,
  ),
  firestore: readEmulatorPort(
    "VITE_FIREBASE_FIRESTORE_EMULATOR_PORT",
    import.meta.env.VITE_FIREBASE_FIRESTORE_EMULATOR_PORT,
    28103,
  ),
  storage: readEmulatorPort(
    "VITE_FIREBASE_STORAGE_EMULATOR_PORT",
    import.meta.env.VITE_FIREBASE_STORAGE_EMULATOR_PORT,
    28104,
  ),
});
