import { Clock, Gift, Sparkles } from "lucide-react";
import { useTranslation } from "../../i18n";
import type { CustomerCircleWire } from "../api/customerExperienceClient";

export function CustomerLoyaltyCircle({ circle }: { circle: CustomerCircleWire }) {
  const { t } = useTranslation("customer");
  const center = 110;
  const radius = 78;
  const pendingSlots = Math.min(circle.pendingUnits, Math.max(0, 10 - circle.verifiedUnits));
  const label = t("experience.circleAccessible", {
    verified: circle.verifiedUnits,
    pending: circle.pendingUnits,
  });

  return (
    <div className="flex flex-col items-center select-none">
      <div className="relative flex h-52 w-52 items-center justify-center sm:h-56 sm:w-56">
        <svg viewBox="0 0 220 220" role="img" aria-label={label} className="h-full w-full">
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="#e2e8f0"
            strokeWidth="4"
            strokeDasharray="2 4"
          />
          {circle.verifiedUnits > 0 ? (
            <circle
              cx={center}
              cy={center}
              r={radius}
              fill="none"
              stroke="#d97706"
              strokeWidth="5"
              strokeDasharray={`${(circle.verifiedUnits / 10) * 490} 490`}
              strokeLinecap="round"
              transform={`rotate(-90 ${center} ${center})`}
            />
          ) : null}
          {pendingSlots > 0 ? (
            <circle
              cx={center}
              cy={center}
              r={radius}
              fill="none"
              stroke="#f59e0b"
              strokeWidth="5"
              strokeDasharray={`${(pendingSlots / 10) * 490} 490`}
              strokeDashoffset={`${-(circle.verifiedUnits / 10) * 490}`}
              strokeLinecap="round"
              strokeOpacity="0.65"
              transform={`rotate(-90 ${center} ${center})`}
            />
          ) : null}
          {Array.from({ length: 10 }, (_, index) => {
            const angle = (index / 10) * 2 * Math.PI - Math.PI / 2;
            const x = center + radius * Math.cos(angle);
            const y = center + radius * Math.sin(angle);
            const isVerified = index < circle.verifiedUnits;
            const isPending = !isVerified && index < circle.verifiedUnits + pendingSlots;
            return (
              <g key={index}>
                <circle
                  cx={x}
                  cy={y}
                  r="10"
                  fill={isVerified ? "#d97706" : isPending ? "#fef3c7" : "#ffffff"}
                  stroke={isVerified ? "#b45309" : isPending ? "#f59e0b" : "#cbd5e1"}
                  strokeWidth={isVerified ? 2 : 1.5}
                  strokeDasharray={isPending ? "2 2" : undefined}
                />
                <text
                  x={x}
                  y={y + 3.5}
                  textAnchor="middle"
                  fill={isVerified ? "#ffffff" : isPending ? "#92400e" : "#64748b"}
                  fontSize="9"
                  fontWeight="700"
                >
                  {isVerified ? "✓" : isPending ? "·" : index + 1}
                </text>
              </g>
            );
          })}
        </svg>
        <div
          className={`absolute flex h-24 w-24 flex-col items-center justify-center rounded-full border p-2 text-center shadow-sm ${
            circle.rewardAvailable
              ? "border-amber-400 bg-gradient-to-b from-amber-500 to-amber-600 text-white ring-4 ring-amber-300/40"
              : "border-slate-200 bg-white text-slate-800"
          }`}
        >
          {circle.rewardAvailable ? (
            <>
              <Sparkles aria-hidden="true" className="h-5 w-5 text-amber-100" />
              <span className="text-[9px] font-extrabold uppercase tracking-wider text-amber-100">
                {t("experience.eleventhOnUs")}
              </span>
              <span className="text-xs font-bold">{t("experience.unlocked")}</span>
            </>
          ) : (
            <>
              <span className="text-[9px] font-semibold uppercase tracking-wider text-slate-400">
                {circle.cycleNumber
                  ? t("experience.cycleNumber", { count: circle.cycleNumber })
                  : t("experience.circleStarting")}
              </span>
              <span className="my-0.5 flex items-baseline gap-0.5">
                <span className="text-lg font-extrabold leading-none text-slate-900">
                  {circle.verifiedUnits}
                </span>
                <span className="text-xs text-slate-400">/10</span>
              </span>
              <span className="text-[9px] font-bold uppercase tracking-tight text-amber-700">
                {t("experience.eleventhOnUs")}
              </span>
            </>
          )}
        </div>
      </div>
      <div className="mt-3 max-w-[280px] text-center">
        {circle.rewardAvailable ? (
          <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-300 bg-amber-50 px-3 py-1 text-xs font-bold text-amber-900">
            <Gift aria-hidden="true" className="h-3.5 w-3.5 shrink-0 text-amber-600" />
            <span>
              {t("experience.circleComplete", {
                item: circle.qualifyingItemName ?? t("experience.qualifyingItem"),
              })}
            </span>
          </div>
        ) : circle.pendingUnits > 0 ? (
          <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50/70 px-2.5 py-1 text-xs text-amber-900">
            <Clock aria-hidden="true" className="h-3.5 w-3.5 shrink-0 text-amber-600" />
            <span>
              <strong>{t("experience.verifiedCount", { count: circle.verifiedUnits })}</strong>
              {" · "}
              <strong>{t("experience.pendingCount", { count: circle.pendingUnits })}</strong>
            </span>
          </div>
        ) : (
          <p className="text-xs font-medium text-slate-600">
            <strong className="font-bold text-slate-900">
              {t("experience.verifiedOfTen", { count: circle.verifiedUnits })}
            </strong>
            {" · "}
            {t("experience.unitsToGo", { count: 10 - circle.verifiedUnits })}
          </p>
        )}
      </div>
    </div>
  );
}
