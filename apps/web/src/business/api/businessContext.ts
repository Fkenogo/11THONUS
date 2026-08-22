/**
 * `BusinessContext` — the bounded onboarding-hydration DTO the
 * `getBusinessContext` callable returns (`ENG-P3-002A`, design §14/§37.7).
 * Mirrors `functions/src/index.ts`'s `getBusinessContext` response shape
 * verbatim; this module owns no logic, only the wire type.
 */

export type BusinessStatus =
  | "draft"
  | "pending_verification"
  | "trial"
  | "active"
  | "suspended"
  | "expired"
  | "closed"
  | "archived";

export type BusinessContextBranch = {
  branchId: string;
  displayName: string;
  countryCode: string;
  city: string;
  address?: string;
};

export type BusinessContextTermsAcceptance = {
  accepted: boolean;
  version?: string;
  acceptedAt?: string;
};

export type BusinessContext = {
  businessId: string;
  businessCode: string;
  displayName: string;
  status: BusinessStatus;
  primaryCategoryId: string;
  businessTypeId?: string;
  countryCode: string;
  city: string;
  contactPhone: string;
  contactEmail?: string;
  branch: BusinessContextBranch | null;
  termsAcceptance: BusinessContextTermsAcceptance;
};
