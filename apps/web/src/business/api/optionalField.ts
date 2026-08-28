/**
 * Builds a one-key object with `key` present only when `value` is
 * non-empty — for spreading into a mutation payload (`ENG-P3-002-UI-IMP-H`
 * Phase C finding).
 *
 * The Firebase callable-functions client SDK serializes a property whose
 * value is `undefined` as JSON `null` (its own request encoder, not native
 * `JSON.stringify`, which would drop the key entirely) — so writing
 * `{ field: value || undefined }` directly into a mutation payload still
 * reaches the backend as `"field": null`, never as an absent key. Every
 * backend optional-string parser in this codebase (`parseOptionalString` in
 * `functions/src/index.ts`) treats only a genuinely *absent* key as "not
 * provided" and rejects a present `null` as an invalid argument — so a
 * payload that wants to leave an optional field unset must never include
 * the key at all. This was a real, reachable defect: `createBusiness`
 * (and `updateBusinessProfile`/`updateBusinessBranchProfile`) failed with
 * `invalid-argument` whenever a caller left an optional field blank
 * (e.g. no Business Type selected on EST-01/EST-02), across every screen
 * that builds its payload with the `field || undefined` pattern.
 *
 * Spread the result into the payload object instead of assigning
 * `field: value || undefined` directly:
 * `{ ...required, ...optionalField("businessTypeId", businessTypeId) }`.
 */
export function optionalField<K extends string, V>(
  key: K,
  value: V | "" | null | undefined,
): Partial<Record<K, V>> {
  if (value === "" || value === null || value === undefined) return {};
  return { [key]: value } as Partial<Record<K, V>>;
}
