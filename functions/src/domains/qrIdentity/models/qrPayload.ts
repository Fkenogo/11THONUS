/**
 * QR payload value object (ENG-P2-001-04).
 *
 * The approved payload per `DEC-DATA-007`: only the opaque QR reference,
 * never personal data (name, phone, email), never trust/authentication
 * state, never reward balance or purchase history, never a signature or
 * version marker (none approved — the signed-token option was
 * considered and rejected, see `DEC-DATA-007` Decision Package §8).
 *
 * The payload is intentionally a single-field shape — structurally
 * incapable of carrying anything beyond the reference — rather than a
 * JSON envelope, which also avoids introducing a JSON-parsing attack
 * surface for a "plain opaque reference."
 */

import { createQrReference, type QrReference } from "./qrReference";

export type QrPayload = { readonly qrReference: QrReference };

export function createQrPayload(qrReference: QrReference): QrPayload {
  return Object.freeze({ qrReference });
}

export function serializeQrPayload(payload: QrPayload): string {
  return payload.qrReference;
}

export function parseQrPayload(raw: string): QrPayload {
  return createQrPayload(createQrReference(raw));
}
