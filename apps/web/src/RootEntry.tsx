/**
 * `/` — the product entry / identity-routing resolver (`PRODUCT-ALIGN-002`).
 *
 * Replaces the literal "Phase 0 infrastructure scaffold" `AppShell` that
 * previously rendered at this route. Resolution order:
 *
 *  1. Auth state loading → a translated loading message (never blank).
 *  2. Unauthenticated → the real production sign-in surface (`SignInPage`,
 *     composing the existing `SignInPanel` + `createSignInActions`) — not a
 *     bare "please sign in" stub.
 *  3. Authenticated → resolve business access. The only confirmed
 *     client-visible signal for "does this user have business access" is
 *     `useOwnedBusinessesQuery` (`getOwnedBusinesses`). `listStaffMemberships`
 *     exists but requires a `businessId` the client doesn't yet have — there
 *     is no callable to list a user's memberships *across* businesses, so a
 *     Staff member who does not own a business (has access via membership
 *     only) has no client-visible signal here and falls through to the
 *     customer shell along with every other non-owning authenticated user.
 *     This gap is pre-existing (no such callable exists server-side either)
 *     and is not created or resolved by this change.
 *  4. Owns ≥1 business → `<Navigate to="/business" />` (the existing,
 *     untouched Business resolver).
 *  5. Otherwise → the Customer shell (`/customer`).
 */

import type { Auth } from "firebase/auth";
import { onAuthStateChanged, type User } from "firebase/auth";
import type { Functions } from "firebase/functions";
import { useEffect, useState, type ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useTranslation } from "./i18n";
import { SignInPage } from "./authentication/SignInPage";
import { useOwnedBusinessesQuery } from "./business/hooks/businessQueries";

function CenteredMessage({ children }: { children: ReactNode }) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-8 text-center">
      {children}
    </main>
  );
}

function AuthenticatedEntry() {
  const { t } = useTranslation("customer");
  const query = useOwnedBusinessesQuery();

  if (query.status === "pending") {
    return (
      <CenteredMessage>
        <p role="status">{t("entry.loading")}</p>
      </CenteredMessage>
    );
  }

  if (query.status === "error") {
    return (
      <CenteredMessage>
        <p>{t("entry.errorBody")}</p>
        <button
          type="button"
          onClick={() => query.refetch()}
          className="rounded-md border border-[var(--color-border)] px-4 py-2"
        >
          {t("entry.retry")}
        </button>
      </CenteredMessage>
    );
  }

  if (query.data.length > 0) {
    return <Navigate to="/business" replace />;
  }

  return <Navigate to="/customer" replace />;
}

export function RootEntry({ auth, functions }: { auth: Auth; functions: Functions }) {
  const { t } = useTranslation("customer");
  const [user, setUser] = useState<User | null | "loading">("loading");

  useEffect(() => onAuthStateChanged(auth, setUser), [auth]);

  if (user === "loading") {
    return (
      <CenteredMessage>
        <p role="status">{t("entry.loading")}</p>
      </CenteredMessage>
    );
  }

  if (!user) {
    return <SignInPage auth={auth} functions={functions} />;
  }

  return <AuthenticatedEntry />;
}
