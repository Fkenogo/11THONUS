/**
 * Establishment completeness (`ENG-P3-002-UI-IMP-A`, per `ENG-P3-002-UI-RECON-001` Part VII):
 * a persisted Business is "established" once its identity, classification, and default Branch
 * are all real — `createBusiness` enforces every one of these fields atomically, so in practice
 * this is always true for any Business that exists at all. Deliberately independent of Terms
 * acceptance (an activation/compliance concern, not establishment) and of Team/Staff (never an
 * establishment concern, per FD-1).
 */

import type { BusinessContext } from "../../api/businessContext";
import {
  isBranchComplete,
  isBusinessDetailsComplete,
  isClassificationComplete,
} from "../completeness";

export function isEstablishmentComplete(context: BusinessContext): boolean {
  return (
    isBusinessDetailsComplete(context) &&
    isClassificationComplete(context) &&
    isBranchComplete(context)
  );
}
