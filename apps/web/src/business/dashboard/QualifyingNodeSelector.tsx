/**
 * Reward Program qualifying-node selector (`PLATFORM-BASELINE-008`).
 *
 * Replaces the opaque comma-separated Firestore-id `TextField` this page
 * used to render for `qualifyingNodes` (`PLATFORM-BASELINE-005A`) with a
 * human-usable, multi-select checkbox list backed by the governed
 * Commerce Knowledge read transport
 * (`listQualifyingNodesForCategory`/`resolveKnowledgeNodeLabels`,
 * `commerceKnowledgeReadService.ts`). The operator never types or sees a
 * raw canonical id here; the component only ever emits/consumes
 * `QualifyingNodeWire[]` (`{knowledgeNodeId, businessDisplayName}`), the
 * exact shape the domain/wire layer already expects (`rewardProgram.ts`'s
 * `QualifyingNode[]` — already array-shaped end to end, so multi-select is
 * not a new capability, only a new UI over an existing one).
 *
 * Candidates are scoped to the Reward Program's own category
 * (`reward_program_category` -> `{standard_product, standard_service}`,
 * the fixed Commerce Knowledge hierarchy adjacency) — never a flat,
 * unscoped list of every qualifying-eligible node platform-wide.
 *
 * A previously-selected node that is no longer in the live `active`
 * candidate list (retired, archived, or otherwise unresolvable) is never
 * silently dropped: it is rendered in a separate "no longer available"
 * section, still checked, with its label resolved via
 * `resolveKnowledgeNodeLabels` (which — unlike the candidate list —
 * resolves labels for ANY status, mirroring
 * `isResolvableForExistingReference`'s "retirement never breaks an
 * existing reference" rule) or, failing that, its last-known persisted
 * `businessDisplayName`. Server-side publication validation
 * (`rewardProgramKnowledgeValidation.ts`, RF-3) remains the sole
 * authority over whether that configuration is actually publishable —
 * this component only decides what to show and what canonical ids to
 * keep bound to the draft.
 */

import { useTranslation } from "../../i18n";
import { Checkbox } from "../../components/ui/formPrimitives";
import {
  useKnowledgeNodeLabelsQuery,
  useQualifyingNodesForCategoryQuery,
} from "../hooks/businessQueries";
import type { QualifyingNodeWire } from "../api/rewardProgramMutations";

export function QualifyingNodeSelector({
  idPrefix,
  categoryId,
  selected,
  onChange,
}: {
  idPrefix: string;
  categoryId: string | undefined;
  selected: readonly QualifyingNodeWire[];
  onChange: (nodes: QualifyingNodeWire[]) => void;
}) {
  const { t, i18n } = useTranslation("business");
  const candidatesQuery = useQualifyingNodesForCategoryQuery(categoryId, i18n.language);

  const selectedIds = selected.map((n) => n.knowledgeNodeId);
  const candidates = candidatesQuery.data ?? [];
  const candidateIds = new Set(candidates.map((c) => c.id));
  const unresolvedIds = selectedIds.filter((id) => !candidateIds.has(id));
  const labelsQuery = useKnowledgeNodeLabelsQuery(unresolvedIds, i18n.language);

  if (!categoryId) {
    return (
      <p className="text-sm text-[var(--color-muted-foreground)]">
        {t("rewardProgram.qualifyingNodeSelector.chooseCategoryFirst")}
      </p>
    );
  }

  function setNode(id: string, label: string | null, checked: boolean) {
    if (checked) {
      onChange([
        ...selected.filter((n) => n.knowledgeNodeId !== id),
        { knowledgeNodeId: id, businessDisplayName: label },
      ]);
    } else {
      onChange(selected.filter((n) => n.knowledgeNodeId !== id));
    }
  }

  const nothingToShow =
    candidatesQuery.isSuccess && candidates.length === 0 && unresolvedIds.length === 0;

  return (
    <div>
      <p className="mb-1 block text-sm font-medium">{t("rewardProgram.fieldQualifyingNodes")}</p>

      {candidatesQuery.isLoading && (
        <p className="text-sm text-[var(--color-muted-foreground)]">
          {t("rewardProgram.qualifyingNodeSelector.loading")}
        </p>
      )}

      {candidatesQuery.isError && (
        <div
          role="alert"
          className="rounded-md border border-[var(--color-border)] p-2 text-sm text-red-600"
        >
          {t("rewardProgram.qualifyingNodeSelector.loadError")}
        </div>
      )}

      {nothingToShow && (
        <p className="text-sm text-[var(--color-muted-foreground)]">
          {t("rewardProgram.qualifyingNodeSelector.empty")}
        </p>
      )}

      {candidates.length > 0 && (
        <ul className="space-y-1">
          {candidates.map((candidate) => (
            <li key={candidate.id}>
              <Checkbox
                id={`${idPrefix}-node-${candidate.id}`}
                label={candidate.displayLabel}
                checked={selectedIds.includes(candidate.id)}
                onChange={(checked) => setNode(candidate.id, candidate.displayLabel, checked)}
              />
            </li>
          ))}
        </ul>
      )}

      {unresolvedIds.length > 0 && (
        <ul className="mt-2 space-y-1 border-t border-[var(--color-border)] pt-2">
          {unresolvedIds.map((id) => {
            const resolved = labelsQuery.data?.find((l) => l.id === id);
            const stored = selected.find((n) => n.knowledgeNodeId === id)?.businessDisplayName;
            const label =
              resolved?.displayLabel ??
              stored ??
              t("rewardProgram.qualifyingNodeSelector.unavailableLabel");
            return (
              <li key={id}>
                <Checkbox
                  id={`${idPrefix}-node-unavailable-${id}`}
                  label={
                    <span>
                      <span className="italic">{label}</span>{" "}
                      <span className="text-xs text-[var(--color-muted-foreground)]">
                        {t("rewardProgram.qualifyingNodeSelector.unavailableNote")}
                      </span>
                    </span>
                  }
                  checked
                  onChange={(checked) => {
                    if (!checked) setNode(id, label, false);
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
