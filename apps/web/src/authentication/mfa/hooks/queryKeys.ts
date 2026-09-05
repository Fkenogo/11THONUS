/**
 * React Query key factory for the MFA enrollment surface (`AUTH-MFA-003B`).
 * Same shape every other query-key factory in this codebase uses.
 */
export const mfaQueryKeys = {
  platformAdministratorDiscovery: () => ["mfa", "platform-administrator-discovery"] as const,
};
