/**
 * `touchPermissionBoundaryFixture` — internal test-only command shim
 * (`ENG-P2-004D`, Phase G).
 *
 * Calls `authorizeAndExecute` exactly the way a real Capability-3
 * protected command would, against the bounded internal
 * `permissionBoundaryTestFixtures` collection instead of any real
 * domain state — proves the authorization boundary end-to-end without
 * requiring Capability 3 to exist (design §14). Not a Cloud Function
 * endpoint, not exported outside this domain's own emulator tests. Uses
 * only already-governed permission ids from the Sensitive Permission
 * Catalogue (or a synthetic non-catalogued id, for the non-sensitive
 * fail-closed path) — mints no new permission.
 */

import type { Firestore } from "firebase-admin/firestore";
import { authorizeAndExecute, type AuthorizeAndExecuteResult } from "./authorizeAndExecute";
import {
  readPermissionBoundaryFixture,
  writePermissionBoundaryFixtureTouch,
} from "../repositories/permissionBoundaryFixtureRepository";

export type TouchPermissionBoundaryFixtureParams = {
  readonly userId: string;
  readonly businessId: string;
  readonly permission: string;
  readonly fixtureId: string;
  readonly idempotencyKey: string;
  readonly requestHash: string;
  readonly correlationId: string;
};

export async function touchPermissionBoundaryFixture(
  db: Firestore,
  params: TouchPermissionBoundaryFixtureParams,
): Promise<AuthorizeAndExecuteResult<{ touchedCount: number }>> {
  return authorizeAndExecute(db, {
    request: {
      userId: params.userId,
      businessId: params.businessId,
      permission: params.permission,
    },
    idempotencyKey: params.idempotencyKey,
    requestHash: params.requestHash,
    correlationId: params.correlationId,
    actorId: params.userId,
    mutation: {
      prepare: (transaction) => readPermissionBoundaryFixture(transaction, db, params.fixtureId),
      apply: (writer, prepared) => {
        const nextTouchedCount = (prepared?.touchedCount ?? 0) + 1;
        writePermissionBoundaryFixtureTouch(writer, db, {
          fixtureId: params.fixtureId,
          businessId: params.businessId,
          actorUserId: params.userId,
          nextTouchedCount,
        });
        return { touchedCount: nextTouchedCount };
      },
    },
  });
}
