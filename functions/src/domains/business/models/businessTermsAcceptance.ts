/**
 * `BusinessTermsAcceptance` domain contract (`ENG-P3-002A`, design §37.3).
 *
 * The persisted evidence that an authenticated individual accepted a
 * specific Business Terms version, in a specific Business registration
 * context, at a server-controlled time — Option A from design §37.2
 * (a dedicated, purpose-built record), shaped conceptually like
 * `BusinessMembershipInvitation` (`functions/src/domains/permissions/models/businessMembershipInvitation.ts`):
 * a small, framework-independent domain contract (construction +
 * validation + a fail-closed Firestore-document reader), reused
 * conceptually, not copied verbatim.
 *
 * **Write-once, by design (§37.3).** There is no update/mutation function
 * in this module — a later Terms version, or a re-acceptance of the same
 * version in a fresh registration context, is always a *new* record, never
 * an update to an existing one. This is the single design choice that
 * directly satisfies "a later Terms version must not erase historical
 * evidence that an earlier version was accepted." The repository layer
 * (`businessTermsAcceptanceRepository.ts`) enforces this at the
 * persistence boundary (a transactional existence check before any write).
 *
 * **Deliberately excluded fields (§37.3):** no `status`
 * (`"granted"`/`"withdrawn"`) — no governed Business-Terms-withdrawal
 * product flow exists; no `updatedAt`/mutation support — the record is
 * immutable. `Business.termsAccepted: boolean` is never added anywhere —
 * that model (Option C, §37.2) was assessed and rejected as unable to
 * express who/which-version/when.
 *
 * **Legal-content boundary.** `termsVersion` is an opaque string reference
 * only — this module never validates it against, or embeds, actual Terms
 * *content*. `DEC-LEGAL-002` (the Terms text itself) remains outside this
 * module's authority entirely (design §37.5).
 */

import {
  isSupportedLanguageCode,
  type LanguageCode,
} from "../../commerceKnowledge/models/languageCode";
import { invalidBusinessFieldError } from "./businessErrors";

export type BusinessTermsAcceptance = {
  readonly id: string;
  readonly acceptingCustomerIdentityId: string;
  readonly businessId: string;
  readonly termsVersion: string;
  readonly acceptedAt: Date;
  readonly languageCode: LanguageCode;
  readonly collectionMethod?: string;
  readonly createdAt: Date;
  readonly schemaVersion: number;
};

export type CreateBusinessTermsAcceptanceParams = {
  id: string;
  acceptingCustomerIdentityId: string;
  businessId: string;
  termsVersion: string;
  acceptedAt: Date;
  languageCode: string;
  collectionMethod?: string;
};

function requireNonBlank(field: string, value: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw invalidBusinessFieldError(field, String(value));
  }
  return value;
}

/** Firestore's own hard limit on a document id's UTF-8 byte length. */
const FIRESTORE_DOCUMENT_ID_MAX_BYTES = 1500;

/**
 * Deterministic composite id — `(businessId, acceptingCustomerIdentityId,
 * termsVersion)` — this is the identity key idempotency (§37 Phase S/§39)
 * relies on: the same actor accepting the same version for the same
 * Business always resolves to the same document id, so a repeated
 * acceptance call is structurally a no-op re-write of the same record,
 * never a duplicate. A different `termsVersion` (a newer Terms release)
 * always produces a different id — a new, additional, immutable record —
 * never an overwrite of the prior one.
 *
 * **Collision-resistant encoding (`ENG-P3-002A` independent review
 * correction, Phase I).** The original implementation joined the three
 * components with a bare `"_"` — unsafe in general, because (unlike
 * `KnowledgeTranslation`'s `entityType`/`languageCode`, both drawn from
 * small closed enums, `ENG-P3-001A`) none of `businessId`,
 * `acceptingCustomerIdentityId`, or — critically — `termsVersion` is
 * restricted to an underscore-free charset anywhere in this codebase.
 * `termsVersion` in particular is an operator-supplied, ungoverned string
 * (`businessTermsConfigRepository.ts`) with no charset validation at all:
 * two different triples such as `("a_b", "c", "d")` and `("a", "b_c",
 * "d")` would collide under raw `"_"` concatenation into the identical
 * string `"a_b_c_d"`. A `"/"` in any component would also silently
 * corrupt the Firestore document path (a subcollection separator, not a
 * literal character) rather than erroring.
 *
 * The fix: a length-prefixed ("netstring"-style) encoding —
 * `${length}.${value}` per component, concatenated with no ambiguous
 * shared delimiter. This is provably injective: the leading numeric
 * length prefix (itself digits only, terminated by the first `.`)
 * unambiguously determines exactly how many characters of `value` belong
 * to this component, regardless of what characters `value` itself
 * contains — including `_`, `.`, or even another length-prefix-shaped
 * substring. Two different triples can never produce the same encoded
 * string. `/` is rejected outright in any component (fails closed,
 * `invalidBusinessFieldError`) rather than silently corrupting the
 * document path, and the final id is rejected if it would exceed
 * Firestore's 1500-byte document-id limit — both fail-closed, never a
 * truncated or silently-accepted invalid id.
 */
function encodeIdComponent(field: string, value: string): string {
  if (value.includes("/")) {
    throw invalidBusinessFieldError(field, value);
  }
  return `${value.length}.${value}`;
}

export function businessTermsAcceptanceId(
  businessId: string,
  acceptingCustomerIdentityId: string,
  termsVersion: string,
): string {
  const id = [
    encodeIdComponent("businessId", businessId),
    encodeIdComponent("acceptingCustomerIdentityId", acceptingCustomerIdentityId),
    encodeIdComponent("termsVersion", termsVersion),
  ].join("_");

  if (Buffer.byteLength(id, "utf8") > FIRESTORE_DOCUMENT_ID_MAX_BYTES) {
    throw invalidBusinessFieldError("termsVersion", termsVersion);
  }
  return id;
}

export function createBusinessTermsAcceptance(
  params: CreateBusinessTermsAcceptanceParams,
): BusinessTermsAcceptance {
  const acceptingCustomerIdentityId = requireNonBlank(
    "acceptingCustomerIdentityId",
    params.acceptingCustomerIdentityId,
  );
  const businessId = requireNonBlank("businessId", params.businessId);
  const termsVersion = requireNonBlank("termsVersion", params.termsVersion);
  const id = requireNonBlank(
    "id",
    params.id || businessTermsAcceptanceId(businessId, acceptingCustomerIdentityId, termsVersion),
  );

  if (!(params.acceptedAt instanceof Date) || Number.isNaN(params.acceptedAt.getTime())) {
    throw invalidBusinessFieldError("acceptedAt", String(params.acceptedAt));
  }
  if (!isSupportedLanguageCode(params.languageCode)) {
    throw invalidBusinessFieldError("languageCode", params.languageCode);
  }

  return {
    id,
    acceptingCustomerIdentityId,
    businessId,
    termsVersion,
    acceptedAt: params.acceptedAt,
    languageCode: params.languageCode,
    collectionMethod: params.collectionMethod,
    createdAt: params.acceptedAt,
    schemaVersion: 1,
  };
}

function isTimestampLike(value: unknown): value is { toDate: () => Date } {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as { toDate?: unknown }).toDate === "function"
  );
}

function parseTimestamp(value: unknown): Date | null {
  if (!isTimestampLike(value)) return null;
  const date = value.toDate();
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return null;
  return date;
}

/**
 * Returns `null` (never throws) for a structurally invalid document —
 * mirrors `fromBusinessMembershipInvitationDocument`'s fail-closed reader
 * contract. A malformed persisted acceptance record must never be
 * silently treated as "accepted" by a caller further up the stack.
 */
export function fromBusinessTermsAcceptanceDocument(
  id: string,
  raw: unknown,
): BusinessTermsAcceptance | null {
  if (typeof id !== "string" || id.trim().length === 0) return null;
  if (typeof raw !== "object" || raw === null) return null;

  const data = raw as Partial<{
    acceptingCustomerIdentityId: unknown;
    businessId: unknown;
    termsVersion: unknown;
    acceptedAt: unknown;
    languageCode: unknown;
    collectionMethod: unknown;
    createdAt: unknown;
    schemaVersion: unknown;
  }>;

  if (
    typeof data.acceptingCustomerIdentityId !== "string" ||
    data.acceptingCustomerIdentityId.trim().length === 0
  ) {
    return null;
  }
  if (typeof data.businessId !== "string" || data.businessId.trim().length === 0) return null;
  if (typeof data.termsVersion !== "string" || data.termsVersion.trim().length === 0) return null;
  if (typeof data.languageCode !== "string" || !isSupportedLanguageCode(data.languageCode)) {
    return null;
  }
  if (
    typeof data.schemaVersion !== "number" ||
    !Number.isInteger(data.schemaVersion) ||
    data.schemaVersion < 1
  ) {
    return null;
  }

  const acceptedAt = parseTimestamp(data.acceptedAt);
  const createdAt = parseTimestamp(data.createdAt);
  if (!acceptedAt || !createdAt) return null;

  let collectionMethod: string | undefined;
  if (data.collectionMethod !== undefined) {
    if (typeof data.collectionMethod !== "string" || data.collectionMethod.trim().length === 0) {
      return null;
    }
    collectionMethod = data.collectionMethod;
  }

  return {
    id,
    acceptingCustomerIdentityId: data.acceptingCustomerIdentityId,
    businessId: data.businessId,
    termsVersion: data.termsVersion,
    acceptedAt,
    languageCode: data.languageCode,
    collectionMethod,
    createdAt,
    schemaVersion: data.schemaVersion,
  };
}

/** Plain-object shape for a Firestore write — native `Date`, no `Timestamp` import (framework-independent). */
export function toBusinessTermsAcceptanceDocumentFields(
  acceptance: BusinessTermsAcceptance,
): Record<string, unknown> {
  const fields: Record<string, unknown> = {
    acceptingCustomerIdentityId: acceptance.acceptingCustomerIdentityId,
    businessId: acceptance.businessId,
    termsVersion: acceptance.termsVersion,
    acceptedAt: acceptance.acceptedAt,
    languageCode: acceptance.languageCode,
    createdAt: acceptance.createdAt,
    schemaVersion: acceptance.schemaVersion,
  };
  if (acceptance.collectionMethod !== undefined) {
    fields.collectionMethod = acceptance.collectionMethod;
  }
  return fields;
}
