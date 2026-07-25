/**
 * Server-timestamp helper (ENG-P1-002).
 *
 * The single supported way to produce a Firestore server-generated
 * timestamp. Every shared and future domain write uses this rather than
 * calling `FieldValue.serverTimestamp()` directly, so the source of a
 * timestamp value is never ambiguous.
 */

import { FieldValue } from "firebase-admin/firestore";

export function serverTimestamp(): FieldValue {
  return FieldValue.serverTimestamp();
}
