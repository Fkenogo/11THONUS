/**
 * Shared mutation-error display for the Display Name profile-completion
 * surface. Maps an `IdentityApiError` code onto the `identity.errors.*` i18n
 * catalog — never a raw server message. A non-`IdentityApiError` (or no
 * error) renders nothing.
 */

import { useTranslation } from "../i18n";
import { IdentityApiError } from "./api/identityCallableClient";

export function DisplayNameMutationError({ error }: { error: unknown }) {
  const { t } = useTranslation("identity");
  if (!(error instanceof IdentityApiError)) return null;
  return (
    <p role="alert" className="mt-2 text-sm text-red-600">
      {t(`errors.${error.code}`)}
    </p>
  );
}
