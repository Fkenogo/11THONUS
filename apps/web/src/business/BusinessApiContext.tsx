/**
 * Composition root for the Business API layer (Phase S): bundles the
 * `Functions`/`Auth` instances once so `business/hooks/*` don't each
 * re-derive them, mirroring `createSignInActions.ts`'s production-wiring
 * pattern for authentication.
 */

import { createContext, useContext, type ReactNode } from "react";
import type { Auth } from "firebase/auth";
import type { Functions } from "firebase/functions";

export type BusinessApiPlatform = { auth: Auth; functions: Functions };

const BusinessApiContext = createContext<BusinessApiPlatform | null>(null);

export function BusinessApiProvider({
  platform,
  children,
}: {
  platform: BusinessApiPlatform;
  children: ReactNode;
}) {
  return <BusinessApiContext.Provider value={platform}>{children}</BusinessApiContext.Provider>;
}

export function useBusinessApiPlatform(): BusinessApiPlatform {
  const platform = useContext(BusinessApiContext);
  if (!platform) {
    throw new Error("useBusinessApiPlatform must be used within a BusinessApiProvider");
  }
  return platform;
}
