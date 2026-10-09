/**
 * The Staff Counter (`EA-BL-001-CORR-002-B`) — the phone-first frontline "record a purchase" surface.
 *
 * EXPERIENCE comes from the frozen prototype (`StaffCounterExperience.tsx` @ `18e8d700…`): a
 * "Frontline Counter" with numbered Identify → Programme → Record steps, a prominent "Scan customer
 * QR", a stepper, a primary Record action and a fast "next customer" reset. (The recent-activity log is
 * its own Activity view and "new customer" a quick action since Founder Preview Pass 3.)
 * TRUTH comes from production: real authenticated context, real programmes/items, the one existing
 * `recordPurchase` authority, and server routing. Replaced on purpose: the scenario strip and mock
 * participants, name/phone search and the all-customer list, walk-in creation, the Loyalty Circle,
 * the approval-threshold note, Staff reward confirmation and the fake station label.
 *
 * Staff identify a customer ONLY by a scanned QR or a typed Loyalty Number (D1/D2); the server
 * resolves it. Staff never see a customer name, threshold, reviewer or review reason (N4), and never
 * verify, review or redeem here (D5). Once the customer and the Programme are known they DO see a
 * limited loyalty status for that one transaction (Founder Preview Pass 3 supersedes D4; PRD01 §8.2). Access is the existing `purchase.record` authority,
 * enforced server-side on every call; nothing on this page is a security boundary.
 *
 * One intentional submission = one transaction intent (payload + `purchaseDate` + idempotency key,
 * see `counterIntent.ts`): an uncertain/network failure retries the SAME intent; only an intentional
 * edit or "Serve next customer" starts a new one.
 */

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { Camera, CheckCircle2, Minus, Plus, QrCode, ShieldCheck, X } from "lucide-react";
import { useTranslation } from "../../i18n";
import { cn } from "../../lib/utils";
import type { BusinessContext } from "../api/businessContext";
import { parsePurchaseRecordQuantity } from "../dashboard/purchaseQuantityInput";
import { createCounterIntentHolder } from "./counterIntent";
import {
  classifyCounterError,
  isUncertainCounterError,
  type CounterErrorKind,
} from "./counterErrors";
import {
  useCounterLoyaltyQuery,
  useCounterProgrammesQuery,
  useRecordCounterPurchaseMutation,
  type CounterLoyaltyArtifact,
  type CounterRecordOutcome,
} from "./counterHooks";
import { CounterLoyaltyCard, type CounterLoyaltyCardState } from "./CounterLoyaltyCard";
import { isLoyaltyNumberComplete } from "./counterLoyalty";
import { useStaffActionRequest } from "./staffActions";
import { createCameraQrScanner, type QrScanner, type QrScanSession } from "./qrScanner";

type ScannerPhase = "closed" | "opening" | "active" | "denied" | "no_camera" | "failed";

const FOCUS_RING =
  "focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 focus-visible:outline-none";
const CARD = "rounded-2xl border border-slate-200 bg-white p-4 shadow-sm";
const STEP_LABEL = "text-xs font-bold tracking-wider text-slate-500 uppercase";
const SECONDARY_BUTTON = cn(
  "inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-800 hover:bg-slate-50",
  FOCUS_RING,
);

const ERROR_COPY_KEY: Record<CounterErrorKind, string> = {
  customer_artifact: "counter.errors.customerArtifact",
  programme: "counter.errors.programme",
  item: "counter.errors.item",
  quantity: "counter.errors.quantity",
  generic: "counter.errors.generic",
  uncertain: "counter.errors.uncertain",
  session: "counter.errors.session",
  forbidden: "counter.errors.forbidden",
};

const SCANNER_FAILURE_COPY_KEY: Record<
  Exclude<ScannerPhase, "closed" | "opening" | "active">,
  string
> = {
  denied: "counter.scanner.denied",
  no_camera: "counter.scanner.noCamera",
  failed: "counter.scanner.failed",
};

/** Joins the ids of the descriptions that currently apply (a class-name merger would mangle ids). */
function describedBy(...ids: (string | false | undefined)[]): string | undefined {
  const present = ids.filter((id): id is string => Boolean(id));
  return present.length > 0 ? present.join(" ") : undefined;
}

function ChoiceGroup({
  name,
  legend,
  options,
  value,
  onChange,
  errorId,
  invalid,
}: {
  name: string;
  legend: string;
  options: readonly { id: string; label: string }[];
  value: string | null;
  onChange: (id: string) => void;
  errorId?: string;
  invalid?: boolean;
}) {
  return (
    <fieldset aria-describedby={invalid ? errorId : undefined} className="space-y-2">
      <legend className={cn(STEP_LABEL, "mb-2")}>{legend}</legend>
      {options.map((option) => (
        <label
          key={option.id}
          className={cn(
            "flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border p-3 text-sm font-semibold",
            value === option.id
              ? "border-amber-500 bg-amber-50 text-amber-950"
              : "border-slate-200 bg-white text-slate-800 hover:bg-slate-50",
          )}
        >
          <input
            type="radio"
            name={name}
            value={option.id}
            checked={value === option.id}
            onChange={() => onChange(option.id)}
            aria-invalid={invalid ? true : undefined}
            className="h-5 w-5 shrink-0 accent-amber-600"
          />
          <span className="min-w-0 break-words">{option.label}</span>
        </label>
      ))}
    </fieldset>
  );
}

export function CounterPage({
  context,
  scanner: injectedScanner,
  active = true,
}: {
  context: BusinessContext;
  /**
   * Whether the Counter is the visible place. The shell keeps the Counter mounted (so a transaction in
   * progress survives a visit to Activity/Profile) but hidden; while hidden the camera is closed and
   * no loyalty read is made.
   */
  active?: boolean;
  /** Test seam: the real camera scanner is used unless one is injected. */
  scanner?: QrScanner;
}) {
  const { t } = useTranslation("business");
  const businessId = context.businessId;
  const scanner = useMemo(() => injectedScanner ?? createCameraQrScanner(), [injectedScanner]);
  const cameraSupported = useMemo(() => scanner.isSupported(), [scanner]);

  const programmesQuery = useCounterProgrammesQuery(businessId);
  const recordMutation = useRecordCounterPurchaseMutation(businessId);
  const programmes = useMemo(() => programmesQuery.data ?? [], [programmesQuery.data]);

  // --- transaction inputs -------------------------------------------------------------------
  const [loyaltyNumber, setLoyaltyNumber] = useState("");
  const [qrReference, setQrReference] = useState<string | null>(null);
  const [programmeChoice, setProgrammeChoice] = useState<string | null>(null);
  const [itemChoice, setItemChoice] = useState<string | null>(null);
  const [quantityText, setQuantityText] = useState("1");

  // --- UI state ------------------------------------------------------------------------------
  const [scannerPhase, setScannerPhase] = useState<ScannerPhase>("closed");
  const [foreignCode, setForeignCode] = useState(false);
  const [outcome, setOutcome] = useState<CounterRecordOutcome | null>(null);
  const [recovered, setRecovered] = useState(false);
  const [errorKind, setErrorKind] = useState<CounterErrorKind | null>(null);
  const [invalid, setInvalid] = useState<{
    artifact?: boolean;
    programme?: boolean;
    item?: boolean;
    quantity?: boolean;
  }>({});

  // A "focus the first useful control" request (bump the tick), honoured after the next commit.
  const [focusTick, setFocusTick] = useState(0);
  const [intentHolder] = useState(() => createCounterIntentHolder());
  const submittingRef = useRef(false);
  const uncertainRef = useRef(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const scanButtonRef = useRef<HTMLButtonElement>(null);
  const cancelScanRef = useRef<HTMLButtonElement>(null);
  const loyaltyInputRef = useRef<HTMLInputElement>(null);
  const quantityInputRef = useRef<HTMLInputElement>(null);
  const outcomeHeadingRef = useRef<HTMLHeadingElement>(null);
  const itemGroupRef = useRef<HTMLDivElement>(null);
  const programmeGroupRef = useRef<HTMLDivElement>(null);

  const errorId = useId();
  const hintId = useId();
  const scannerStatusId = useId();

  // --- derived selections (auto-select the only choice; never invent one) ----------------------
  const programme =
    programmes.find((entry) => entry.id === programmeChoice) ??
    (programmes.length === 1 ? programmes[0] : null);
  const items = programme?.items ?? [];
  const itemId =
    items.find((entry) => entry.id === itemChoice)?.id ?? (items.length === 1 ? items[0].id : null);
  const multipleUnits = programme?.multipleUnitsAllowed ?? false;
  const parsedQuantity = multipleUnits ? parsePurchaseRecordQuantity(quantityText) : 1;

  // --- limited loyalty status for THIS transaction (customer + programme known; before recording) ---
  const loyaltyArtifact: CounterLoyaltyArtifact | null =
    !active || outcome
      ? null
      : qrReference !== null
        ? { kind: "qr_identity", value: qrReference }
        : isLoyaltyNumberComplete(loyaltyNumber)
          ? { kind: "loyalty_number", value: loyaltyNumber.trim() }
          : null;
  const loyaltyQuery = useCounterLoyaltyQuery(businessId, programme?.id ?? null, loyaltyArtifact);
  const loyaltyState: CounterLoyaltyCardState | null =
    loyaltyArtifact === null || programme === null
      ? null
      : loyaltyQuery.isError
        ? { status: "error" }
        : loyaltyQuery.data
          ? { status: "ready", context: loyaltyQuery.data }
          : { status: "pending" };

  // --- a transaction-defining edit is an intentional change: a fresh intent ---------------------
  const resetIntent = useCallback(() => {
    intentHolder.discard();
    uncertainRef.current = false;
    setErrorKind(null);
    setRecovered(false);
    setInvalid({});
  }, [intentHolder]);

  // --- camera lifecycle -----------------------------------------------------------------------
  const scannerOpen = scannerPhase === "opening" || scannerPhase === "active";
  const sessionRef = useRef<QrScanSession | null>(null);

  useEffect(() => {
    if (!scannerOpen) return;
    const video = videoRef.current;
    if (!video) return;
    const session = scanner.start(video, {
      onReady: () => setScannerPhase("active"),
      onForeignCode: () => setForeignCode(true),
      onResult: (reference) => {
        sessionRef.current = null;
        intentHolder.discard();
        uncertainRef.current = false;
        setErrorKind(null);
        setRecovered(false);
        setInvalid({});
        setQrReference(reference);
        setLoyaltyNumber("");
        setForeignCode(false);
        setScannerPhase("closed");
      },
      onFailure: (failure) => {
        sessionRef.current = null;
        setScannerPhase(
          failure === "permission_denied"
            ? "denied"
            : failure === "no_camera"
              ? "no_camera"
              : "failed",
        );
      },
    });
    sessionRef.current = session;
    // Closing for ANY reason (cancel, success, submit, unmount, navigation) stops every camera track.
    return () => {
      session.stop();
      sessionRef.current = null;
    };
  }, [scannerOpen, scanner, intentHolder]);

  // Focus: into the scanner when it opens; back to the scan control when it closes.
  const previousOpen = useRef(false);
  useEffect(() => {
    if (scannerOpen && !previousOpen.current) {
      cancelScanRef.current?.focus();
    }
    if (!scannerOpen && previousOpen.current) {
      (qrReference
        ? scanButtonRef.current
        : (scanButtonRef.current ?? loyaltyInputRef.current)
      )?.focus();
    }
    previousOpen.current = scannerOpen;
  }, [scannerOpen, qrReference]);

  // Focus the outcome so the result is announced and the "next customer" action is one tab away.
  useEffect(() => {
    if (outcome) outcomeHeadingRef.current?.focus();
  }, [outcome]);

  useEffect(() => {
    if (focusTick === 0) return;
    const scan = scanButtonRef.current;
    (scan && !scan.disabled ? scan : loyaltyInputRef.current)?.focus();
  }, [focusTick]);

  // Leaving the Counter (for Activity/Profile) closes the camera: it is never left running unseen.
  const [wasActive, setWasActive] = useState(active);
  if (wasActive !== active) {
    setWasActive(active);
    if (!active) setScannerPhase("closed");
  }

  // Quick action "Scan customer QR": start the existing scanner here (or land on the Loyalty Number).
  // The request is HELD until the Counter is the visible place AND its programmes have settled: a Staff
  // member can tap it moments after launch, before the form exists, and it must not be silently lost.
  // If the programmes settle with no form to scan into (none configured, or a load error) there is
  // nothing to open and the request ends there.
  const formShown = !outcome && Boolean(programmesQuery.data) && programmes.length > 0;
  useStaffActionRequest(
    "scan",
    () => {
      if (outcome) serveNext(); // a finished transaction: this is the next customer
      if (!formShown && !outcome) return;
      if (cameraSupported) openScanner();
      else setFocusTick((tick) => tick + 1);
    },
    active && !programmesQuery.isPending,
  );

  function openScanner() {
    setForeignCode(false);
    setScannerPhase("opening");
  }

  function cancelScanner() {
    setForeignCode(false);
    setScannerPhase("closed");
  }

  // --- handlers ---------------------------------------------------------------------------------
  function onLoyaltyNumberChange(value: string) {
    resetIntent();
    setQrReference(null);
    setLoyaltyNumber(value.toUpperCase());
  }

  function clearScan() {
    resetIntent();
    setQrReference(null);
    setFocusTick((tick) => tick + 1);
  }

  function selectProgramme(id: string) {
    resetIntent();
    setProgrammeChoice(id);
    setItemChoice(null);
  }

  function selectItem(id: string) {
    resetIntent();
    setItemChoice(id);
  }

  function setQuantity(next: string) {
    resetIntent();
    setQuantityText(next);
  }

  function step(delta: number) {
    const current = parsePurchaseRecordQuantity(quantityText) ?? 1;
    setQuantity(String(Math.max(1, current + delta)));
  }

  function serveNext() {
    intentHolder.discard();
    uncertainRef.current = false;
    submittingRef.current = false;
    recordMutation.reset();
    setScannerPhase("closed");
    setForeignCode(false);
    setLoyaltyNumber("");
    setQrReference(null);
    setProgrammeChoice(null);
    setItemChoice(null);
    setQuantityText("1");
    setOutcome(null);
    setRecovered(false);
    setErrorKind(null);
    setInvalid({});
    // First useful control for the next customer.
    setFocusTick((tick) => tick + 1);
  }

  const hasArtifact = qrReference !== null || loyaltyNumber.trim().length > 0;

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    // Double-tap / double-Enter guard: one in-flight submission at a time.
    if (submittingRef.current || recordMutation.isPending) return;

    const nextInvalid = {
      artifact: !hasArtifact,
      programme: programme === null,
      // An item can only be missing once there is a programme whose items are on screen.
      item: programme !== null && itemId === null,
      quantity: parsedQuantity === null,
    };
    if (nextInvalid.artifact || nextInvalid.programme || nextInvalid.item || nextInvalid.quantity) {
      setInvalid(nextInvalid);
      if (nextInvalid.artifact) (scanButtonRef.current ?? loyaltyInputRef.current)?.focus();
      else if (nextInvalid.programme)
        programmeGroupRef.current?.querySelector<HTMLElement>("input")?.focus();
      else if (nextInvalid.item)
        itemGroupRef.current?.querySelector<HTMLElement>("input,select")?.focus();
      else quantityInputRef.current?.focus();
      return;
    }
    if (!programme || itemId === null || parsedQuantity === null) return;

    setInvalid({});
    setErrorKind(null);
    setScannerPhase("closed"); // never keep the camera open while recording

    // Prepared ONCE per intentional submission: an unchanged retry gets the same date, payload, key.
    const intent = intentHolder.prepare({
      rewardProgramId: programme.id,
      qualifyingItemId: itemId,
      quantity: parsedQuantity,
      artifact:
        qrReference !== null
          ? { kind: "qr_identity", value: qrReference }
          : { kind: "loyalty_number", value: loyaltyNumber },
    });
    const wasRetry = uncertainRef.current;

    submittingRef.current = true;
    try {
      const result = await recordMutation.mutateAsync(intent);
      intentHolder.discard();
      uncertainRef.current = false;
      setRecovered(wasRetry);
      setOutcome(result);
    } catch (error) {
      const kind = classifyCounterError(error);
      if (isUncertainCounterError(kind)) {
        // It may have committed: keep the SAME intent so the retry replays it (never a new key).
        uncertainRef.current = true;
      } else {
        intentHolder.discard();
        uncertainRef.current = false;
      }
      setErrorKind(kind);
    } finally {
      submittingRef.current = false;
    }
  }

  // --- render -----------------------------------------------------------------------------------
  const failurePhase =
    scannerPhase === "denied" || scannerPhase === "no_camera" || scannerPhase === "failed"
      ? scannerPhase
      : null;

  return (
    <div className="mx-auto w-full max-w-lg space-y-4 pb-4">
      <header className="flex items-end justify-between gap-3">
        <div className="min-w-0">
          <h1
            tabIndex={-1}
            data-staff-view-heading
            className="font-display text-xl leading-tight font-bold text-slate-900 focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:outline-none"
          >
            {t("counter.title")}
          </h1>
          <p className="truncate text-sm text-slate-500">
            {context.displayName} · {t("counter.subtitle")}
          </p>
        </div>
        <ShieldCheck className="h-6 w-6 shrink-0 text-amber-600" aria-hidden="true" />
      </header>

      {programmesQuery.isPending ? (
        <p role="status" className={cn(CARD, "text-sm text-slate-600")}>
          {t("counter.loading")}
        </p>
      ) : null}

      {programmesQuery.isError ? (
        <div role="alert" className={cn(CARD, "space-y-3 text-sm text-slate-700")}>
          <p>{t("counter.loadError")}</p>
          <button
            type="button"
            className={SECONDARY_BUTTON}
            onClick={() => void programmesQuery.refetch()}
          >
            {t("counter.retryLoad")}
          </button>
        </div>
      ) : null}

      {programmesQuery.data && programmes.length === 0 ? (
        <p role="status" className={cn(CARD, "text-sm text-slate-700")}>
          {t("counter.noProgramme")}
        </p>
      ) : null}

      {outcome ? (
        <section
          role="status"
          aria-live="polite"
          className={cn(
            "space-y-4 rounded-2xl p-5 text-center text-white shadow-lg",
            outcome.routing === "business_review_required"
              ? "bg-gradient-to-br from-amber-700 to-amber-800 shadow-amber-700/20"
              : "bg-gradient-to-br from-emerald-700 to-emerald-800 shadow-emerald-700/20",
          )}
        >
          <CheckCircle2 className="mx-auto h-10 w-10" aria-hidden="true" />
          <div className="space-y-1">
            <h2
              ref={outcomeHeadingRef}
              tabIndex={-1}
              className="text-lg font-bold focus:outline-none"
            >
              {outcome.routing === "business_review_required"
                ? t("counter.outcome.reviewTitle")
                : t("counter.outcome.normalTitle")}
            </h2>
            <p className="text-sm">
              {outcome.routing === "business_review_required"
                ? t("counter.outcome.reviewBody")
                : t("counter.outcome.normalBody")}
            </p>
            <p className="text-xs opacity-90">
              {t("counter.outcome.summary", {
                quantity: outcome.quantity,
                item: outcome.itemLabel,
              })}
            </p>
            {recovered ? (
              <p className="text-xs font-semibold">{t("counter.outcome.recovered")}</p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={serveNext}
            className={cn(
              "min-h-14 w-full rounded-xl bg-white px-4 text-base font-bold text-slate-900 shadow-sm active:scale-[0.98]",
              FOCUS_RING,
            )}
          >
            {t("counter.outcome.serveNext")}
          </button>
        </section>
      ) : null}

      {!outcome && programmesQuery.data && programmes.length > 0 ? (
        <form onSubmit={submit} noValidate className="grid grid-cols-1 gap-4">
          {/* 1. Identify customer ------------------------------------------------------------- */}
          <section aria-labelledby="counter-identify-heading" className={CARD}>
            <h2 id="counter-identify-heading" className={cn(STEP_LABEL, "mb-1")}>
              {t("counter.identify.heading")}
            </h2>
            <p id={hintId} className="mb-3 text-xs text-slate-500">
              {t("counter.identify.hint")}
            </p>

            {scannerOpen ? (
              <div role="group" aria-label={t("counter.scanner.title")} className="space-y-3">
                <div className="relative aspect-square overflow-hidden rounded-xl bg-slate-900">
                  <video
                    ref={videoRef}
                    muted
                    playsInline
                    aria-label={t("counter.scanner.cameraLabel")}
                    className="h-full w-full object-cover"
                  />
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 m-auto h-3/5 w-3/5 rounded-xl border-2 border-amber-400/90"
                  />
                </div>
                <p
                  id={scannerStatusId}
                  role="status"
                  aria-live="polite"
                  className="text-sm text-slate-700"
                >
                  {scannerPhase === "opening"
                    ? t("counter.scanner.opening")
                    : t("counter.scanner.active")}
                </p>
                {foreignCode ? (
                  <p role="alert" className="text-sm font-medium text-amber-900">
                    {t("counter.scanner.foreignCode")}
                  </p>
                ) : null}
                <button
                  ref={cancelScanRef}
                  type="button"
                  onClick={cancelScanner}
                  className={cn(SECONDARY_BUTTON, "w-full")}
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                  {t("counter.scanner.cancel")}
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {qrReference !== null ? (
                  <div
                    role="status"
                    className="flex items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3"
                    aria-describedby={errorKind === "customer_artifact" ? errorId : undefined}
                  >
                    <span className="flex items-center gap-2 text-sm font-semibold text-emerald-900">
                      <CheckCircle2 className="h-5 w-5 shrink-0" aria-hidden="true" />
                      {t("counter.identify.scannedTitle")}
                    </span>
                    <button
                      type="button"
                      onClick={clearScan}
                      className={cn(
                        "min-h-11 rounded-lg px-3 text-sm font-semibold text-emerald-900 underline",
                        FOCUS_RING,
                      )}
                    >
                      {t("counter.identify.clearScan")}
                    </button>
                  </div>
                ) : null}

                <button
                  ref={scanButtonRef}
                  type="button"
                  onClick={openScanner}
                  disabled={!cameraSupported}
                  aria-describedby={!cameraSupported ? scannerStatusId : undefined}
                  className={cn(
                    "flex min-h-14 w-full items-center justify-center gap-2 rounded-xl px-4 text-base font-bold shadow-sm",
                    cameraSupported
                      ? "bg-amber-700 text-white hover:bg-amber-800 active:scale-[0.98]"
                      : "bg-slate-200 text-slate-500",
                    FOCUS_RING,
                  )}
                >
                  <Camera className="h-5 w-5" aria-hidden="true" />
                  {qrReference !== null
                    ? t("counter.identify.scanAgain")
                    : t("counter.scanner.title")}
                </button>

                {!cameraSupported ? (
                  <p id={scannerStatusId} className="text-sm text-slate-700">
                    {t("counter.scanner.unsupported")}
                  </p>
                ) : null}

                {failurePhase ? (
                  <div
                    role="alert"
                    className="space-y-2 rounded-xl border border-amber-200 bg-amber-50 p-3"
                  >
                    <p className="text-sm text-amber-950">
                      {t(SCANNER_FAILURE_COPY_KEY[failurePhase])}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => loyaltyInputRef.current?.focus()}
                        className={cn(SECONDARY_BUTTON, "min-h-11 px-3")}
                      >
                        {t("counter.scanner.useLoyaltyNumber")}
                      </button>
                      <button
                        type="button"
                        onClick={openScanner}
                        className={cn(SECONDARY_BUTTON, "min-h-11 px-3")}
                      >
                        <QrCode className="h-4 w-4" aria-hidden="true" />
                        {t("counter.scanner.tryAgain")}
                      </button>
                    </div>
                  </div>
                ) : null}

                {qrReference === null ? (
                  <div>
                    <div
                      className="my-1 flex items-center gap-3 text-xs text-slate-600"
                      aria-hidden="true"
                    >
                      <span className="h-px flex-1 bg-slate-200" />
                      {t("counter.identify.orLabel")}
                      <span className="h-px flex-1 bg-slate-200" />
                    </div>
                    <label
                      htmlFor="counter-loyalty-number"
                      className="mb-1 block text-sm font-semibold text-slate-800"
                    >
                      {t("counter.identify.loyaltyNumberLabel")}
                    </label>
                    <input
                      ref={loyaltyInputRef}
                      id="counter-loyalty-number"
                      type="text"
                      inputMode="text"
                      autoCapitalize="characters"
                      autoCorrect="off"
                      autoComplete="off"
                      spellCheck={false}
                      enterKeyHint="next"
                      maxLength={16}
                      value={loyaltyNumber}
                      placeholder={t("counter.identify.loyaltyNumberPlaceholder")}
                      onChange={(event) => onLoyaltyNumberChange(event.target.value)}
                      aria-invalid={
                        invalid.artifact || errorKind === "customer_artifact" ? true : undefined
                      }
                      aria-describedby={describedBy(
                        `${hintId}-ln`,
                        invalid.artifact && `${errorId}-artifact`,
                        errorKind === "customer_artifact" && errorId,
                      )}
                      className={cn(
                        "min-h-14 w-full rounded-xl border bg-white px-4 font-mono text-lg tracking-widest text-slate-900 uppercase placeholder:normal-case placeholder:tracking-normal placeholder:text-slate-500",
                        invalid.artifact || errorKind === "customer_artifact"
                          ? "border-red-600"
                          : "border-slate-300",
                        FOCUS_RING,
                      )}
                    />
                    <p id={`${hintId}-ln`} className="mt-1 text-xs text-slate-500">
                      {t("counter.identify.loyaltyNumberHint")}
                    </p>
                  </div>
                ) : null}

                {invalid.artifact ? (
                  <p
                    id={`${errorId}-artifact`}
                    role="alert"
                    className="text-sm font-medium text-red-700"
                  >
                    {t("counter.identify.required")}
                  </p>
                ) : null}
              </div>
            )}
          </section>

          {/* Loyalty status: limited, transaction-scoped, shown BEFORE the purchase is recorded ---- */}
          {loyaltyState ? <CounterLoyaltyCard state={loyaltyState} /> : null}

          {/* 2–3. Programme, item, quantity, record ------------------------------------------ */}
          {/* `contents`: the sticky Record bar must be a direct flow child of the form, so it pins above the
              bottom bar however tall the cards above it are (inside a nested block it would be clamped
              to that block's top edge and cover the Programme card). */}
          <div className="contents">
            <section aria-labelledby="counter-programme-heading" className={cn(CARD, "space-y-4")}>
              <h2 id="counter-programme-heading" className={STEP_LABEL}>
                {t("counter.programme.heading")}
              </h2>

              {programmes.length === 1 ? (
                <p className="flex min-h-12 items-center gap-2 rounded-xl border border-amber-500 bg-amber-50 px-3 text-sm font-semibold text-amber-950">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-amber-700" aria-hidden="true" />
                  <span className="sr-only">{t("counter.programme.selectedLabel")}: </span>
                  {programmes[0].name}
                </p>
              ) : (
                <div ref={programmeGroupRef}>
                  <ChoiceGroup
                    name="counter-programme"
                    legend={t("counter.programme.selectedLabel")}
                    options={programmes.map((entry) => ({ id: entry.id, label: entry.name }))}
                    value={programme?.id ?? null}
                    onChange={selectProgramme}
                    errorId={`${errorId}-programme`}
                    invalid={invalid.programme}
                  />
                  {invalid.programme ? (
                    <p
                      id={`${errorId}-programme`}
                      role="alert"
                      className="mt-2 text-sm font-medium text-red-700"
                    >
                      {t("counter.programme.required")}
                    </p>
                  ) : null}
                </div>
              )}

              <div ref={itemGroupRef}>
                {items.length === 1 ? (
                  <p className="flex min-h-12 items-center gap-2 text-sm font-semibold text-slate-900">
                    <span className={STEP_LABEL}>{t("counter.item.label")}</span>
                    {items[0].name}
                  </p>
                ) : items.length > 6 ? (
                  <div>
                    <label htmlFor="counter-item" className={cn(STEP_LABEL, "mb-2 block")}>
                      {t("counter.item.label")}
                    </label>
                    <select
                      id="counter-item"
                      value={itemId ?? ""}
                      onChange={(event) => selectItem(event.target.value)}
                      aria-invalid={invalid.item ? true : undefined}
                      aria-describedby={invalid.item ? `${errorId}-item` : undefined}
                      className={cn(
                        "min-h-12 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm",
                        FOCUS_RING,
                      )}
                    >
                      <option value="">{t("counter.item.placeholder")}</option>
                      {items.map((entry) => (
                        <option key={entry.id} value={entry.id}>
                          {entry.name}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <ChoiceGroup
                    name="counter-item"
                    legend={t("counter.item.label")}
                    options={items.map((entry) => ({ id: entry.id, label: entry.name }))}
                    value={itemId}
                    onChange={selectItem}
                    errorId={`${errorId}-item`}
                    invalid={invalid.item}
                  />
                )}
                {invalid.item ? (
                  <p
                    id={`${errorId}-item`}
                    role="alert"
                    className="mt-2 text-sm font-medium text-red-700"
                  >
                    {t("counter.item.required")}
                  </p>
                ) : null}
              </div>

              <div>
                <label htmlFor="counter-quantity" className={cn(STEP_LABEL, "mb-2 block")}>
                  {t("counter.quantity.label")}
                </label>
                {multipleUnits ? (
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      aria-label={t("counter.quantity.decrease")}
                      onClick={() => step(-1)}
                      disabled={(parsedQuantity ?? 1) <= 1}
                      className={cn(
                        "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-slate-300 bg-white text-slate-800 disabled:opacity-40",
                        FOCUS_RING,
                      )}
                    >
                      <Minus className="h-5 w-5" aria-hidden="true" />
                    </button>
                    <input
                      ref={quantityInputRef}
                      id="counter-quantity"
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      autoComplete="off"
                      value={quantityText}
                      onChange={(event) => setQuantity(event.target.value)}
                      aria-invalid={invalid.quantity ? true : undefined}
                      aria-describedby={invalid.quantity ? `${errorId}-quantity` : undefined}
                      className={cn(
                        "min-h-12 w-20 rounded-xl border bg-white px-2 text-center text-xl font-extrabold text-slate-900",
                        invalid.quantity ? "border-red-600" : "border-slate-300",
                        FOCUS_RING,
                      )}
                    />
                    <button
                      type="button"
                      aria-label={t("counter.quantity.increase")}
                      onClick={() => step(1)}
                      className={cn(
                        "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-slate-300 bg-white text-slate-800",
                        FOCUS_RING,
                      )}
                    >
                      <Plus className="h-5 w-5" aria-hidden="true" />
                    </button>
                  </div>
                ) : (
                  <p id="counter-quantity" className="text-sm text-slate-700">
                    {t("counter.quantity.onePerPurchase")}
                  </p>
                )}
                {invalid.quantity ? (
                  <p
                    id={`${errorId}-quantity`}
                    role="alert"
                    className="mt-2 text-sm font-medium text-red-700"
                  >
                    {t("counter.quantity.error")}
                  </p>
                ) : null}
              </div>
            </section>

            {errorKind ? (
              <div
                id={errorId}
                role="alert"
                className="space-y-2 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-900"
              >
                <p className="font-medium">{t(ERROR_COPY_KEY[errorKind])}</p>
                {errorKind === "session" ? (
                  <a href="/" className={cn(SECONDARY_BUTTON, "min-h-11 px-3")}>
                    {t("counter.errors.signInAgain")}
                  </a>
                ) : null}
                {errorKind === "programme" ? (
                  <button
                    type="button"
                    className={cn(SECONDARY_BUTTON, "min-h-11 px-3")}
                    onClick={() => {
                      setErrorKind(null);
                      void programmesQuery.refetch();
                    }}
                  >
                    {t("counter.errors.refresh")}
                  </button>
                ) : null}
              </div>
            ) : null}

            <div className="sticky bottom-[var(--staff-nav-offset,0px)] z-10 -mx-4 border-t border-slate-200 bg-white/95 px-4 pt-3 pb-3 backdrop-blur">
              <button
                type="submit"
                disabled={recordMutation.isPending}
                aria-busy={recordMutation.isPending}
                className={cn(
                  "flex min-h-14 w-full items-center justify-center gap-2 rounded-xl bg-amber-700 px-4 text-base font-bold text-white shadow-sm hover:bg-amber-800 active:scale-[0.98] disabled:opacity-60",
                  FOCUS_RING,
                )}
              >
                {recordMutation.isPending
                  ? t("counter.record.recording")
                  : errorKind === "uncertain"
                    ? t("counter.record.retry")
                    : t("counter.record.submit")}
              </button>
              <p className="mt-2 text-center text-[11px] text-slate-500">
                {t("counter.record.helper")}
              </p>
            </div>
          </div>
        </form>
      ) : null}
    </div>
  );
}
