/**
 * QR reference generator port (ENG-P2-001-04).
 *
 * Provider-neutral generation abstraction. The domain layer never
 * depends on Firebase, browser APIs, a QR-image-rendering library, or
 * Node-specific randomness directly — a caller injects a concrete
 * implementation (or a deterministic fixed-sequence fake for tests).
 */

export interface QrReferenceGenerator {
  generateReference(): string;
}
