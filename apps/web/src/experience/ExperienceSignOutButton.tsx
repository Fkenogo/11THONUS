import { useState } from "react";
import type { Auth } from "firebase/auth";
import { useTranslation } from "../i18n";
import { signOutCurrentSession } from "../authentication/signOutFlow";

export function ExperienceSignOutButton({ auth }: { auth: Auth }) {
  const { t } = useTranslation("common");
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  async function signOut() {
    setBusy(true);
    setFailed(false);
    try {
      await signOutCurrentSession(auth);
    } catch {
      setFailed(true);
      setBusy(false);
    }
  }

  return (
    <div className="mt-6 border-t border-[var(--color-border)] pt-4">
      <button
        type="button"
        disabled={busy}
        onClick={signOut}
        className="min-h-11 w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-60"
      >
        {busy ? t("session.signingOut") : t("session.signOut")}
      </button>
      {failed && (
        <p role="alert" className="mt-2 text-sm text-red-700">
          {t("session.signOutError")}
        </p>
      )}
    </div>
  );
}
