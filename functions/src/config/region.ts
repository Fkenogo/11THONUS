/**
 * Platform region configuration (ENG-P1-001).
 *
 * The single source of truth for the Version 1 Cloud Functions region,
 * per DEC-TECH-005 (Cloud Environment & Deployment Strategy — confirmed
 * 2026-07-19, Phase 0E). Every Cloud Function's global options reference
 * this constant rather than repeating the region string.
 */

export const PLATFORM_REGION = "europe-west1";
