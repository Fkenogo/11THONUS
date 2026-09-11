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
 *  3. Authenticated → resolve business access via `useAccessibleBusinessesQuery`
 *     (`getAccessibleBusinesses`), which is actor-scoped server-side and
 *     returns every business the caller can act in — as owner, or via any
 *     `status === "active"` manager/staff membership — by querying
 *     memberships by `userId` across *all* businesses, not just owned ones.
 *     Invited/removed/revoked memberships are excluded. A read failure
 *     surfaces as an explicit error+retry state below; it never silently
 *     falls through to the customer shell.
 *  4. ≥1 accessible business (owner or active membership, in any role) →
 *     `<Navigate to="/business" />`, the Business resolver, which itself
 *     offers "Personal" alongside each business+role per AP-003/§3.3
 *     (a person may hold both a personal and one or more business
 *     identities concurrently).
 *  5. Zero accessible businesses → the Customer shell (`/customer`).
 */

import type { Auth } from "firebase/auth";
import { onAuthStateChanged, type User } from "firebase/auth";
import type { Functions } from "firebase/functions";
import { useEffect, useState, type ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useTranslation } from "./i18n";
import { SignInPage } from "./authentication/SignInPage";
import { useAccessibleBusinessesQuery } from "./business/hooks/businessQueries";

function CenteredMessage({ children }: { children: ReactNode }) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-8 text-center">
      {children}
    </main>
  );
}

function AuthenticatedEntry() {
  const { t } = useTranslation("customer");
  const query = useAccessibleBusinessesQuery();

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
