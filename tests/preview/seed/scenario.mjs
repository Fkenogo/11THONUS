// Founder Preview (EA-002) — scenario `founder-slice-1`: the deterministic dataset defined
// in EA-001 §11. See `docs/runbooks/founder-preview-runbook.md` for the human-readable
// inventory and `seedInventory` below for the machine-readable one.
//
// Product Truth overrides the prototype wherever they differ:
//   • Circle progress exists ONLY after the customer verifies a recorded purchase — every
//     unit below is recorded by staff/owner/manager and then verified by the customer.
//   • No Manager Approvals queue and no quick-add customer exist anywhere in this data.
//   • Commercial values follow the governed model: USD 2 equivalent per unit, trial grants
//     within 3–5 (no default), negative credit permitted. Local-currency unit prices are
//     PREVIEW-ONLY illustrations (launch input L-1 is still open) and are labelled as such.
//   • The Commercial admission gate is OFF: no purchase is ever held (`pending_admission`).
import { SeedSession } from "./session.mjs";
import { createAdminServices } from "./adminServices.mjs";

const DAY = 24 * 60 * 60 * 1000;
const daysAgo = (n) => new Date(Date.now() - n * DAY).toISOString();
const PROGRAMME_EFFECTIVE_FROM = () => daysAgo(150);

/** PREVIEW-ONLY illustrative local unit prices (whole local units). NOT a launch price. */
const PREVIEW_UNIT_PRICE = {
  BI: { currency: "BIF", minor: 5800 },
  RW: { currency: "RWF", minor: 2900 },
};

export const BUSINESSES = {
  bella: {
    name: "Bella Salon",
    owner: "owner_bella",
    category: "cat_salon",
    market: "BI",
    country: "BI",
    currency: "BIF",
    city: "Bujumbura",
    phone: "+25761000001",
    timezone: "Africa/Bujumbura",
  },
  sparkle: {
    name: "Sparkle Car Wash",
    owner: "owner_sparkle",
    category: "cat_car_wash",
    market: "RW",
    country: "RW",
    currency: "RWF",
    city: "Kigali",
    phone: "+250780000002",
    timezone: "Africa/Kigali",
  },
  mutima: {
    name: "Mutima Mini-Mart",
    owner: "owner_mutima",
    category: "cat_retail",
    market: "BI",
    country: "BI",
    currency: "BIF",
    city: "Gitega",
    phone: "+25761000003",
    timezone: "Africa/Bujumbura",
  },
  tembo: {
    name: "Tembo Fitness",
    owner: "owner_tembo",
    category: "cat_gym",
    market: "RW",
    country: "RW",
    currency: "RWF",
    city: "Musanze",
    phone: "+250780000004",
    timezone: "Africa/Kigali",
  },
  ubuntu: {
    name: "Ubuntu Books",
    owner: "owner_ubuntu",
    category: "cat_retail",
    market: "BI",
    country: "BI",
    currency: "BIF",
    city: "Bujumbura",
    phone: "+25761000005",
    timezone: "Africa/Bujumbura",
  },
};

export async function runFounderSlice1({ postgresUrl, log = console.log }) {
  const session = new SeedSession({ log });
  const admin = createAdminServices({ postgresUrl });
  try {
    return await build(session, admin, log);
  } finally {
    await admin.close();
  }
}

async function build(s, admin, log) {
  const step = (message) => log(`  · ${message}`);

  // ---------------------------------------------------------------- identities
  step("registering preview identities (real Auth emulator + `authenticate`)");
  for (const key of s.identities.keys()) await s.register(key);

  // Artifacts a counter would be shown (Loyalty Number / QR reference) — read from the
  // platform's own records, never fabricated.
  const artifacts = {};
  for (const [key, identity] of s.identities) {
    if (!identity.customerIdentityId) continue;
    const ln = await admin.db
      .collection("loyaltyNumbers")
      .where("customerIdentityId", "==", identity.customerIdentityId)
      .get();
    const qr = await admin.db
      .collection("qrIdentityRecords")
      .where("customerIdentityId", "==", identity.customerIdentityId)
      .where("status", "==", "active")
      .get();
    artifacts[key] = {
      loyaltyNumber: ln.docs[0]?.data().loyaltyNumber,
      qrReference: qr.docs[0]?.data().qrReference,
    };
    if (!artifacts[key].loyaltyNumber || !artifacts[key].qrReference) {
      throw new Error(`Identity ${key} has no issued Loyalty Number / QR reference.`);
    }
    s.state.identities[key] = { ...s.state.identities[key], ...artifacts[key] };
  }

  // ---------------------------------------------------------------- operator
  step("establishing the Platform Administrator record (bootstrap service)");
  const adminId = s.identity("operator").customerIdentityId;
  await admin.bootstrapAdministrator(adminId);
  const discovery = await s.read("operator", "discoverPlatformAdministrator", {});
  s.state.operator = { customerIdentityId: adminId, discovery: sanitizeDiscovery(discovery) };

  // ---------------------------------------------------------------- businesses
  const business = {};
  for (const [bkey, spec] of Object.entries(BUSINESSES)) {
    step(
      `onboarding ${spec.name} (create → Terms → submit${bkey === "ubuntu" ? "" : " → activate"})`,
    );
    const created = await s.as(spec.owner, "createBusiness", {
      displayName: spec.name,
      primaryCategoryId: spec.category,
      countryCode: spec.country,
      currencyCode: spec.currency,
      timezone: spec.timezone,
      city: spec.city,
      contactPhone: spec.phone,
      supportedLanguages: [],
    });
    const businessId = created.businessId;
    business[bkey] = { businessId, ...spec, items: {}, programmes: {} };
    s.state.businesses[bkey] = { businessId, name: spec.name, businessCode: created.businessCode };
    // Real Terms acceptance against the existing TEST_ONLY_FIXTURE Terms record
    // (FD-PREVIEW-TERMS-001) — never skipped or silently bypassed.
    await s.as(spec.owner, "acceptBusinessTerms", { businessId });
    await s.as(spec.owner, "submitBusinessForVerification", { businessId });
    if (bkey !== "ubuntu") await admin.activateBusiness(adminId, businessId);
  }

  // ---------------------------------------------------------------- team
  step("Bella Salon team: manager + staff (real invitations, verified email, acceptance)");
  await inviteAndAccept(s, business.bella, "owner_bella", "manager_bella", "manager");
  await inviteAndAccept(s, business.bella, "owner_bella", "staff_bella", "staff");
  step("Sparkle Car Wash team: Diane also staffs a second Business");
  await inviteAndAccept(s, business.sparkle, "owner_sparkle", "staff_bella", "staff");

  // ---------------------------------------------------------------- programmes
  step("qualifying items + Reward Programs (published and one draft)");
  const bella = business.bella;
  await qualifyingItems(s, bella, ["Haircut", "Braiding", "Manicure", "Blow-dry", "Hair wash"]);
  bella.programmes.cut = await programme(s, bella, {
    name: "Premium Cut Circle",
    reward: "A free haircut",
    items: ["Haircut", "Braiding"],
    shared: false,
    publish: true,
  });
  // EA-BL-001-CORR-002-B (Staff Counter preview): a published programme that accepts a Loyalty
  // Number (so the Counter's Loyalty Number path works) and routes a Purchase of 5+ units to
  // Business Review -- a real programme setting, created through the real callable. Together with
  // "Premium Cut Circle" (QR only) Staff see two programmes, which also exercises the neutral
  // customer-code refusal when a Loyalty Number is presented against a QR-only programme.
  bella.programmes.express = await programme(s, bella, {
    name: "Express Styling Circle",
    reward: "A free blow-dry",
    items: ["Blow-dry", "Hair wash"],
    shared: true,
    publish: true,
    businessReviewQuantityThreshold: 5,
  });
  bella.programmes.family = await programme(s, bella, {
    name: "Family Care Circle",
    reward: "A free manicure",
    items: ["Manicure"],
    shared: true,
    publish: false, // left as a draft on purpose: shows an unpublished programme
  });

  const sparkle = business.sparkle;
  await qualifyingItems(s, sparkle, ["Basic wash", "Full detail"]);
  sparkle.programmes.wash = await programme(s, sparkle, {
    name: "Wash 10+1",
    reward: "A free basic wash",
    items: ["Basic wash", "Full detail"],
    shared: false,
    publish: true,
  });

  const mutima = business.mutima;
  await qualifyingItems(s, mutima, ["Weekly groceries"]);
  mutima.programmes.groceries = await programme(s, mutima, {
    name: "Mini-Mart Regulars",
    reward: "A free 1 kg bag of sugar",
    items: ["Weekly groceries"],
    shared: false,
    publish: true,
  });

  const tembo = business.tembo;
  await qualifyingItems(s, tembo, ["Day pass"]);
  tembo.programmes.visits = await programme(s, tembo, {
    name: "Gym Visits",
    reward: "A free day pass",
    items: ["Day pass"],
    shared: false,
    publish: true,
  });

  // ---------------------------------------------------------------- commercial (state before activity)
  step("Commercial accounts: price schedules, trial/paid capacity, credit, restriction");
  for (const market of ["BI", "RW"]) {
    const price = PREVIEW_UNIT_PRICE[market];
    await admin.commercial(adminId, "setPriceSchedule", {
      market,
      currency: price.currency,
      localUnitPriceMinor: price.minor,
      usdEquivalentMinor: 200, // governed USD 2 equivalent
      // A price schedule can only take effect from now onward (pricing history is never rewritten).
      effectiveFrom: new Date(Date.now() + 1000),
      rateNote: "PREVIEW-ONLY illustrative local price; launch price input L-1 is still open.",
      reasonText: "Founder Preview seed: illustrative price schedule (not a launch price).",
      reference: `PREVIEW-PRICE-${market}`,
    });
  }
  await new Promise((resolve) => setTimeout(resolve, 1500)); // let the schedules take effect
  for (const bkey of ["bella", "sparkle", "mutima", "tembo"]) {
    await admin.commercial(adminId, "openCommercialAccount", {
      businessId: business[bkey].businessId,
      reasonText: "Founder Preview seed: open Commercial account.",
    });
  }
  await admin.commercial(adminId, "grantTrial", {
    businessId: bella.businessId,
    units: 4, // within the governed 3–5 range; deliberately not the prototype's 5
    reasonText: "Founder Preview seed: trial allowance.",
    reference: "PREVIEW-TRIAL-BELLA",
  });
  await admin.commercial(adminId, "grantTrial", {
    businessId: mutima.businessId,
    units: 3,
    reasonText: "Founder Preview seed: trial allowance.",
    reference: "PREVIEW-TRIAL-MUTIMA",
  });

  // Sparkle: paid. Settlement lifecycle examples (recorded / confirmed / cancelled / voided).
  const settle = async (bkey, units, ref) =>
    admin.commercial(adminId, "recordSettlement", {
      businessId: business[bkey].businessId,
      method: "bank_transfer",
      externalReference: ref,
      currency: PREVIEW_UNIT_PRICE[business[bkey].market].currency,
      amountMinor: units * PREVIEW_UNIT_PRICE[business[bkey].market].minor,
      unitsPurchased: units,
      receivedAt: new Date(), // received "now": a settlement is priced at the schedule in force when received
      reasonText: "Founder Preview seed: offline settlement.",
    });
  const confirm = (bkey, settlementId) =>
    admin.commercial(adminId, "confirmSettlement", {
      businessId: business[bkey].businessId,
      settlementId,
      confirmationNote: "Founder Preview seed: payment verified.",
    });
  const s1 = await settle("sparkle", 20, "PREVIEW-SPARKLE-BT-001");
  await confirm("sparkle", s1.settlementId);
  await admin.commercial(adminId, "activatePaidService", {
    businessId: sparkle.businessId,
    reasonText: "Founder Preview seed: activate paid service.",
    reference: "PREVIEW-SPARKLE-ACTIVATE",
  });
  await settle("sparkle", 10, "PREVIEW-SPARKLE-BT-002"); // stays `recorded` (awaiting confirmation)
  const s3 = await settle("sparkle", 5, "PREVIEW-SPARKLE-BT-003");
  await admin.commercial(adminId, "cancelSettlement", {
    businessId: sparkle.businessId,
    settlementId: s3.settlementId,
    reasonText: "Founder Preview seed: payment never arrived.",
    reference: "PREVIEW-SPARKLE-CANCEL",
  });
  const s4 = await settle("sparkle", 5, "PREVIEW-SPARKLE-BT-004");
  await confirm("sparkle", s4.settlementId);
  await admin.commercial(adminId, "voidSettlement", {
    businessId: sparkle.businessId,
    settlementId: s4.settlementId,
    reasonText: "Founder Preview seed: duplicate payment reversed.",
    reference: "PREVIEW-SPARKLE-VOID",
  });

  // Tembo: paid, then negative credit and a restriction on new Circle starts.
  const t1 = await settle("tembo", 2, "PREVIEW-TEMBO-BT-001");
  await confirm("tembo", t1.settlementId);
  await admin.commercial(adminId, "activatePaidService", {
    businessId: tembo.businessId,
    reasonText: "Founder Preview seed: activate paid service.",
    reference: "PREVIEW-TEMBO-ACTIVATE",
  });
  await admin.commercial(adminId, "adjustCommercialCredit", {
    businessId: tembo.businessId,
    unitsDelta: -4, // 2 purchased − 4 = −2: recoverable negative credit (no floor is governed)
    reasonCode: "correction",
    reasonText: "Founder Preview seed: demonstrate recoverable negative credit.",
    reference: "PREVIEW-TEMBO-NEGATIVE",
  });
  await admin.commercial(adminId, "restrictNewStarts", {
    businessId: tembo.businessId,
    reasonText: "Founder Preview seed: demonstrate a restriction on new Circle starts.",
    reference: "PREVIEW-TEMBO-RESTRICT",
  });

  // ---------------------------------------------------------------- loyalty activity
  const ctx = { s, artifacts };

  step("Bella Salon: Circles at different positions (record → customer verifies)");
  const cut = bella.programmes.cut;
  await visits(ctx, bella, cut, "amina", 3, { recorder: "staff_bella", startDaysAgo: 20 });
  await visits(ctx, bella, cut, "jeanclaude", 7, { recorder: "staff_bella", startDaysAgo: 45 });
  await visits(ctx, bella, cut, "esther", 9, { recorder: "manager_bella", startDaysAgo: 60 }); // one visit from a Reward
  await visits(ctx, bella, cut, "kevin", 10, { recorder: "staff_bella", startDaysAgo: 70 }); // Reward available
  await visits(ctx, bella, cut, "aline", 10, { recorder: "staff_bella", startDaysAgo: 100 }); // -> redeemed below

  step("Bella Salon: Reward redeemed by the Manager (real `confirmRedemption`)");
  // The Business read model (`listAvailableRewardsForBusiness`) deliberately carries no Reward
  // id (EA-002 finding: a missing seam for the redemption experience). The customer's OWN read
  // does, so the seed asks the customer's real read model which Reward is hers, then has the
  // Manager confirm it through the real `confirmRedemption` callable.
  const mine = await s.read("customer_aline", "listAvailableRewardsForCustomer", {});
  const alineReward = (mine.rewards ?? mine).find((r) => r.businessId === bella.businessId);
  if (!alineReward) throw new Error("Aline's Reward was not available to redeem.");
  const redemption = await s.as("manager_bella", "confirmRedemption", {
    businessId: bella.businessId,
    rewardId: alineReward.id,
  });
  s.state.redemption = { aline: summariseRedemption(redemption) };
  await visits(ctx, bella, cut, "aline", 2, { recorder: "staff_bella", startDaysAgo: 5 }); // next Circle has begun

  step("Bella Salon: a purchase waiting for the customer, and a disputed purchase");
  await visits(ctx, bella, cut, "moses", 1, {
    recorder: "staff_bella",
    startDaysAgo: 0,
    verify: false,
  });
  const disputed = await record(ctx, bella, cut, "chantal", {
    recorder: "staff_bella",
    daysAgo: 1,
  });
  await s.as("customer_chantal", "raisePurchaseDispute", {
    purchaseRecordId: disputed,
    reason: "wrong_quantity",
  });

  step("Sparkle Car Wash: customers mid-Circle and one Reward available");
  const wash = sparkle.programmes.wash;
  await visits(ctx, sparkle, wash, "amina", 5, { recorder: "owner_sparkle", startDaysAgo: 30 });
  await visits(ctx, sparkle, wash, "jeanclaude", 2, { recorder: "staff_bella", startDaysAgo: 12 });
  await visits(ctx, sparkle, wash, "yves", 10, { recorder: "owner_sparkle", startDaysAgo: 55 });

  step("Mutima Mini-Mart: two completed Circles consume 2 of 3 trial units (low capacity)");
  const groceries = mutima.programmes.groceries;
  await visits(ctx, mutima, groceries, "chantal", 10, {
    recorder: "owner_mutima",
    startDaysAgo: 40,
    bulk: true,
  });
  await visits(ctx, mutima, groceries, "moses", 10, {
    recorder: "owner_mutima",
    startDaysAgo: 25,
    bulk: true,
  });

  step("Tembo Fitness: a customer mid-Circle");
  await visits(ctx, tembo, tembo.programmes.visits, "esther", 4, {
    recorder: "owner_tembo",
    startDaysAgo: 18,
  });

  // ---------------------------------------------------------------- consumption
  step(
    "Commercial consumption projection (Rewards → ledger debits) via the real reconciliation service",
  );
  const report = await admin.reconcileConsumption();
  s.state.consumption = {
    scanned: report.scanned,
    projected: report.projected,
    failed: report.failed,
  };
  if (report.failed !== 0)
    throw new Error(`Consumption projection reported failures: ${JSON.stringify(report)}`);

  s.state.artifacts = artifacts;
  s.state.programmes = Object.fromEntries(
    Object.entries(business).map(([bkey, b]) => [
      bkey,
      Object.fromEntries(
        Object.entries(b.programmes).map(([pkey, p]) => [
          pkey,
          { rewardProgramId: p.rewardProgramId },
        ]),
      ),
    ]),
  );
  return s.state;
}

// ------------------------------------------------------------------ helpers

function sanitizeDiscovery(discovery) {
  return discovery && typeof discovery === "object" ? discovery : { raw: discovery ?? null };
}

function summariseRedemption(result) {
  return {
    nextLoyaltyCycleId: Boolean(result?.nextLoyaltyCycleId),
    unitsAllocatedForward: result?.unitsAllocatedForward ?? null,
  };
}

async function inviteAndAccept(s, biz, ownerKey, inviteeKey, role) {
  const invitee = s.identity(inviteeKey);
  await s.verifyEmail(inviteeKey);
  const created = await s.as(ownerKey, "createStaffInvitation", {
    businessId: biz.businessId,
    role,
    deliveryTarget: { type: "email", value: invitee.email },
  });
  const invitationId = created.invitation?.id ?? created.invitationId;
  await s.as(inviteeKey, "acceptStaffInvitation", { invitationReference: invitationId });
}

async function qualifyingItems(s, biz, names) {
  for (const name of names) {
    const item = await s.as(biz.owner, "createQualifyingItem", {
      businessId: biz.businessId,
      name,
    });
    biz.items[name] = item.id;
  }
  s.state.qualifyingItems[biz.name] = { ...biz.items };
}

async function programme(
  s,
  biz,
  { name, reward, items, shared, publish, businessReviewQuantityThreshold },
) {
  const created = await s.as(biz.owner, "createRewardProgram", {
    businessId: biz.businessId,
    displayName: name,
    rewardDescription: reward,
    multipleUnitsAllowed: true,
    sharedLoyaltyNumberAllowed: shared,
    effectiveFrom: PROGRAMME_EFFECTIVE_FROM(),
    qualifyingItemIds: items.map((n) => biz.items[n]),
    ...(businessReviewQuantityThreshold === undefined ? {} : { businessReviewQuantityThreshold }),
  });
  const result = {
    name,
    rewardProgramId: created.program.id,
    versionId: created.version.id,
    itemNames: items,
    shared,
  };
  if (publish) {
    await s.as(biz.owner, "publishRewardProgramVersion", {
      businessId: biz.businessId,
      rewardProgramId: result.rewardProgramId,
      versionId: result.versionId,
    });
  }
  return result;
}

/** Records one purchase as `recorder` presenting the customer's artifact. Returns the purchase id. */
async function record(
  { s, artifacts },
  biz,
  prog,
  customer,
  { recorder, daysAgo: ago, quantity = 1 },
) {
  const customerKey = `customer_${customer}`;
  const artifact = artifacts[customerKey];
  const item = biz.items[prog.itemNames[0]];
  const payload = {
    businessId: biz.businessId,
    rewardProgramId: prog.rewardProgramId,
    quantity,
    qualifyingItemId: item,
    purchaseDate: daysAgoIso(ago),
  };
  // A programme that forbids a shared Loyalty Number is presented by QR; the shared one by number.
  if (prog.shared) payload.loyaltyNumberValue = artifact.loyaltyNumber;
  else payload.qrReference = artifact.qrReference;
  const recorded = await s.as(recorder, "recordPurchase", payload);
  return recorded.purchase.id;
}

const daysAgoIso = (n) => new Date(Date.now() - n * DAY).toISOString();

/**
 * `units` verified units for a customer. Normal visits are one unit each, spread over time
 * (oldest first). `bulk` records the whole Circle as ONE multi-unit purchase (allowed by the
 * programme's `multipleUnitsAllowed`) to keep seeding quick where history detail is not the point.
 * `verify: false` leaves the purchase waiting for the customer.
 */
async function visits(
  ctx,
  biz,
  prog,
  customer,
  units,
  { recorder, startDaysAgo, verify = true, bulk = false },
) {
  const { s } = ctx;
  const customerKey = `customer_${customer}`;
  const batches = bulk ? [units] : Array.from({ length: units }, () => 1);
  for (let i = 0; i < batches.length; i += 1) {
    const ago = Math.max(
      0,
      startDaysAgo - Math.floor((i * startDaysAgo) / Math.max(batches.length, 1)),
    );
    const id = await record(ctx, biz, prog, customer, {
      recorder,
      daysAgo: ago,
      quantity: batches[i],
    });
    if (verify) {
      await s.as(customerKey, "verifyPurchase", { purchaseRecordId: id });
    }
  }
}
