import { useTranslation } from "../i18n";

export function ExperienceBrand({ compact = false }: { compact?: boolean }) {
  const { t } = useTranslation("common");

  return (
    <div className="flex items-center gap-3" aria-label={t("brand.name")}>
      <span
        aria-hidden="true"
        className="grid size-10 shrink-0 place-items-center rounded-xl bg-amber-600 text-base font-extrabold text-white shadow-sm"
      >
        11
      </span>
      <span className="min-w-0">
        <span className="block text-lg font-extrabold leading-tight tracking-tight text-slate-950">
          11th<span className="text-amber-700">ONUS</span>
        </span>
        {!compact && (
          <span className="block text-xs leading-tight text-slate-500">{t("brand.tagline")}</span>
        )}
      </span>
    </div>
  );
}
