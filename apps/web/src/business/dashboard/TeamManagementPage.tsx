/**
 * Package F — Team Management screen (MGMT-01/DASH-04, `ENG-P3-002-UI-IMP-F`, per
 * `ENG-P3-002-UI-RECON-001` Part XV Package F, `FD-P3-002-G-001`, `FD-IDENTITY-DISPLAY-001`).
 * Displays the Staff transport's membership/invitation reads plus the
 * `PLATFORM-BASELINE-004A` workforce administration callables the domain
 * already governed: `acceptStaffInvitation` (via the standalone invitation
 * route), `suspend`/`reactivate`/`removeStaffMembership`, and
 * `changeStaffMembershipRole`.
 *
 * Management controls are rendered from the viewer's own live role
 * (`getAccessibleBusinesses`, no new backend contract): Owner sees
 * role-change plus lifecycle controls on non-owner rows; Manager sees
 * lifecycle controls on Staff rows only (`staff.assignRole` is
 * Owner-only non-delegable, and Manager→manager targets are never
 * permitted); Staff sees none. Owner rows never carry controls (owner
 * targets and self-actions are never permitted). UI visibility is
 * convenience only — every action is re-authorized server-side.
 *
 * Deliberately still excluded: a "Resend" action (no such callable
 * exists) and permission-override administration (backend capability
 * preserved but intentionally unexposed at MVP — no product authority
 * for a user-facing override UI exists).
 */

import { useEffect, useRef, useState } from "react";
import { useTranslation } from "../../i18n";
import { Button, Select, TextField } from "../../components/ui/formPrimitives";
import {
  useAccessibleBusinessesQuery,
  useStaffInvitationsQuery,
  useStaffMembershipsQuery,
} from "../hooks/businessQueries";
import {
  useChangeStaffMembershipRoleMutation,
  useCreateStaffInvitationMutation,
  useReactivateStaffMembershipMutation,
  useRemoveStaffMembershipMutation,
  useRevokeStaffInvitationMutation,
  useSuspendStaffMembershipMutation,
} from "../hooks/businessMutations";
import { MutationError } from "../onboarding/MutationError";
import type { BusinessContext } from "../api/businessContext";
import type { StaffInvitationSummary, StaffMembershipSummary } from "../api/staffLists";

const INVITATION_ROLE_OPTIONS = ["staff", "manager"] as const;

export function TeamManagementPage({ context }: { context: BusinessContext }) {
  const { t } = useTranslation("business");
  const membershipsQuery = useStaffMembershipsQuery(context.businessId);
  const invitationsQuery = useStaffInvitationsQuery(context.businessId);
  const accessibleQuery = useAccessibleBusinessesQuery();
  const createMutation = useCreateStaffInvitationMutation(context.businessId);
  const revokeMutation = useRevokeStaffInvitationMutation(context.businessId);
  const suspendMutation = useSuspendStaffMembershipMutation(context.businessId);
  const reactivateMutation = useReactivateStaffMembershipMutation(context.businessId);
  const removeMutation = useRemoveStaffMembershipMutation(context.businessId);
  const changeRoleMutation = useChangeStaffMembershipRoleMutation(context.businessId);

  // The viewer's own live role for this Business — derived from already-
  // fetched accessible-businesses data (no new backend contract). Unknown
  // (still loading, error, or no membership) renders no management
  // controls; server authorization remains mandatory regardless.
  const myRole = accessibleQuery.data?.find(
    (business) => business.businessId === context.businessId,
  )?.role;
  const canManageLifecycle = myRole === "owner" || myRole === "manager";
  const canChangeRole = myRole === "owner";

  const [inviteOpen, setInviteOpen] = useState(false);
  const [confirmRevokeId, setConfirmRevokeId] = useState<string | null>(null);
  const [confirmLifecycle, setConfirmLifecycle] = useState<{
    membershipId: string;
    action: "suspend" | "remove";
  } | null>(null);
  const [copiedInviteId, setCopiedInviteId] = useState<string | null>(null);

  const inviteButtonRef = useRef<HTMLButtonElement>(null);
  const wasInviteOpenRef = useRef(false);
  useEffect(() => {
    if (wasInviteOpenRef.current && !inviteOpen) {
      inviteButtonRef.current?.focus();
    }
    wasInviteOpenRef.current = inviteOpen;
  }, [inviteOpen]);

  const revokeButtonRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const lastConfirmRevokeIdRef = useRef<string | null>(null);
  useEffect(() => {
    if (lastConfirmRevokeIdRef.current && !confirmRevokeId) {
      revokeButtonRefs.current[lastConfirmRevokeIdRef.current]?.focus();
    }
    lastConfirmRevokeIdRef.current = confirmRevokeId;
  }, [confirmRevokeId]);

  if (membershipsQuery.status === "pending" || invitationsQuery.status === "pending") {
    return (
      <section>
        <h1 className="mb-1 text-xl font-semibold">{t("teamManagement.title")}</h1>
        <p>{t("teamManagement.loading")}</p>
      </section>
    );
  }

  if (membershipsQuery.status === "error" || invitationsQuery.status === "error") {
    return (
      <section>
        <h1 className="mb-1 text-xl font-semibold">{t("teamManagement.title")}</h1>
        <div role="alert" className="rounded-md border border-[var(--color-border)] p-4">
          <h2 className="mb-1 font-semibold">{t("teamManagement.readError.title")}</h2>
          <p className="mb-3 text-sm">{t("teamManagement.readError.body")}</p>
          <Button
            type="button"
            onClick={() => {
              membershipsQuery.refetch();
              invitationsQuery.refetch();
            }}
          >
            {t("actions.retry")}
          </Button>
        </div>
      </section>
    );
  }

  const memberships = membershipsQuery.data ?? [];
  const invitations = invitationsQuery.data ?? [];
  const activeMemberships = memberships.filter((membership) => membership.status === "active");
  const suspendedMemberships = memberships.filter(
    (membership) => membership.status === "suspended",
  );
  const removedMemberships = memberships.filter((membership) => membership.status === "removed");
  const otherMembers = memberships.filter((membership) => membership.role !== "owner");
  const pendingInvitations = invitations.filter((invitation) => invitation.status === "pending");

  const roleLabel: Record<string, string> = {
    owner: t("teamManagement.roleOwner"),
    manager: t("teamManagement.roleManager"),
    staff: t("teamManagement.roleStaff"),
  };
  const statusLabel: Record<string, string> = {
    active: t("teamManagement.statusActive"),
    suspended: t("teamManagement.statusSuspended"),
    removed: t("teamManagement.statusRemoved"),
    pending: t("teamManagement.statusPending"),
    accepted: t("teamManagement.statusAccepted"),
    revoked: t("teamManagement.statusRevoked"),
    expired: t("teamManagement.statusExpired"),
  };

  function handleInviteSubmit(
    role: string,
    deliveryType: "email" | "phone",
    deliveryValue: string,
  ) {
    createMutation.mutate(
      { role, deliveryTarget: { type: deliveryType, value: deliveryValue } },
      { onSuccess: () => setInviteOpen(false) },
    );
  }

  function handleRevokeConfirm(invitationId: string) {
    revokeMutation.mutate(invitationId, { onSuccess: () => setConfirmRevokeId(null) });
  }

  function handleLifecycleConfirm(membershipId: string) {
    if (!confirmLifecycle || confirmLifecycle.membershipId !== membershipId) return;
    const action = confirmLifecycle.action;
    const mutation = action === "suspend" ? suspendMutation : removeMutation;
    mutation.mutate(membershipId, { onSuccess: () => setConfirmLifecycle(null) });
  }

  function handleReactivate(membershipId: string) {
    reactivateMutation.mutate(membershipId);
  }

  function handleRoleApply(membershipId: string, fromRole: "manager" | "staff", toRole: string) {
    if (toRole !== "manager" && toRole !== "staff") return;
    if (toRole === fromRole) return;
    changeRoleMutation.mutate({ targetMembershipId: membershipId, fromRole, toRole });
  }

  function handleCopyInviteLink(invitation: StaffInvitationSummary) {
    const link = `${window.location.origin}/invitations/${invitation.invitationId}/accept`;
    setCopiedInviteId(null);
    void (async () => {
      try {
        await navigator.clipboard.writeText(link);
        setCopiedInviteId(invitation.invitationId);
      } catch {
        // Clipboard unavailable (permissions, insecure context) — leave
        // the link undisclosed rather than surfacing internals; the owner
        // can retry. No error UI: this is a convenience affordance, and
        // the invitation itself remains listed above.
      }
    })();
  }

  // Owner rows never carry controls (owner targets and self-actions are
  // never permitted server-side). A Manager viewer additionally sees
  // lifecycle controls on Staff rows only — Manager→manager targets are
  // never permitted, so no control is rendered for them.
  function lifecycleTargetPermitted(membership: StaffMembershipSummary): boolean {
    if (!canManageLifecycle) return false;
    if (membership.role === "owner") return false;
    if (myRole === "manager" && membership.role !== "staff") return false;
    return membership.status === "active" || membership.status === "suspended";
  }

  function roleChangePermitted(membership: StaffMembershipSummary): boolean {
    if (!canChangeRole) return false;
    return (
      (membership.role === "manager" || membership.role === "staff") &&
      membership.status === "active"
    );
  }

  const lifecyclePending =
    suspendMutation.isPending || reactivateMutation.isPending || removeMutation.isPending;

  return (
    <section>
      <h1 className="mb-1 text-xl font-semibold">{t("teamManagement.title")}</h1>
      <p className="mb-6 text-[var(--color-muted-foreground)]">{t("teamManagement.description")}</p>

      {!inviteOpen ? (
        <Button
          ref={inviteButtonRef}
          type="button"
          className="mb-6 min-h-11"
          onClick={() => setInviteOpen(true)}
        >
          {t("teamManagement.inviteAction")}
        </Button>
      ) : (
        <InviteForm
          onCancel={() => setInviteOpen(false)}
          onSubmit={handleInviteSubmit}
          isPending={createMutation.isPending}
          error={createMutation.error}
          roleLabel={roleLabel}
        />
      )}

      <h2 className="mb-3 font-semibold">{t("teamManagement.activeSectionTitle")}</h2>
      <ul className="mb-6 flex flex-col gap-2">
        {[...activeMemberships, ...suspendedMemberships, ...removedMemberships].map((membership) =>
          confirmLifecycle?.membershipId === membership.membershipId ? (
            <li
              key={membership.membershipId}
              className="rounded-md border border-[var(--color-border)] p-3 text-sm"
            >
              <p className="mb-2">
                {confirmLifecycle.action === "suspend"
                  ? t("teamManagement.confirmSuspendBody")
                  : t("teamManagement.confirmRemoveBody")}
              </p>
              <div className="flex gap-2">
                <Button
                  type="button"
                  disabled={lifecyclePending}
                  onClick={() => handleLifecycleConfirm(membership.membershipId)}
                >
                  {confirmLifecycle.action === "suspend"
                    ? t("teamManagement.confirmSuspendAction")
                    : t("teamManagement.confirmRemoveAction")}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  disabled={lifecyclePending}
                  onClick={() => setConfirmLifecycle(null)}
                >
                  {t("actions.cancel")}
                </Button>
              </div>
            </li>
          ) : (
            <MemberRow
              key={membership.membershipId}
              membership={membership}
              roleLabel={roleLabel}
              statusLabel={statusLabel}
              showLifecycle={lifecycleTargetPermitted(membership)}
              showRoleChange={roleChangePermitted(membership)}
              lifecyclePending={lifecyclePending}
              roleChangePending={changeRoleMutation.isPending}
              onSuspend={() =>
                setConfirmLifecycle({ membershipId: membership.membershipId, action: "suspend" })
              }
              onReactivate={() => handleReactivate(membership.membershipId)}
              onRemove={() =>
                setConfirmLifecycle({ membershipId: membership.membershipId, action: "remove" })
              }
              onRoleApply={(toRole) =>
                handleRoleApply(
                  membership.membershipId,
                  membership.role as "manager" | "staff",
                  toRole,
                )
              }
            />
          ),
        )}
        {otherMembers.length === 0 && (
          <li className="text-sm text-[var(--color-muted-foreground)]">
            {t("teamManagement.noOtherMembers")}
          </li>
        )}
      </ul>
      <MutationError error={suspendMutation.error} />
      <MutationError error={reactivateMutation.error} />
      <MutationError error={removeMutation.error} />
      <MutationError error={changeRoleMutation.error} />

      <h2 className="mb-3 font-semibold">{t("teamManagement.pendingSectionTitle")}</h2>
      <ul className="flex flex-col gap-2">
        {pendingInvitations.length === 0 && (
          <li className="text-sm text-[var(--color-muted-foreground)]">
            {t("teamManagement.noPendingInvitations")}
          </li>
        )}
        {pendingInvitations.map((invitation) =>
          confirmRevokeId === invitation.invitationId ? (
            <li
              key={invitation.invitationId}
              className="rounded-md border border-[var(--color-border)] p-3 text-sm"
            >
              <p className="mb-2">{t("teamManagement.confirmRevokeBody")}</p>
              <div className="flex gap-2">
                <Button
                  type="button"
                  disabled={revokeMutation.isPending}
                  onClick={() => handleRevokeConfirm(invitation.invitationId)}
                >
                  {t("teamManagement.confirmRevokeAction")}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  disabled={revokeMutation.isPending}
                  onClick={() => setConfirmRevokeId(null)}
                >
                  {t("actions.cancel")}
                </Button>
              </div>
            </li>
          ) : (
            <InvitationRow
              key={invitation.invitationId}
              invitation={invitation}
              roleLabel={roleLabel}
              statusLabel={statusLabel}
              copied={copiedInviteId === invitation.invitationId}
              onCopyLink={() => handleCopyInviteLink(invitation)}
              onRevoke={() => setConfirmRevokeId(invitation.invitationId)}
              revokeButtonRef={(el) => {
                revokeButtonRefs.current[invitation.invitationId] = el;
              }}
            />
          ),
        )}
      </ul>
      <MutationError error={revokeMutation.error} />
    </section>
  );
}

function MemberRow({
  membership,
  roleLabel,
  statusLabel,
  showLifecycle,
  showRoleChange,
  lifecyclePending,
  roleChangePending,
  onSuspend,
  onReactivate,
  onRemove,
  onRoleApply,
}: {
  membership: StaffMembershipSummary;
  roleLabel: Record<string, string>;
  statusLabel: Record<string, string>;
  showLifecycle: boolean;
  showRoleChange: boolean;
  lifecyclePending: boolean;
  roleChangePending: boolean;
  onSuspend: () => void;
  onReactivate: () => void;
  onRemove: () => void;
  onRoleApply: (toRole: string) => void;
}) {
  const { t } = useTranslation("business");
  const name = membership.displayName ?? t("teamManagement.unnamedMember");
  return (
    <li className="flex flex-col gap-2 rounded-md border border-[var(--color-border)] p-3 text-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-medium">{name}</p>
          <p className="text-[var(--color-muted-foreground)]">
            {roleLabel[membership.role] ?? membership.role} ·{" "}
            {statusLabel[membership.status] ?? membership.status}
          </p>
        </div>
        {showLifecycle && (
          <div className="flex gap-2">
            {membership.status === "active" && (
              <button
                type="button"
                className="min-h-11 px-2 text-sm text-red-600 underline"
                disabled={lifecyclePending}
                onClick={onSuspend}
              >
                {t("teamManagement.suspend")}
              </button>
            )}
            {membership.status === "suspended" && (
              <button
                type="button"
                className="min-h-11 px-2 text-sm underline"
                disabled={lifecyclePending}
                onClick={onReactivate}
              >
                {t("teamManagement.reactivate")}
              </button>
            )}
            {(membership.status === "active" || membership.status === "suspended") && (
              <button
                type="button"
                className="min-h-11 px-2 text-sm text-red-600 underline"
                disabled={lifecyclePending}
                onClick={onRemove}
              >
                {t("teamManagement.remove")}
              </button>
            )}
          </div>
        )}
      </div>
      {showRoleChange && (
        <RoleChangeForm
          membershipId={membership.membershipId}
          currentRole={membership.role}
          roleLabel={roleLabel}
          isPending={roleChangePending}
          onApply={onRoleApply}
        />
      )}
    </li>
  );
}

function RoleChangeForm({
  membershipId,
  currentRole,
  roleLabel,
  isPending,
  onApply,
}: {
  membershipId: string;
  currentRole: string;
  roleLabel: Record<string, string>;
  isPending: boolean;
  onApply: (toRole: string) => void;
}) {
  const { t } = useTranslation("business");
  const [toRole, setToRole] = useState(currentRole);
  return (
    <div className="flex items-center gap-2">
      <Select
        id={`teamRole-${membershipId}`}
        label={t("teamManagement.newRoleLabel")}
        value={toRole}
        onChange={setToRole}
        options={[
          { value: "staff", label: roleLabel["staff"] ?? "staff" },
          { value: "manager", label: roleLabel["manager"] ?? "manager" },
        ]}
      />
      <Button
        type="button"
        className="min-h-11"
        disabled={isPending || toRole === currentRole}
        onClick={() => onApply(toRole)}
      >
        {t("teamManagement.changeRoleAction")}
      </Button>
    </div>
  );
}

function InvitationRow({
  invitation,
  roleLabel,
  statusLabel,
  copied,
  onCopyLink,
  onRevoke,
  revokeButtonRef,
}: {
  invitation: StaffInvitationSummary;
  roleLabel: Record<string, string>;
  statusLabel: Record<string, string>;
  copied: boolean;
  onCopyLink: () => void;
  onRevoke: () => void;
  revokeButtonRef: (el: HTMLButtonElement | null) => void;
}) {
  const { t } = useTranslation("business");
  const identity = invitation.email ?? t("teamManagement.invitationSentFallback");
  return (
    <li className="flex items-center justify-between rounded-md border border-[var(--color-border)] p-3 text-sm">
      <div>
        <p className="font-medium">{identity}</p>
        <p className="text-[var(--color-muted-foreground)]">
          {roleLabel[invitation.role] ?? invitation.role} ·{" "}
          {statusLabel[invitation.status] ?? invitation.status}
        </p>
        {copied && (
          <p className="text-[var(--color-muted-foreground)]">
            {t("teamManagement.inviteLinkCopied")}
          </p>
        )}
      </div>
      <div className="flex gap-2">
        <button type="button" className="min-h-11 px-2 text-sm underline" onClick={onCopyLink}>
          {t("teamManagement.copyInviteLink")}
        </button>
        <button
          ref={revokeButtonRef}
          type="button"
          className="min-h-11 px-2 text-sm text-red-600 underline"
          onClick={onRevoke}
        >
          {t("teamManagement.revoke")}
        </button>
      </div>
    </li>
  );
}

function InviteForm({
  onCancel,
  onSubmit,
  isPending,
  error,
  roleLabel,
}: {
  onCancel: () => void;
  onSubmit: (role: string, deliveryType: "email" | "phone", deliveryValue: string) => void;
  isPending: boolean;
  error: unknown;
  roleLabel: Record<string, string>;
}) {
  const { t } = useTranslation("business");
  const [deliveryType, setDeliveryType] = useState<"email" | "phone">("email");
  const [deliveryValue, setDeliveryValue] = useState("");
  const [role, setRole] = useState<string>("staff");

  return (
    <div className="mb-6 flex flex-col gap-4 rounded-md border border-[var(--color-border)] p-4">
      <Select
        id="teamInviteDeliveryType"
        label={t("teamManagement.deliveryTypeLabel")}
        value={deliveryType}
        onChange={(value) => setDeliveryType(value as "email" | "phone")}
        options={[
          { value: "email", label: t("teamManagement.emailLabel") },
          { value: "phone", label: t("teamManagement.phoneLabel") },
        ]}
      />
      <TextField
        id="teamInviteDeliveryValue"
        label={
          deliveryType === "email" ? t("teamManagement.emailLabel") : t("teamManagement.phoneLabel")
        }
        value={deliveryValue}
        onChange={setDeliveryValue}
        type={deliveryType === "email" ? "email" : "tel"}
      />
      <Select
        id="teamInviteRole"
        label={t("teamManagement.roleLabel")}
        value={role}
        onChange={setRole}
        options={INVITATION_ROLE_OPTIONS.map((value) => ({ value, label: roleLabel[value] }))}
      />
      <div className="flex gap-2">
        <Button
          type="button"
          className="min-h-11"
          disabled={!deliveryValue || isPending}
          onClick={() => onSubmit(role, deliveryType, deliveryValue)}
        >
          {t("teamManagement.sendInvitation")}
        </Button>
        <Button type="button" variant="secondary" onClick={onCancel} disabled={isPending}>
          {t("actions.cancel")}
        </Button>
      </div>
      <MutationError error={error} />
    </div>
  );
}
