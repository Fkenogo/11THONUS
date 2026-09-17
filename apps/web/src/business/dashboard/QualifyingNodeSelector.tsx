/**
 * Reward Program qualifying-node selector (`PLATFORM-BASELINE-008`,
 * redesigned by `PLATFORM-BASELINE-010B` per Founder decision
 * `DEC-LOY-014` / `FD-REWARD-QUALIFICATION-001`).
 *
 * Replaces the opaque comma-separated Firestore-id `TextField` this page
 * used to render for `qualifyingNodes` (`PLATFORM-BASELINE-005A`) with a
 * human-usable, multi-select checkbox list backed by the governed
 * Commerce Knowledge read transport. The operator never types or sees a
 * raw canonical id here; the component only ever emits/consumes
 * `QualifyingNodeWire[]` (`{knowledgeNodeId, businessDisplayName}`), the
 * exact shape the domain/wire layer already expects (`rewardProgram.ts`'s
 * `QualifyingNode[]` — already array-shaped end to end, so multi-select is
 * not a new capability, only a new UI over an existing one).
 *
 * `PLATFORM-BASELINE-010B` replaces the Reward-Program-category-scoped
 * candidate list with two independent sources, per the Founder decision
 * that Business Type/Commerce Knowledge category relationships may
 * assist DISCOVERY only, never become a second qualification gate:
 *
 * 1. DEFAULT scope (`useQualifyingNodesForBusinessTypeQuery`) — every
 *    `active` product/service reachable from the Business's own
 *    `businessTypeId`, shown as the default checkbox list.
 * 2. Broader "escape hatch" (`useSearchQualifyingNodesQuery`) — a search
 *    box that finds and lets the operator select an eligible canonical
 *    node OUTSIDE that default scope, by typed name, never by pasting an
 *    id. Selecting a search result is accepted identically to selecting
 *    a default-scope candidate — this component enforces no
 *    Business-Type restriction of its own, matching the server's
 *    `validateQualifyingNodes` (which has none either).
 *
 * A previously-selected node that is in neither the default list nor the
 * caller's live search results (retired, archived, or otherwise
 * unresolvable, OR simply outside both lists right now) is never silently
 * dropped: it is rendered in a separate "no longer available" section,
 * still checked, with its label resolved via `resolveKnowledgeNodeLabels`
 * (which — unlike either candidate list — resolves labels for ANY status,
 * mirroring `isResolvableForExistingReference`'s "retirement never breaks
 * an existing reference" rule) or, failing that, its last-known persisted
 * `businessDisplayName`. Server-side publication validation
 * (`rewardProgramKnowledgeValidation.ts`, RF-3) remains the sole
 * authority over whether that configuration is actually publishable —
 * this component only decides what to show and what canonical ids to
 * keep bound to the draft.
 */

import { useState } from "react";
import { useTranslation } from "../../i18n";
import { Checkbox, TextField } from "../../components/ui/formPrimitives";
import {
  useKnowledgeNodeLabelsQuery,
  useQualifyingNodesForBusinessTypeQuery,
  useSearchQualifyingNodesQuery,
} from "../hooks/businessQueries";
import type { QualifyingNodeWire } from "../api/rewardProgramMutations";

export function QualifyingNodeSelector({
  idPrefix,
  businessTypeId,
  selected,
  onChange,
}: {
  idPrefix: string;
  businessTypeId: string | undefined;
  selected: readonly QualifyingNodeWire[];
  onChange: (nodes: QualifyingNodeWire[]) => void;
}) {
  const { t, i18n } = useTranslation("business");
  const [searchText, setSearchText] = useState("");
  const candidatesQuery = useQualifyingNodesForBusinessTypeQuery(businessTypeId, i18n.language);
  const searchQuery = useSearchQualifyingNodesQuery(searchText, i18n.language);

  const selectedIds = selected.map((n) => n.knowledgeNodeId);
  const candidates = candidatesQuery.data ?? [];
  const searchResults = searchQuery.data ?? [];
  const knownIds = new Set([...candidates.map((c) => c.id), ...searchResults.map((c) => c.id)]);
  const unresolvedIds = selectedIds.filter((id) => !knownIds.has(id));
  const labelsQuery = useKnowledgeNodeLabelsQuery(unresolvedIds, i18n.language);

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

      {/* PLATFORM-BASELINE-010B escape hatch: a canonical product/service
          outside the default Business-Type discovery scope remains
          reachable here by typed name -- never by pasting an id. Selecting
          a result is accepted by the server exactly like a default-scope
          candidate (no Business-Type gate at write time). */}
      <div className="mt-3 border-t border-[var(--color-border)] pt-3">
        <TextField
          id={`${idPrefix}-search`}
          label={t("rewardProgram.qualifyingNodeSelector.searchLabel")}
          value={searchText}
          onChange={setSearchText}
        />

        {searchQuery.isLoading && (
          <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">
            {t("rewardProgram.qualifyingNodeSelector.searchLoading")}
          </p>
        )}

        {searchQuery.isError && (
          <div
            role="alert"
            className="mt-1 rounded-md border border-[var(--color-border)] p-2 text-sm text-red-600"
          >
            {t("rewardProgram.qualifyingNodeSelector.searchError")}
          </div>
        )}

        {searchQuery.isSuccess && searchText.trim().length > 0 && searchResults.length === 0 && (
          <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">
            {t("rewardProgram.qualifyingNodeSelector.searchEmpty")}
          </p>
        )}

        {searchResults.length > 0 && (
          <>
            <p className="mt-2 text-xs font-medium text-[var(--color-muted-foreground)]">
              {t("rewardProgram.qualifyingNodeSelector.searchResultsLabel")}
            </p>
            <ul className="space-y-1">
              {searchResults.map((result) => (
                <li key={result.id}>
                  <Checkbox
                    id={`${idPrefix}-search-node-${result.id}`}
                    label={result.displayLabel}
                    checked={selectedIds.includes(result.id)}
                    onChange={(checked) => setNode(result.id, result.displayLabel, checked)}
                  />
                </li>
              ))}
            </ul>
          </>
        )}
      </div>

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
