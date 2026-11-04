/**
 * Counter programme/item projection (`EA-BL-001-CORR-002-B`, D7/N4).
 *
 * The Counter never keeps a Reward Program wire object: `toCounterProgrammes` copies a short,
 * explicit whitelist of fields (programme id/name, whether multiple units are allowed, and each
 * qualifying item's opaque id + frozen display name) and drops everything else. In particular the
 * Business Review routing threshold can never enter Counter state or the DOM — for Staff it is absent
 * from the server response, and for an Owner/Manager (whose response does carry it) it is discarded
 * here. The whitelist reads no `businessReviewQuantityThreshold`/`bulkReviewThreshold` key at all, so
 * absence is "not Staff data", never "threshold disabled".
 */

import type { RewardProgramWithVersionsWire } from "../api/rewardProgramMutations";

export type CounterItem = { readonly id: string; readonly name: string };

export type CounterProgramme = {
  readonly id: string;
  readonly name: string;
  readonly multipleUnitsAllowed: boolean;
  readonly items: readonly CounterItem[];
};

export function toCounterProgrammes(
  entries: readonly RewardProgramWithVersionsWire[],
): CounterProgramme[] {
  const programmes: CounterProgramme[] = [];
  for (const entry of entries) {
    const version = entry.currentVersion;
    if (entry.program.status !== "active" || entry.program.currentVersionId === null || !version) {
      continue;
    }
    programmes.push({
      id: entry.program.id,
      name: entry.program.displayName,
      multipleUnitsAllowed: version.multipleUnitsAllowed,
      items: version.qualifyingItems.map((item) => ({
        id: item.qualifyingItemId,
        name: item.itemNameAtVersion,
      })),
    });
  }
  return programmes;
}
