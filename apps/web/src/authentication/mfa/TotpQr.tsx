/**
 * QR render for the `AUTH-MFA-003B` TOTP setup step. A thin wrapper over
 * `qrcode.react` (SVG, zero dependencies, locally generated — the enrollment
 * URI never touches an external service). The SVG carries the label
 * programmatically (`role="img"` + `aria-label`) so screen readers announce
 * the QR's purpose.
 */
import { QRCodeSVG } from "qrcode.react";

export function TotpQr({ value, label }: { value: string; label: string }) {
  return <QRCodeSVG value={value} size={200} role="img" aria-label={label} />;
}
