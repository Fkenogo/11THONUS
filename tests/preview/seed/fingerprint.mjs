// Founder Preview (EA-002) — the deterministic "state fingerprint".
//
// IDs and timestamps legitimately differ between seed runs (the platform generates them),
// so determinism is asserted on the LOGICAL state: who/what/where each seeded thing is,
// read back through the real read callables (and SQL for Commercial/purchase aggregates).
// `preview:verify` compares the live fingerprint to `expected-fingerprint.json`; running
// reset twice must produce identical fingerprints.
import { withClient } from "../lib/postgres.mjs";
import { SeedSession } from "./session.mjs";

function sortObject(value) {
  if (Array.isArray(value)) return value.map(sortObject);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map((k) => [k, sortObject(value[k])]),
    );
  }
  return value;
}

export async function computeFingerprint({ postgresUrl, state }) {
  const s = new SeedSession();
  const lnToCustomer = Object.fromEntries(
    Object.entries(state.identities)
      .filter(([, v]) => v.loyaltyNumber)
      .map(([key, v]) => [v.loyaltyNumber, key.replace(/^customer_/, "")]),
  );
  const customerOf = (ln) => lnToCustomer[ln] ?? `unknown:${ln}`;

  const businesses = {};
  for (const [bkey, b] of Object.entries(state.businesses)) {
    const ownerKey = `owner_${bkey}`;
    const context = await s.read(ownerKey, "getBusinessContext", { businessId: b.businessId });
    const entry = {
      name: context.displayName,
      status: context.status,
      termsAccepted: context.termsAcceptance?.accepted === true,
      category: context.primaryCategoryId,
      country: context.countryCode,
      currency: context.currencyCode,
    };

    if (context.status === "trial" || context.status === "active") {
      const programs = await s.read(ownerKey, "listRewardPrograms", { businessId: b.businessId });
      entry.programmes = programs
        .map((p) => ({
          name: p.program.displayName,
          status: p.program.status,
          shared: p.program.sharedLoyaltyNumberAllowed,
          items: (p.currentVersion ?? p.draftVersion)?.qualifyingItems
            .map((i) => i.itemNameAtVersion)
            .sort(),
          requiredUnits: (p.currentVersion ?? p.draftVersion)?.requiredVerifiedUnits,
        }))
        .sort((a, c) => a.name.localeCompare(c.name));

      const memberships = await s.read(ownerKey, "listStaffMemberships", {
        businessId: b.businessId,
      });
      const list = memberships.memberships ?? memberships;
      entry.team = list.map((m) => m.role).sort();

      const progress = await s.read(ownerKey, "listLoyaltyCycleProgressForBusiness", {
        businessId: b.businessId,
        limit: 100,
      });
      entry.cycles = (progress.cycles ?? progress)
        .map((c) => ({
          customer: customerOf(c.customerLoyaltyNumber),
          programme: c.rewardProgramName,
          sequence: c.cycleSequenceNumber,
          state: c.cycleState,
          units: c.allocatedUnits,
          pending: c.pendingUnits,
        }))
        .sort((x, y) => `${x.customer}${x.sequence}`.localeCompare(`${y.customer}${y.sequence}`));

      const rewards = await s.read(ownerKey, "listAvailableRewardsForBusiness", {
        businessId: b.businessId,
        limit: 100,
      });
      entry.availableRewards = (rewards.rewards ?? rewards)
        .map((r) => customerOf(r.customerLoyaltyNumber))
        .sort();
    }
    businesses[bkey] = entry;
  }

  const sql = await withClient(postgresUrl, async (client) => {
    const idToKey = Object.fromEntries(
      Object.entries(state.businesses).map(([k, v]) => [v.businessId, k]),
    );
    const out = {
      purchases: {},
      rewards: {},
      redemptions: {},
      commercial: {},
      settlements: {},
      consumption: {},
    };

    for (const row of (
      await client.query(
        "SELECT business_id, status, count(*)::int AS n FROM purchase_records GROUP BY 1, 2",
      )
    ).rows) {
      (out.purchases[idToKey[row.business_id]] ??= {})[row.status] = row.n;
    }
    for (const row of (
      await client.query("SELECT business_id, state, count(*)::int AS n FROM rewards GROUP BY 1, 2")
    ).rows) {
      (out.rewards[idToKey[row.business_id]] ??= {})[row.state] = row.n;
    }
    for (const row of (
      await client.query("SELECT business_id, count(*)::int AS n FROM redemptions GROUP BY 1")
    ).rows) {
      out.redemptions[idToKey[row.business_id]] = row.n;
    }
    for (const row of (
      await client.query(
        `SELECT business_id, settlement_market, trial_remaining_units, paid_balance_units,
                trial_reserved_units, paid_reserved_units, service_restriction,
                (paid_service_activated_at IS NOT NULL) AS paid_service_activated
           FROM commercial_accounts`,
      )
    ).rows) {
      out.commercial[idToKey[row.business_id]] = {
        market: row.settlement_market,
        trialRemaining: row.trial_remaining_units,
        paidBalance: row.paid_balance_units,
        trialReserved: row.trial_reserved_units,
        paidReserved: row.paid_reserved_units,
        restriction: row.service_restriction,
        paidServiceActivated: row.paid_service_activated,
      };
    }
    for (const row of (
      await client.query(
        "SELECT business_id, status, count(*)::int AS n FROM commercial_settlements GROUP BY 1, 2",
      )
    ).rows) {
      (out.settlements[idToKey[row.business_id]] ??= {})[row.status] = row.n;
    }
    for (const row of (
      await client.query(
        "SELECT business_id, count(*)::int AS n FROM commercial_consumption_events GROUP BY 1",
      )
    ).rows) {
      out.consumption[idToKey[row.business_id]] = row.n;
    }
    out.heldPurchases = (
      await client.query(
        "SELECT count(*)::int AS n FROM purchase_records WHERE status = 'pending_admission'",
      )
    ).rows[0].n;
    return out;
  });

  return sortObject({
    scenario: "founder-slice-1",
    identityKeys: Object.keys(state.identities).sort(),
    operatorEstablished: Boolean(state.operator?.customerIdentityId),
    businesses,
    ...sql,
  });
}
