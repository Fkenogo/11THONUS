/**
 * `IDENTITY-PROFILE-B` — the reusable Display Name profile-completion
 * surface (per `FD-IDENTITY-DISPLAY-001`/`IDENTITY-PROFILE-A`). One
 * component covers Incomplete (no Display Name set — the form itself *is*
 * the completion prompt), Complete (read view + edit action), and Edit
 * (the same form, prefilled) — deliberately not three separate
 * implementations (Phase E).
 *
 * Self-contained: takes only the Firebase platform handles, resolves its
 * own identity via `useAuthenticatedActor`, and never accepts a target
 * user id — the caller can only ever view/edit their own Display Name
 * (Phase M). Local form state is never treated as authoritative: a
 * successful save invalidates the read query and the UI re-renders from
 * the refetched, backend-authoritative value (Phase H).
 */

import { useState } from "react";
import type { Auth } from "firebase/auth";
import type { Functions } from "firebase/functions";
import { useTranslation } from "../i18n";
import { Button, FieldError } from "../components/ui/formPrimitives";
import { cn } from "../lib/utils";
import { useMyDisplayNameQuery } from "./hooks/displayNameQueries";
import { useSetDisplayNameMutation } from "./hooks/displayNameMutations";
import { DisplayNameMutationError } from "./DisplayNameMutationError";

const MAX_LENGTH = 50;

export type DisplayNameProfileProps = { auth: Auth; functions: Functions };

export function DisplayNameProfile({ auth, functions }: DisplayNameProfileProps) {
  const { t } = useTranslation("identity");
  const platform = { auth, functions };
  const query = useMyDisplayNameQuery(platform);
  const mutation = useSetDisplayNameMutation(platform);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");

  if (query.status === "pending") {
    return (
      <section>
        <p>{t("profile.loading")}</p>
      </section>
    );
  }

  if (query.status === "error") {
    return (
      <section>
        <h1 className="mb-1 text-xl font-semibold">{t("profile.title")}</h1>
        <p role="alert" className="mt-2 text-sm text-red-600">
          {t("errors.failed")}
        </p>
        <Button type="button" onClick={() => query.refetch()} className="mt-3">
          {t("profile.retry")}
        </Button>
      </section>
    );
  }

  const displayName = query.data.displayName;
  const showForm = !displayName || editing;

  function startEditing() {
    setDraft(displayName ?? "");
    setEditing(true);
  }

  function cancelEditing() {
    setEditing(false);
  }

  function handleSave() {
    const trimmed = draft.trim();
    if (trimmed.length < 1 || trimmed.length > MAX_LENGTH) return;
    mutation.mutate(trimmed, { onSuccess: () => setEditing(false) });
  }

  const trimmedDraft = draft.trim();
  const tooLong = trimmedDraft.length > MAX_LENGTH;
  const canSave =
    trimmedDraft.length >= 1 && trimmedDraft.length <= MAX_LENGTH && !mutation.isPending;

  if (!showForm) {
    return (
      <section>
        <h1 className="mb-1 text-xl font-semibold">{t("profile.title")}</h1>
        <p className="mb-6 text-[var(--color-muted-foreground)]">{t("profile.subtitle")}</p>
        <div className="rounded-md border border-[var(--color-border)] p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium">{t("profile.displayNameLabel")}</p>
              <p>{displayName}</p>
            </div>
            <button
              type="button"
              className="-m-3 min-h-11 p-3 text-sm underline"
              onClick={startEditing}
            >
              {t("profile.editAction")}
            </button>
          </div>
        </div>
      </section>
    );
  }

  const fieldErrorId = "display-name-error";
  const fieldError = tooLong ? t("validation.tooLong") : undefined;

  return (
    <section>
      <h1 className="mb-1 text-xl font-semibold">{t("profile.title")}</h1>
      <p className="mb-6 text-[var(--color-muted-foreground)]">{t("profile.subtitle")}</p>
      {!displayName && (
        <p className="mb-4 text-sm text-[var(--color-muted-foreground)]">{t("profile.missing")}</p>
      )}
      <div className="flex flex-col gap-3">
        <div>
          <label htmlFor="displayName" className="mb-1 block text-sm font-medium">
            {t("profile.displayNameLabel")}
          </label>
          <input
            id="displayName"
            type="text"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            aria-invalid={fieldError ? true : undefined}
            aria-describedby={fieldError ? fieldErrorId : "display-name-help"}
            className={cn(
              "min-h-11 w-full rounded-md border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-[var(--color-foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] disabled:opacity-50",
              fieldError && "border-red-600",
            )}
            disabled={mutation.isPending}
          />
          {fieldError ? (
            <FieldError id={fieldErrorId} message={fieldError} />
          ) : (
            <p id="display-name-help" className="mt-1 text-sm text-[var(--color-muted-foreground)]">
              {t("profile.displayNameHelp")}
            </p>
          )}
        </div>
        <div className="flex gap-3">
          <Button type="button" disabled={!canSave} onClick={handleSave} className="min-h-11">
            {mutation.isPending ? t("profile.saving") : t("profile.save")}
          </Button>
          {displayName && (
            <Button
              type="button"
              variant="secondary"
              onClick={cancelEditing}
              disabled={mutation.isPending}
              className="min-h-11"
            >
              {t("profile.cancel")}
            </Button>
          )}
        </div>
        <DisplayNameMutationError error={mutation.error} />
      </div>
    </section>
  );
}
