/**
 * Single source of truth for whether Business Terms have real, user-readable content today
 * (`ENG-P3-002-UI-IMP-B-REVIEW` Phase D correction — extracted from `TermsStep.tsx` so Dashboard
 * Home's readiness state and the establishment Terms step can never independently drift on this
 * question).
 *
 * A server-authoritative *required Terms version* (`BusinessContext.termsAcceptance.version`) is
 * not the same thing as a user-*readable* Terms document/link. Grepping the full repository finds
 * no `termsDocumentId`/`termsUrl`/readable-content source anywhere — `ENG-P3-002-DESIGN-001`
 * §37.5 itself confirms "no in-repo legal-document CMS" and defers the actual content to the
 * still-open `DEC-LEGAL-002`. A user must never be offered a consent control, or told Terms are
 * "outstanding" as if reviewing them is currently possible, for content they cannot read.
 * Hard-pinned to `false` until a future package wires in a real governed content source and
 * deliberately flips this flag (or its replacement).
 */
export const TERMS_READABLE_CONTENT_AVAILABLE = false;
