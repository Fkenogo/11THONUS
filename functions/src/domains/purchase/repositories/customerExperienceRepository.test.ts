import { describe, expect, it, vi } from "vitest";
import {
  listCustomerExperienceActivity,
  listCustomerExperienceCycles,
  listCustomerPendingUnits,
} from "./customerExperienceRepository";

function fakePool(responses: unknown[][]) {
  const seen: Array<{ sql: string; values: unknown[] }> = [];
  const query = vi.fn(async (sql: string, values: unknown[]) => {
    seen.push({ sql, values });
    return { rows: responses[seen.length - 1] };
  });
  return { pool: { query } as never, seen };
}

describe("customer experience reads", () => {
  it("scopes current Circle reads to the authenticated customer and returns only current cycles", async () => {
    const { pool, seen } = fakePool([
      [
        {
          business_id: "biz-1",
          reward_program_id: "program-1",
          programme_name: "Coffee Circle",
          qualifying_item_name: "Coffee",
          cycle_id: "cycle-1",
          cycle_number: 1,
          cycle_state: "active",
          verified_units: 8,
          available_reward_id: null,
          reward_description: null,
        },
      ],
    ]);

    const rows = await listCustomerExperienceCycles(pool, "cust-1");

    expect(seen[0].values).toEqual(["cust-1"]);
    expect(seen[0].sql).toContain("customer_identity_id = $1");
    expect(seen[0].sql).toContain("state IN ('active','reward_available')");
    expect(rows[0]).toMatchObject({
      businessId: "biz-1",
      verifiedUnits: 8,
      rewardAvailable: false,
    });
  });

  it("counts only waiting-for-customer purchases as Pending Units", async () => {
    const { pool, seen } = fakePool([
      [
        {
          business_id: "biz-1",
          reward_program_id: "program-1",
          programme_name: "Coffee Circle",
          qualifying_item_name: "Coffee",
          pending_units: 2,
        },
      ],
    ]);

    const rows = await listCustomerPendingUnits(pool, "cust-1");

    expect(seen[0].values).toEqual(["cust-1"]);
    expect(seen[0].sql).toContain("status = 'waiting_for_customer'");
    expect(seen[0].sql).not.toContain("pending_admission'");
    expect(rows[0]).toMatchObject({ pendingUnits: 2, rewardProgramId: "program-1" });
  });

  it("returns redemption history without individual confirmer identity", async () => {
    const { pool, seen } = fakePool([
      [
        {
          id: "redemption-1",
          business_id: "biz-1",
          reward_program_id: "program-1",
          programme_name: "Coffee Circle",
          item_label: null,
          quantity: null,
          event_kind: "reward_redeemed",
          event_status: "redeemed",
          reward_description: "A coffee",
          occurred_at: new Date("2026-10-01T12:00:00Z"),
        },
      ],
    ]);

    const rows = await listCustomerExperienceActivity(pool, "cust-1");

    expect(seen[0].values).toEqual(["cust-1"]);
    expect(rows[0]).toMatchObject({ eventKind: "reward_redeemed", rewardDescription: "A coffee" });
    expect("confirmedByUserId" in rows[0]).toBe(false);
    expect(seen[0].sql).not.toContain("confirmed_by_user_id");
  });
});
