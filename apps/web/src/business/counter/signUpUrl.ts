/**
 * The static, public sign-up address shown by the Counter's "New customer?" panel
 * (`EA-BL-001-CORR-002-B`, D3).
 *
 * It is the app's own public entry point and nothing else: identical for every Business, Staff member
 * and customer, with no token, identity, Business or per-customer data in it. A customer who opens it
 * on their OWN device signs in / registers through the existing customer authentication; the Counter
 * never creates, stages or hands over an account or a session.
 */
export function publicSignUpUrl(origin: string = window.location.origin): string {
  return `${origin}/`;
}
