/**
 * Phone-number masking for the EXT-TECH-001 delivery-test harness.
 *
 * Never display, log, or store a raw phone number after the tester
 * submits it — every on-screen and evidence-template representation
 * goes through this function first.
 */

const VISIBLE_TRAILING_DIGITS = 2;

export function maskPhoneNumber(raw: string): string {
  if (raw === "") return "(none)";

  const plusPrefix = raw.startsWith("+") ? "+" : "";
  const digits = raw.replace(/\D/g, "");
  const visible = digits.slice(-VISIBLE_TRAILING_DIGITS);
  const hiddenCount = Math.max(digits.length - VISIBLE_TRAILING_DIGITS, 0);

  return `${plusPrefix}${"*".repeat(hiddenCount)}${visible}`;
}
