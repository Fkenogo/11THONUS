/**
 * Shared mutation-error display (design §23, `ENG-P3-002C` finding —
 * before this, only the Terms step ever read a mutation's `error`; every
 * other step's failed mutation was completely silent). Maps a
 * `BusinessApiError` code onto the existing `business.errors.*` i18n
 * catalog — never a raw server message. A non-`BusinessApiError` (or no
 * error) renders nothing, consistent with "no raw Firebase/internal error
 * exposure" (design §23/Phase O).
 */

import { useTranslation } from "../../i18n";
import { BusinessApiError } from "../api/businessCallableClient";

export function MutationError({ error }: { error: unknown }) {
  const { t } = useTranslation("business");
  if (!(error instanceof BusinessApiError)) return null;
  return (
    <p role="alert" className="mt-2 text-sm text-red-600">
      {t(`errors.${error.code}`)}
    </p>
  );
}
