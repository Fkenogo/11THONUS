import { signIn } from "./emulatorClient.mjs";

/** Proves the deterministic account credentials are present in the Auth emulator. */
export async function verifyPreviewAccounts(identities, password, authenticate = signIn) {
  const failures = [];
  for (const identity of identities) {
    try {
      await authenticate({ email: identity.email, password });
    } catch {
      failures.push(identity.key);
    }
  }
  return failures;
}
