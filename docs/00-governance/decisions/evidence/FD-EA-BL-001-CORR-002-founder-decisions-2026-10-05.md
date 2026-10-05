> **Title:** FD-EA-BL-001-CORR-002 — Founder Decisions for Prototype-Fidelity Assembly
> **Date:** 2026-10-05 · **Approved by:** Founder · **Classification:** Working (Founder decision evidence)
> **Source:** Explicit Founder instruction in task `11THONUS — EA-BL-001-CORR-002 Founder Decision Incorporation & Prototype-Fidelity Implementation Plan`.
> **Decision Register representation:** `DEC-PROD-015`.
> **Scope:** Product/experience direction only. No production implementation, schema, migration, deployment, or package execution authority is granted by this evidence record. Implementation remains gated by the Master Workflow and Engineering Implementation Programme.

# Founder decisions

## 1. Verified and pending progress

Customer verification remains mandatory before a purchase contributes to official loyalty progress or reward eligibility. Verified Units are official earned progress. Business-recorded purchases awaiting customer verification may appear as distinct Pending Units in the Circle. Pending Units do not count toward eligibility. A Reward becomes available only when the governed number of Verified Units has been earned. Customer-facing copy should explain the distinction plainly, for example “8 verified + 1 waiting for confirmation.” The prototype's approved/pending visual distinction is preserved with these meanings.

## 2. Business review before customer verification

Preserve the operational Owner/authorised Manager review experience as a separate gate. If the governed Business review threshold/rule does not trigger, a Business-recorded purchase proceeds to customer verification. If it triggers, the record enters Business Review Required. An authorised Owner/Manager approval proceeds to customer verification; rejection does not proceed. Business approval never creates Verified Units, advances official Circle progress, unlocks rewards, or substitutes for customer verification.

For MVP, support a bounded configurable quantity threshold where consistent with the existing model. Preserve auditability and correction/rejection evidence. Do not invent approval authorities or fraud rules. `DEC-LOY-003` remains authoritative for multiple quantities and non-automatic rejection; its former statement that thresholds are visibility-only is superseded only as to the approved Business-review gate semantics by `DEC-PROD-015`.

## 3. Staff-assisted customer self-registration

Staff may not create synthetic Customer identities or credentials, bypass Customer consent/authentication, or own a Customer account. Preserve the fast counter journey through a customer-controlled registration path: Customer not found → Staff offers help joining → Customer completes their own registration/verification → canonical 11thONUS identity is issued → transaction continues using that identity. Use an existing safe QR, link, or handoff mechanism if one exists. If a new mechanism requires a Product Truth or security decision, stop for that decision.

## 4. Redemption confirmer display

The authenticated individual confirmer remains recorded internally for audit and Business operations. The MVP Customer experience does not display the individual's name. It may show completion, Business, reward details, and date/time where supported. This narrows the prototype's optional confirmer presentation and does not change the authenticated confirmer or redemption authority.

## 5. Authority and implementation boundary

These decisions are approved on 2026-10-05. They resolve the four Founder decision items listed in the Prototype → Production Binding Matrix for `EA-BL-001-CORR-002`. They do not by themselves register or authorize the execution work packages for Slices A–E. The plan report identifies the records that must be reconciled before implementation. No production code or architecture change is authorized by this evidence record.
