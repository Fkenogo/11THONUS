/** Optional Staff-invitation step (design §11/§12/Phase N). Always skippable; "Team members"/"Invitations", never raw backend terms. */

import { useState } from "react";
import { useTranslation } from "../../../i18n";
import { Button, Select, TextField } from "../../../components/ui/formPrimitives";
import { useStaffInvitationsQuery } from "../../hooks/businessQueries";
import {
  useCreateStaffInvitationMutation,
  useRevokeStaffInvitationMutation,
} from "../../hooks/businessMutations";
import type { BusinessContext } from "../../api/businessContext";
import { MutationError } from "../MutationError";

export function TeamStep({
  context,
  onContinue,
}: {
  context: BusinessContext;
  onContinue: () => void;
}) {
  const { t } = useTranslation("business");
  const statusLabel: Record<string, string> = {
    invited: t("team.statusInvited"),
    accepted: t("team.statusAccepted"),
    revoked: t("team.statusRevoked"),
    expired: t("team.statusExpired"),
  };
  const invitationsQuery = useStaffInvitationsQuery(context.businessId);
  const createMutation = useCreateStaffInvitationMutation(context.businessId);
  const revokeMutation = useRevokeStaffInvitationMutation(context.businessId);
  const [deliveryType, setDeliveryType] = useState<"email" | "phone">("email");
  const [deliveryValue, setDeliveryValue] = useState("");
  const [role, setRole] = useState("staff");

  function handleInvite() {
    createMutation.mutate(
      { role, deliveryTarget: { type: deliveryType, value: deliveryValue } },
      { onSuccess: () => setDeliveryValue("") },
    );
  }

  return (
    <section>
      <h2 className="mb-4 text-lg font-semibold">{t("team.title")}</h2>
      <p className="mb-4 text-sm text-[var(--color-muted-foreground)]">{t("team.description")}</p>

      <div className="mb-6 flex flex-col gap-4">
        <Select
          id="deliveryType"
          label={t("team.roleLabel")}
          value={deliveryType}
          onChange={(value) => setDeliveryType(value as "email" | "phone")}
          options={[
            { value: "email", label: t("team.emailLabel") },
            { value: "phone", label: t("team.phoneLabel") },
          ]}
        />
        <TextField
          id="deliveryValue"
          label={deliveryType === "email" ? t("team.emailLabel") : t("team.phoneLabel")}
          value={deliveryValue}
          onChange={setDeliveryValue}
        />
        <TextField id="role" label={t("team.roleLabel")} value={role} onChange={setRole} />
        <Button
          type="button"
          disabled={!deliveryValue || createMutation.isPending}
          onClick={handleInvite}
        >
          {t("team.invite")}
        </Button>
        <MutationError error={createMutation.error} />
      </div>

      <ul className="mb-6 flex flex-col gap-2">
        {(invitationsQuery.data ?? []).length === 0 && (
          <li className="text-sm text-[var(--color-muted-foreground)]">
            {t("team.noInvitations")}
          </li>
        )}
        {(invitationsQuery.data ?? []).map((invitation) => (
          <li key={invitation.invitationId} className="flex items-center justify-between text-sm">
            <span>
              {invitation.role} — {statusLabel[invitation.status] ?? invitation.status}
            </span>
            {invitation.status === "invited" && (
              <button
                type="button"
                className="text-red-600 underline"
                onClick={() => revokeMutation.mutate(invitation.invitationId)}
              >
                {t("team.revoke")}
              </button>
            )}
          </li>
        ))}
      </ul>
      <MutationError error={revokeMutation.error} />

      <div className="flex gap-2">
        <Button type="button" variant="secondary" onClick={onContinue}>
          {t("actions.skip")}
        </Button>
        <Button type="button" onClick={onContinue}>
          {t("actions.continue")}
        </Button>
      </div>
    </section>
  );
}
