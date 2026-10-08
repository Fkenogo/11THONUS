// Founder Preview — Staff Counter live checks (EA-BL-001-CORR-002-B).
//
// Proves, against the RUNNING seeded preview and through the same real callables the web app calls,
// the Counter facts a browser walkthrough cannot show by itself:
//
//   1. a Staff member's programme read carries NO Business Review threshold (the Owner's does);
//   2. Staff cannot read the Business Review queue, decide a review, or verify for a customer;
//   3. the Staff-own recent read returns only that member's own submissions (never a colleague's)
//      and no reviewer / reason / threshold / customer-identity fields;
//   3b. (Founder Preview Pass 3) the limited, transaction-scoped loyalty context: four values only, verified
//      progress never includes a purchase awaiting the customer, a reward-available customer is flagged,
//      another Business is refused, every bad artifact fails with the SAME neutral token, and Staff-own
//      Activity pages by an opaque cursor without ever returning a colleague's row;
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
    const reason = error?.body?.error?.details?.reason ?? null;
    return { denied: true, status, code, reason };
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

  // 3b. Limited loyalty context (Founder Preview Pass 3).
  const express = staffPrograms.find((p) => p.program.displayName === PROGRAMME);
  const premium = staffPrograms.find((p) => p.program.displayName === "Premium Cut Circle");
  const lnOf = (customer) => state.identities[`customer_${customer}`]?.loyaltyNumber;
  const context = (user, programme, customer, businessId = bella.businessId) =>
    s.read(user, "getCounterLoyaltyContext", {
      businessId,
      rewardProgramId: programme.program.id,
      loyaltyNumberValue: lnOf(customer),
    });
  if (!express || !premium) {
    results.push(outcome("Loyalty checks need the seeded Express and Premium programmes", false));
  } else {
    const normal = await context("staff_bella", express, "jeanclaude");
    const near = await context("staff_bella", express, "esther");
    const reward = await context("staff_bella", express, "chantal");
    const keys = (o) => Object.keys(o).sort().join(",");
    const FOUR =
      "awaitingCustomerConfirmationUnits,requiredVerifiedUnits,rewardStatus,verifiedUnits";
    results.push(
      outcome(
        "Staff loyalty read returns exactly four values (no identity, name, history, review or threshold)",
        keys(normal) === FOUR && keys(near) === FOUR && keys(reward) === FOUR,
        keys(normal),
      ),
      outcome(
        "Verified progress is authoritative: Jean-Claude 8 of 10, no reward",
        normal.verifiedUnits === 8 &&
          normal.requiredVerifiedUnits === 10 &&
          normal.rewardStatus === "none" &&
          normal.awaitingCustomerConfirmationUnits === 0,
        JSON.stringify(normal),
      ),
      outcome(
        "A purchase awaiting the customer is reported separately and NOT added: Esther 9 verified + 1 awaiting",
        near.verifiedUnits === 9 && near.awaitingCustomerConfirmationUnits === 1,
        JSON.stringify(near),
      ),
      outcome(
        "A customer with a reward available is flagged (Chantal): 10 of 10, rewardStatus=available",
        reward.verifiedUnits === 10 && reward.rewardStatus === "available",
        JSON.stringify(reward),
      ),
    );
    const wire = JSON.stringify([normal, near, reward]);
    const identityLeak = [
      lnOf("jeanclaude"),
      state.identities.customer_jeanclaude?.customerIdentityId,
      "Jean-Claude",
      "Habimana",
      "hreshold",
      "eview",
    ].filter((v) => v && wire.includes(v));
    results.push(
      outcome(
        "The loyalty answer names no one and carries no identity/threshold/review text",
        identityLeak.length === 0,
        identityLeak.join(", "),
      ),
    );

    // Neutral failure: every bad artifact fails the SAME way; policy and existence are not revealed.
    const badLn = await denied(
      s.read("staff_bella", "getCounterLoyaltyContext", {
        businessId: bella.businessId,
        rewardProgramId: express.program.id,
        loyaltyNumberValue: "ZZZ222",
      }),
    );
    const malformed = await denied(
      s.read("staff_bella", "getCounterLoyaltyContext", {
        businessId: bella.businessId,
        rewardProgramId: express.program.id,
        loyaltyNumberValue: "not-a-number",
      }),
    );
    const qrOnly = await denied(context("staff_bella", premium, "amina")); // a real LN on a QR-only programme
    const same = (r) => r.denied && r.reason === "customer_artifact_invalid_or_not_found";
    results.push(
      outcome(
        "Unknown, malformed and QR-only-programme codes all fail with the SAME neutral token (no probing)",
        same(badLn) && same(malformed) && same(qrOnly),
        [badLn.reason, malformed.reason, qrOnly.reason].join(" | "),
      ),
    );

    // Authority and Business scope.
    const sparkle = state.businesses.sparkle;
    const crossBusiness = await denied(
      s.read("manager_bella", "getCounterLoyaltyContext", {
        businessId: sparkle.businessId,
        rewardProgramId: express.program.id,
        loyaltyNumberValue: lnOf("amina"),
      }),
    );
    const foreignProgramme = await denied(
      s.read("staff_bella", "getCounterLoyaltyContext", {
        businessId: bella.businessId,
        rewardProgramId: "00000000-0000-4000-8000-000000000001",
        loyaltyNumberValue: lnOf("amina"),
      }),
    );
    const asCustomer = await denied(
      s.read("customer_amina", "getCounterLoyaltyContext", {
        businessId: bella.businessId,
        rewardProgramId: express.program.id,
        loyaltyNumberValue: lnOf("amina"),
      }),
    );
    results.push(
      outcome(
        "A member of one Business cannot read another Business's loyalty context",
        crossBusiness.denied,
        crossBusiness.code,
      ),
      outcome(
        "An unknown / foreign programme is one neutral 'programme unavailable' refusal",
        foreignProgramme.denied && foreignProgramme.reason === "programme_unavailable",
        foreignProgramme.reason ?? "",
      ),
      outcome("A Customer cannot use the Staff loyalty read", asCustomer.denied, asCustomer.code),
    );

    // Activity paging: own rows only, by cursor, stable and disjoint.
    const page1 = await s.read("staff_bella", "listMyRecentCounterPurchases", {
      businessId: bella.businessId,
      limit: 5,
    });
    const page2 = page1.nextCursor
      ? await s.read("staff_bella", "listMyRecentCounterPurchases", {
          businessId: bella.businessId,
          limit: 5,
          cursor: page1.nextCursor,
        })
      : { purchases: [] };
    const page1Ids = page1.purchases.map((p) => p.id);
    const page2Ids = page2.purchases.map((p) => p.id);
    results.push(
      outcome(
        "Activity pages by an opaque cursor: the next page is disjoint, older, and contains no colleague's row",
        page1.purchases.length === 5 &&
          page2Ids.length > 0 &&
          page1Ids.every((id) => !page2Ids.includes(id)) &&
          [...page1Ids, ...page2Ids].every((id) => !patrickIds.has(id)) &&
          page1.purchases[4].recordedAt >= page2.purchases[0].recordedAt,
        `page 1: ${page1Ids.length} · page 2: ${page2Ids.length}`,
      ),
    );
  }

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
