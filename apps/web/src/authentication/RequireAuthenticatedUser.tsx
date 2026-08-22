/**
 * Authenticated-route boundary (`ENG-P3-002B`, design §15). The repository
 * had no existing session/auth-state authority to reuse: `SignInPanel`
 * tracks only local per-flow state, and `observability/authLifecycle.ts`
 * wires `onAuthStateChanged` solely for breadcrumbs, not as a consumable
 * session context. This is therefore a small, reusable platform primitive —
 * its own dedicated `onAuthStateChanged` subscription — not a duplicate of
 * an existing authority.
 */

import { useEffect, useState, type ReactNode } from "react";
import { onAuthStateChanged, type Auth, type User } from "firebase/auth";

export type RequireAuthenticatedUserProps = {
  auth: Auth;
  children: ReactNode;
  renderUnauthenticated: () => ReactNode;
};

export function RequireAuthenticatedUser({
  auth,
  children,
  renderUnauthenticated,
}: RequireAuthenticatedUserProps) {
  const [user, setUser] = useState<User | null | "loading">("loading");

  useEffect(() => {
    return onAuthStateChanged(auth, setUser);
  }, [auth]);

  if (user === "loading") {
    return null;
  }

  return user ? <>{children}</> : <>{renderUnauthenticated()}</>;
}
