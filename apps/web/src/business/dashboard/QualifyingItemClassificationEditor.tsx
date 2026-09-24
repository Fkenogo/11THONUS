import { useState } from "react";
import { useTranslation } from "../../i18n";
import { Button, TextField } from "../../components/ui/formPrimitives";
import {
  useQualifyingNodesForBusinessTypeQuery,
  useSearchQualifyingNodesQuery,
} from "../hooks/businessQueries";
import { useDebouncedValue } from "../hooks/useDebouncedValue";
import type { QualifyingItemWire } from "../api/qualifyingItems";

/** Optional Commerce Knowledge enrichment for a Business-owned item's identity. */
export function QualifyingItemClassificationEditor({
  item,
  businessTypeId,
  classificationLabel,
  onAssign,
  onRemove,
  isSaving,
}: {
  item: QualifyingItemWire;
  businessTypeId: string | undefined;
  classificationLabel: string | undefined;
  onAssign: (knowledgeNodeId: string) => void;
  onRemove: () => void;
  isSaving: boolean;
}) {
  const { t, i18n } = useTranslation("business");
  const languageCode = i18n.language.startsWith("fr") ? "fr" : "en";
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 300);
  const suggestions = useQualifyingNodesForBusinessTypeQuery(businessTypeId, languageCode);
  const candidates = useSearchQualifyingNodesQuery(debouncedSearch, languageCode);
  return (
    <div className="mt-2 w-full rounded bg-[var(--color-muted)] p-2">
      <p className="text-xs font-medium">{t("rewardProgram.classification.label")}</p>
      {item.knowledgeNodeId ? (
        <div className="mt-1 flex flex-wrap items-center gap-2 text-sm">
          <span>{classificationLabel ?? t("rewardProgram.classification.unavailable")}</span>
          <Button type="button" variant="secondary" disabled={isSaving} onClick={onRemove}>
            {t("rewardProgram.classification.removeAction")}
          </Button>
        </div>
      ) : (
        <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">
          {t("rewardProgram.classification.none")}
        </p>
      )}
      <TextField
        id={`qi-classification-search-${item.id}`}
        label={t("rewardProgram.classification.searchLabel")}
        value={search}
        onChange={setSearch}
      />
      {debouncedSearch.trim().length >= 2 ? (
        <div className="mt-1" aria-live="polite">
          {candidates.isLoading && <p>{t("rewardProgram.classification.loading")}</p>}
          {candidates.isError && <p role="alert">{t("rewardProgram.classification.loadError")}</p>}
          {(candidates.data ?? []).map((candidate) => (
            <Button
              key={candidate.id}
              type="button"
              variant="secondary"
              disabled={isSaving || candidate.id === item.knowledgeNodeId}
              onClick={() => {
                onAssign(candidate.id);
                setSearch("");
              }}
            >
              {candidate.displayLabel}
            </Button>
          ))}
          {!candidates.isLoading && !candidates.isError && (candidates.data ?? []).length === 0 && (
            <p className="text-sm">{t("rewardProgram.classification.noResults")}</p>
          )}
        </div>
      ) : (
        <div className="mt-1" aria-live="polite">
          {suggestions.isLoading && <p>{t("rewardProgram.classification.loading")}</p>}
          {suggestions.isError && <p role="alert">{t("rewardProgram.classification.loadError")}</p>}
          {(suggestions.data ?? []).length > 0 && (
            <p className="text-xs font-medium">{t("rewardProgram.classification.suggestions")}</p>
          )}
          {(suggestions.data ?? []).map((candidate) => (
            <Button
              key={candidate.id}
              type="button"
              variant="secondary"
              disabled={isSaving || candidate.id === item.knowledgeNodeId}
              onClick={() => onAssign(candidate.id)}
            >
              {candidate.displayLabel}
            </Button>
          ))}
        </div>
      )}
      <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">
        {t("rewardProgram.classification.optionalHint")}
      </p>
    </div>
  );
}
