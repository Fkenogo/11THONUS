// Founder Preview — Staff Counter live checks (EA-BL-001-CORR-002-B).
//
// Proves, against the RUNNING seeded preview and through the same real callables the web app calls,
// the Counter facts a browser walkthrough cannot show by itself:
//
//   1. a Staff member's programme read carries NO Business Review threshold (the Owner's does);
//   2. Staff cannot read the Business Review queue, decide a review, or verify for a customer;
//   3. the Staff-own recent read returns only that member's own submissions (never a colleague's)
//      and no reviewer / reason / threshold / customer-identity fields;
//   4. (only with `--write`) one intentional submission recovers on a same-key retry — the lost-response
//      case — leaving exactly ONE Purchase, and a 5-unit Express purchase is routed to Business Review.
//
// Read-only unless `--write` is passed. `--write` adds two Purchases for one customer, after which
// `pnpm preview:verify` will (correctly) report a difference — run `pnpm preview:reset` to return to
// the pristine deterministic state. Nothing here bypasses authorisation: every call is made as a real
// preview identity with its real ID token.
import { SeedSession } from "./seed/session.mjs";

const PROGRAMME = "Express Styling Circle";

function outcome(label, ok, detail = "") {
  return { label, ok, detail };
}

async function denied(promise) {
  try {
    await promise;
    return { denied: false };
  } catch (error) {
    const status = error?.status ?? error?.response?.status;
    const code = error?.body?.error?.status ?? "";
    return { denied: true, status, code };
  }
}

export async function runCounterChecks({ state, write = false, log = console.log }) {
  const s = new SeedSession();
  const results = [];
  const bella = state.businesses.bella;
  const customerLn = state.identities.customer_moses?.loyaltyNumber;
  const qualifying = state.qualifyingItems?.["Bella Salon"] ?? {};

  // 1. Threshold visibility.
  const staffPrograms = await s.read("staff_bella", "listRewardPrograms", {
    businessId: bella.businessId,
  });
  const ownerPrograms = await s.read("owner_bella", "listRewardPrograms", {
    businessId: bella.businessId,
  });
  const staffHasKey = JSON.stringify(staffPrograms).includes("businessReviewQuantityThreshold");
  const ownerHasKey = JSON.stringify(ownerPrograms).includes("businessReviewQuantityThreshold");
  results.push(
    outcome(
      "Staff programme read has no review threshold key",
      !staffHasKey,
      "Diane (Staff) — key absent = unknown / not Staff data",
    ),
    outcome(
      "Owner programme read does carry it (so the redaction is real)",
      ownerHasKey,
      "Grace (Owner)",
    ),
  );

  // 2. Staff incapability.
  const queue = await denied(
    s.read("staff_bella", "listBusinessReviewQueue", { businessId: bella.businessId }),
  );
  results.push(outcome("Staff cannot read the Business Review queue", queue.denied, queue.code));
  const decide = await denied(
    s.as("staff_bella", "approveBusinessReview", {
      businessId: bella.businessId,
      purchaseRecordId: "00000000-0000-4000-8000-000000000000",
    }),
  );
  results.push(outcome("Staff cannot approve a Business Review", decide.denied, decide.code));
  const reject = await denied(
    s.as("staff_bella", "rejectBusinessReview", {
      businessId: bella.businessId,
      purchaseRecordId: "00000000-0000-4000-8000-000000000000",
      reason: "quantity_not_confirmed",
    }),
  );
  results.push(outcome("Staff cannot reject a Business Review", reject.denied, reject.code));
  const ownerQueue = await denied(
    s.read("owner_bella", "listBusinessReviewQueue", { businessId: bella.businessId }),
  );
  results.push(
    outcome("Owner can read the queue (the denial above is role-specific)", !ownerQueue.denied),
  );

  // 3. Own-only recent activity.
  const dianeRecent = (
    await s.read("staff_bella", "listMyRecentCounterPurchases", {
      businessId: bella.businessId,
      limit: 20,
    })
  ).purchases;
  const patrickRecent = (
    await s.read("manager_bella", "listMyRecentCounterPurchases", {
      businessId: bella.businessId,
      limit: 20,
    })
  ).purchases;
  const ownerList = (
    await s.read("owner_bella", "listPurchasesForBusiness", {
      businessId: bella.businessId,
      limit: 100,
    })
  ).purchases;
  const dianeIds = new Set(dianeRecent.map((p) => p.id));
  const patrickIds = new Set(patrickRecent.map((p) => p.id));
  const overlap = [...dianeIds].filter((id) => patrickIds.has(id));
  const mineByDiane = ownerList.filter((p) => p.recordedByRole === "staff").length;
  results.push(
    outcome(
      "Diane's recent feed and Patrick's recent feed are disjoint",
      overlap.length === 0 && dianeIds.size > 0 && patrickIds.size > 0,
      `Diane ${dianeIds.size} · Patrick ${patrickIds.size} (Business holds ${ownerList.length}+ purchases; ${mineByDiane} by Staff)`,
    ),
  );
  const wire = JSON.stringify(dianeRecent);
  const leaks = ["reviewer", "Threshold", "customerIdentityId", "recordedBy", "reason"].filter(
    (k) => wire.includes(k),
  );
  results.push(
    outcome(
      "Recent feed carries no reviewer/threshold/identity/recorder fields",
      leaks.length === 0,
      leaks.join(", "),
    ),
  );

  // 4. Idempotent recovery + BR routing (writes).
  if (write) {
    const program = staffPrograms.find((p) => p.program.displayName === PROGRAMME);
    if (!program || !customerLn || !qualifying["Blow-dry"]) {
      results.push(
        outcome("Write checks need the seeded Express programme and Moses's number", false),
      );
    } else {
      const key = `preview:counter-check:${Date.now()}`;
      const payload = {
        businessId: bella.businessId,
        rewardProgramId: program.program.id,
        qualifyingItemId: qualifying["Blow-dry"],
        quantity: 5, // at the Express threshold -> Business Review
        loyaltyNumberValue: customerLn,
        purchaseDate: new Date(Date.now() - 1000).toISOString(),
        idempotencyKey: key,
      };
      const first = await s.as("staff_bella", "recordPurchase", payload, { idempotent: false });
      const retry = await s.as("staff_bella", "recordPurchase", payload, { idempotent: false });
      results.push(
        outcome(
          "Same payload + purchaseDate + key, retried: the original Purchase is recovered (one row)",
          first.purchase.id === retry.purchase.id,
          `purchase ${first.purchase.id.slice(0, 8)}…`,
        ),
        outcome(
          "A 5-unit Express purchase is routed to Business Review, truthfully",
          first.review?.required === true && first.review.status === "business_review_required",
          `status ${first.review?.status}`,
        ),
      );
      const changedDate = await denied(
        s.as(
          "staff_bella",
          "recordPurchase",
          { ...payload, purchaseDate: new Date().toISOString() },
          { idempotent: false },
        ),
      );
      results.push(
        outcome(
          "A recomputed purchaseDate under the same key is refused (why the Counter captures it once)",
          changedDate.denied,
          changedDate.code,
        ),
      );
    }
  }

  log("");
  for (const r of results) {
    log(`  ${r.ok ? "PASS" : "FAIL"}  ${r.label}${r.detail ? `  — ${r.detail}` : ""}`);
  }
  log("");
  const failed = results.filter((r) => !r.ok);
  if (!write)
    log("  (read-only; pass --write to also demonstrate idempotent recovery and BR routing)");
  else
    log(
      "  Wrote 1 Purchase for Moses (BR-required). Run `pnpm preview:reset` to restore the pristine state.",
    );
  if (failed.length > 0) throw new Error(`${failed.length} Staff Counter check(s) failed.`);
}
