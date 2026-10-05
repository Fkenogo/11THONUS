import type { Firestore } from "firebase-admin/firestore";
import type { PlatformPostgresPool } from "../../../infrastructure/postgres/postgresPool";
import { readBusinessByIdForRouting } from "../../business/repositories/businessRepository";
import { listAvailableRewardsForCustomer } from "../repositories/loyaltyCycleRepository";
import {
  listCustomerExperienceActivity,
  listCustomerExperienceCycles,
  listCustomerPendingUnits,
} from "../repositories/customerExperienceRepository";
import { projectCustomerCircles } from "./customerExperienceProjection";

export async function getCustomerExperienceOverview(
  db: Firestore,
  pool: PlatformPostgresPool,
  customerIdentityId: string,
) {
  const [cycleRows, pendingRows, activityRows, rewardRows] = await Promise.all([
    listCustomerExperienceCycles(pool, customerIdentityId),
    listCustomerPendingUnits(pool, customerIdentityId),
    listCustomerExperienceActivity(pool, customerIdentityId),
    listAvailableRewardsForCustomer(pool, customerIdentityId),
  ]);

  const businessIds = [
    ...new Set([
      ...cycleRows.map((row) => row.businessId),
      ...pendingRows.map((row) => row.businessId),
      ...activityRows.map((row) => row.businessId),
      ...rewardRows.map((row) => row.businessId),
    ]),
  ];
  const businesses = await Promise.all(
    businessIds.map(
      async (businessId) => [businessId, await readBusinessByIdForRouting(db, businessId)] as const,
    ),
  );
  const businessNames = new Map(
    businesses.map(([businessId, business]) => [businessId, business?.displayName ?? null]),
  );

  const circles = projectCustomerCircles(
    cycleRows.map((row) => ({ ...row, businessName: businessNames.get(row.businessId) ?? null })),
    pendingRows.map((row) => ({ ...row, businessName: businessNames.get(row.businessId) ?? null })),
  );
  const activity = activityRows.map((row) => ({
    ...row,
    occurredAt: row.occurredAt.toISOString(),
    businessName: businessNames.get(row.businessId) ?? null,
  }));
  const availableRewards = rewardRows.map((row) => ({
    id: row.id,
    businessId: row.businessId,
    businessName: businessNames.get(row.businessId) ?? null,
    rewardProgramId: row.rewardProgramId,
    rewardDescription: row.rewardDescription,
    rewardQuantity: row.rewardQuantity,
    availableAt: row.availableAt.toISOString(),
  }));

  return { circles, activity, availableRewards };
}
