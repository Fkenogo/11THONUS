/**
 * Package F — Team Management screen (MGMT-01/DASH-04, `ENG-P3-002-UI-IMP-F`, per
 * `ENG-P3-002-UI-RECON-001` Part XV Package F, `FD-P3-002-G-001`, `FD-IDENTITY-DISPLAY-001`).
 * Displays exactly what the now-complete Staff transport (`ENG-P3-002-UI-IMP-G-COMPLETION`)
 * provides — `displayName` for active members, `email` for email-delivery pending invitations —
 * through the existing, unchanged `listStaffMemberships`/`listStaffInvitations`/
 * `createStaffInvitation`/`revokeStaffInvitation` callables. No new backend contract.
 *
 * Deliberately excludes everything the Team Stitch mockups show but no callable or Founder
 * disposition authorizes: a per-member "more menu" (role edit/removal — no such callable
 * exists), a "Resend" action (no such callable exists), and the invite form's invented
 * "Admin"/"Editor" roles with fabricated capability descriptions (the real, closed-enum
 * invitation role vocabulary is `manager`/`staff`, per `invitationRole.ts`). A missing
 * `displayName` renders a neutral "Unnamed team member" state — never a fabricated name, never
 * a raw `membershipId`/`userId` (`FD-IDENTITY-DISPLAY-001` §14 explicitly assigns this fallback
 * wording to the consuming UI package).
 */

import { useEffect, useRef, useState } from "react";
import { useTranslation } from "../../i18n";
import { Button, Select, TextField } from "../../components/ui/formPrimitives";
import { useStaffInvitationsQuery, useStaffMembershipsQuery } from "../hooks/businessQueries";
import {
  useCreateStaffInvitationMutation,
  useRevokeStaffInvitationMutation,
} from "../hooks/businessMutations";
import { MutationError } from "../onboarding/MutationError";
import type { BusinessContext } from "../api/businessContext";
import type { StaffInvitationSummary, StaffMembershipSummary } from "../api/staffLists";

const INVITATION_ROLE_OPTIONS = ["staff", "manager"] as const;

export function TeamManagementPage({ context }: { context: BusinessContext }) {
  const { t } = useTranslation("business");
  const membershipsQuery = useStaffMembershipsQuery(context.businessId);
  const invitationsQuery = useStaffInvitationsQuery(context.businessId);
  const createMutation = useCreateStaffInvitationMutation(context.businessId);
  const revokeMutation = useRevokeStaffInvitationMutation(context.businessId);

  const [inviteOpen, setInviteOpen] = useState(false);
  const [confirmRevokeId, setConfirmRevokeId] = useState<string | null>(null);

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
  const otherMembers = activeMemberships.filter((membership) => membership.role !== "owner");
  const pendingInvitations = invitations.filter((invitation) => invitation.status === "invited");

  const roleLabel: Record<string, string> = {
    owner: t("teamManagement.roleOwner"),
    manager: t("teamManagement.roleManager"),
    staff: t("teamManagement.roleStaff"),
  };
  const statusLabel: Record<string, string> = {
    active: t("teamManagement.statusActive"),
    invited: t("teamManagement.statusPending"),
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
        {activeMemberships.map((membership) => (
          <MemberRow
            key={membership.membershipId}
            membership={membership}
            roleLabel={roleLabel}
            statusLabel={statusLabel}
          />
        ))}
        {otherMembers.length === 0 && (
          <li className="text-sm text-[var(--color-muted-foreground)]">
            {t("teamManagement.noOtherMembers")}
          </li>
        )}
      </ul>

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
}: {
  membership: StaffMembershipSummary;
  roleLabel: Record<string, string>;
  statusLabel: Record<string, string>;
}) {
  const { t } = useTranslation("business");
  const name = membership.displayName ?? t("teamManagement.unnamedMember");
  return (
    <li className="flex items-center justify-between rounded-md border border-[var(--color-border)] p-3 text-sm">
      <div>
        <p className="font-medium">{name}</p>
        <p className="text-[var(--color-muted-foreground)]">
          {roleLabel[membership.role] ?? membership.role} ·{" "}
          {statusLabel[membership.status] ?? membership.status}
        </p>
      </div>
    </li>
  );
}

function InvitationRow({
  invitation,
  roleLabel,
  statusLabel,
  onRevoke,
  revokeButtonRef,
}: {
  invitation: StaffInvitationSummary;
  roleLabel: Record<string, string>;
  statusLabel: Record<string, string>;
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
      </div>
      <button
        ref={revokeButtonRef}
        type="button"
        className="min-h-11 px-2 text-sm text-red-600 underline"
        onClick={onRevoke}
      >
        {t("teamManagement.revoke")}
      </button>
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
