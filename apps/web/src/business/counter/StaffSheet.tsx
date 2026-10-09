/**
 * The one accessible modal bottom sheet of the Staff shell (`EA-BL-001-CORR-002-B`).
 *
 * Mount it only while it should be open. On mount it remembers what had focus and moves focus to its
 * Close button; Tab wraps inside it; Escape, Close and the backdrop dismiss it; on unmount focus returns
 * to what had it (the control that opened it). It is a presentation primitive only — it carries no
 * authority and no data.
 */

import { useEffect, useRef, type KeyboardEvent as ReactKeyboardEvent, type ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "../../lib/utils";

const FOCUSABLE = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';
const FOCUS_RING = "focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:outline-none";

export function StaffSheet({
  title,
  titleId,
  closeLabel,
  onClose,
  testId,
  children,
}: {
  title: string;
  titleId: string;
  closeLabel: string;
  onClose: () => void;
  testId?: string;
  children: ReactNode;
}) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    closeRef.current?.focus();
    return () => {
      if (opener?.isConnected) opener.focus();
    };
  }, []);

  function onKeyDown(event: ReactKeyboardEvent<HTMLDivElement>) {
    if (event.key === "Escape") {
      event.stopPropagation();
      onClose();
      return;
    }
    if (event.key !== "Tab") return;
    const focusable = Array.from(sheetRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? []);
    if (focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col justify-end bg-slate-950/60"
      onClick={onClose}
      data-testid={testId}
    >
      <div
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onKeyDown={onKeyDown}
        onClick={(event) => event.stopPropagation()}
        className="mx-auto max-h-[88vh] w-full max-w-lg space-y-4 overflow-y-auto rounded-t-3xl border-t border-slate-200 bg-white px-4 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-2xl"
      >
        <div className="flex items-center justify-between gap-3">
          <h2 id={titleId} className="text-base font-bold text-slate-900">
            {title}
          </h2>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label={closeLabel}
            className={cn(
              "flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-slate-700",
              FOCUS_RING,
            )}
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
