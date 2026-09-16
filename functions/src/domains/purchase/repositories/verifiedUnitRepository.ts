/**
 * Verified Unit repository (`PLATFORM-BASELINE-006A`, design §15).
 *
 * 006A writes exactly one `credit` row per verified Purchase
 * (`quantity` = Purchase quantity, whole-record verification per
 * FD-PVL-004). Rows are insert-only: no 006A command updates or deletes a
 * unit row. Double-issuance is structurally impossible via the partial
 * unique index `verified_units_one_credit_per_purchase`. No reversal
 * writer exists in this package.
 */

import type { PoolClient } from "pg";
import type { PlatformPostgresPool } from "../../../infrastructure/postgres/postgresPool";
import type { PlatformPostgresTransaction } from "../../../infrastructure/postgres/postgresTransaction";
import type { VerifiedUnitEntryType, VerifiedUnitRow } from "../models/purchase";

type Queryable = PoolClient | PlatformPostgresPool;

type VerifiedUnitDbRow = {
  id: string;
  purchase_record_id: string;
  business_id: string;
  customer_identity_id: string;
  reward_program_id: string;
  reward_program_version_id: string;
  quantity: number;
  entry_type: VerifiedUnitEntryType;
  reverses_verified_unit_id: string | null;
  correction_purchase_record_id: string | null;
  reason_code: string;
  correlation_id: string;
  created_at: Date;
  created_by: string;
  schema_version: number;
};

function mapVerifiedUnitRow(row: VerifiedUnitDbRow): VerifiedUnitRow {
  return {
    id: row.id,
    purchaseRecordId: row.purchase_record_id,
    businessId: row.business_id,
    customerIdentityId: row.customer_identity_id,
    rewardProgramId: row.reward_program_id,
    rewardProgramVersionId: row.reward_program_version_id,
    quantity: row.quantity,
    entryType: row.entry_type,
    reversesVerifiedUnitId: row.reverses_verified_unit_id,
    correctionPurchaseRecordId: row.correction_purchase_record_id,
    reasonCode: row.reason_code,
    correlationId: row.correlation_id,
    createdAt: row.created_at,
    createdBy: row.created_by,
    schemaVersion: row.schema_version,
  };
}

export type InsertVerifiedUnitCreditParams = {
  readonly purchaseRecordId: string;
  readonly businessId: string;
  readonly customerIdentityId: string;
  readonly rewardProgramId: string;
  readonly rewardProgramVersionId: string;
  readonly quantity: number;
  readonly reasonCode: string;
  readonly correlationId: string;
  readonly createdBy: string;
};

export async function insertVerifiedUnitCredit(
  tx: PlatformPostgresTransaction,
  params: InsertVerifiedUnitCreditParams,
): Promise<VerifiedUnitRow> {
  const result = await tx.query<VerifiedUnitDbRow>(
    `INSERT INTO verified_units
       (purchase_record_id, business_id, customer_identity_id, reward_program_id,
        reward_program_version_id, quantity, entry_type, reason_code, correlation_id, created_by)
     VALUES ($1,$2,$3,$4,$5,$6,'credit',$7,$8,$9)
     RETURNING *`,
    [
      params.purchaseRecordId,
      params.businessId,
      params.customerIdentityId,
      params.rewardProgramId,
      params.rewardProgramVersionId,
      params.quantity,
      params.reasonCode,
      params.correlationId,
      params.createdBy,
    ],
  );
  return mapVerifiedUnitRow(result.rows[0]);
}

export async function getVerifiedUnitCreditForPurchase(
  db: Queryable,
  purchaseRecordId: string,
): Promise<VerifiedUnitRow | null> {
  const result = await db.query<VerifiedUnitDbRow>(
    `SELECT * FROM verified_units WHERE purchase_record_id = $1 AND entry_type = 'credit'`,
    [purchaseRecordId],
  );
  if (result.rows.length === 0) {
    return null;
  }
  return mapVerifiedUnitRow(result.rows[0]);
}
