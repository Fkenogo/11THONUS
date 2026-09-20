/**
 * Reward Program qualifying-item selector (`PLATFORM-BASELINE-013B`,
 * `DEC-LOY-016` / `FD-REWARD-QUALIFYING-ITEM-001`).
 *
 * Replaces `QualifyingNodeSelector` (canonical Commerce Knowledge
 * multi-select, removed): the operator now works with the Business's OWN
 * Qualifying Items. The component only ever emits/consumes stable
 * `qualifyingItemId` strings -- the exact shape the domain/wire layer
 * expects (`qualifyingItemIds: string[]`) -- while rendering the
 * Business-authored item names. Internal UUIDs are never shown; no
 * Commerce Knowledge classification is required (an unclassified item is
 * selectable exactly like a classified one); only `active` items are
 * offered for new selection.
 *
 * A previously-selected id that is no longer in the active list (retired
 * after the draft was saved, or otherwise unresolvable) is never silently
 * dropped: it renders in a separate "no longer available" section, still
 * checked, labelled from the version's own frozen snapshot name (which --
 * unlike the live item row -- survives rename and retirement). Unchecking
 * it removes it from the draft. Server-side validation
 * (`rewardProgramQualificationValidation.ts`, RF-3) remains the sole
 * authority over whether that configuration is actually publishable --
 * this component only decides what to show and what item ids to keep
 * bound to the draft.
 */

import { useTranslation } from "../../i18n";
import { Checkbox } from "../../components/ui/formPrimitives";
import type { QualifyingItemWire } from "../api/qualifyingItems";

export function QualifyingItemSelector({
  idPrefix,
  items,
  isLoading,
  isError,
  selectedIds,
  onChange,
  snapshotNames,
}: {
  idPrefix: string;
  /** The Business's `active` items (the selectable set for a new binding). */
  items: readonly QualifyingItemWire[] | undefined;
  isLoading: boolean;
  isError: boolean;
  /** Structural binding: stable Qualifying Item ids, never display names. */
  selectedIds: readonly string[];
  onChange: (ids: string[]) => void;
  /**
   * Frozen display evidence for ids that may no longer resolve live
   * (a version's `itemNameAtVersion` per id). Falls back to the
   * "unavailable" label when absent.
   */
  snapshotNames: ReadonlyMap<string, string>;
}) {
  const { t } = useTranslation("business");

  const activeIds = new Set((items ?? []).map((item) => item.id));
  const retiredIds = selectedIds.filter((id) => !activeIds.has(id));

  function setItem(id: string, checked: boolean) {
    if (checked) {
      onChange([...selectedIds.filter((selected) => selected !== id), id]);
    } else {
      onChange(selectedIds.filter((selected) => selected !== id));
    }
  }

  const nothingToShow =
    !isLoading && !isError && (items ?? []).length === 0 && retiredIds.length === 0;

  return (
    <div>
      <p className="mb-1 block text-sm font-medium">{t("rewardProgram.fieldQualifyingItems")}</p>

      {isLoading && (
        <p className="text-sm text-[var(--color-muted-foreground)]">
          {t("rewardProgram.qualifyingItemSelector.loading")}
        </p>
      )}

      {isError && (
        <div
          role="alert"
          className="rounded-md border border-[var(--color-border)] p-2 text-sm text-red-600"
        >
          {t("rewardProgram.qualifyingItemSelector.loadError")}
        </div>
      )}

      {nothingToShow && (
        <p className="text-sm text-[var(--color-muted-foreground)]">
          {t("rewardProgram.qualifyingItemSelector.empty")}
        </p>
      )}

      {(items ?? []).length > 0 && (
        <ul className="space-y-1">
          {(items ?? []).map((item) => (
            <li key={item.id}>
              <Checkbox
                id={`${idPrefix}-item-${item.id}`}
                label={item.name}
                checked={selectedIds.includes(item.id)}
                onChange={(checked) => setItem(item.id, checked)}
              />
            </li>
          ))}
        </ul>
      )}

      {retiredIds.length > 0 && (
        <ul className="mt-2 space-y-1 border-t border-[var(--color-border)] pt-2">
          {retiredIds.map((id) => {
            const label =
              snapshotNames.get(id) ?? t("rewardProgram.qualifyingItemSelector.unavailableLabel");
            return (
              <li key={id}>
                <Checkbox
                  id={`${idPrefix}-item-unavailable-${id}`}
                  label={
                    <span>
                      <span className="italic">{label}</span>{" "}
                      <span className="text-xs text-[var(--color-muted-foreground)]">
                        {t("rewardProgram.qualifyingItemSelector.unavailableNote")}
                      </span>
                    </span>
                  }
                  checked
                  onChange={(checked) => {
                    if (!checked) setItem(id, false);
                  }}
                />
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
