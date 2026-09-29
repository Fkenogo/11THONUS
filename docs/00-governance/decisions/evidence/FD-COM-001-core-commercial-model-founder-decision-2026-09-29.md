> **Title:** FD-COM-001 — 11thONUS Core Commercial Model (Founder Decision)  
> **Version:** 1.0 · **Status:** **APPROVED — Founder reconfirmation recorded** · **Classification:** Founder decision (governance record)  
> **Governing documents:** 11thONUS Platform Constitution; [Decision Register](../decision-register.md) — recorded as **`DEC-SUB-014`**, Status **CONFIRMED**  
> **Source-of-truth path:** `docs/00-governance/decisions/evidence/FD-COM-001-core-commercial-model-founder-decision-2026-09-29.md`  
> **Decision date:** 2026-09-29 · **Authority:** Founder · **Scope:** Core Phase 1 business monetisation model  
> **Scope of this record:** Governance/documentation only. No application implementation, schema, migration, payment integration, Operator Console build or Experience Assembly is authorized by this record.

# FD-COM-001 — 11thONUS Core Commercial Model (Founder Decision)

## 1. Status and provenance of this record

This is the **canonical, prospective** record of the Founder's commercial decision, reconfirmed on 2026-09-29 and recorded as `DEC-SUB-014` in the [Decision Register](../decision-register.md).

**Provenance correction (important).** A prior, unmerged candidate package bearing the same `FD-COM-001` label existed only as untracked files in a contaminated local working tree. It was never committed, reviewed, merged, or entered into the Decision Register, and it self-certified a Decision Register entry (`DEC-SUB-014`) that did not and never existed in any branch. The [`FD-COM-001-REC-ASSESS-001` recovery assessment](../../../05-implementation/reports/FD-COM-001-REC-ASSESS-001-commercial-authority-recovery-and-provenance-assessment-2026-09-29.md) established that provenance was insufficient. That candidate package is **not** historical authority and is **not** adopted here.

Accordingly, this record is a **new, current Founder decision** — not a restoration of a prior canonical one. One report on `main` (`11THONus-CF-001`) described the consumption-first model as already "settled"; that statement is corrected by [§12](#12-authority-chain-correction) and by the dated addendum recorded against that report.

## 2. Consumption-first commercial model

11thONUS charges businesses **based on consumption**.

**Subscription tiers do not govern the commercial model.** The billable commercial unit corresponds to the governed 10 qualifying-unit earning side of the 10+1 loyalty Circle.

**Governed commercial price: USD 2 equivalent per commercial unit.**

This USD 2 equivalent price **supersedes** any earlier proposed, candidate, prototype, draft or otherwise non-canonical **USD 1** equivalent price. **USD 1 must not be preserved, recorded or carried forward as a current or alternative commercial price.** No such price was ever canonical, so there is no canonical value to migrate; the USD 1 figure exists only in non-canonical candidate and frozen-prototype material (see §11).

**Subscription tiers remain deferred.** No Starter/Growth/Professional or equivalent capability tiering governs Phase 1.

### 2.1 Conceptual separation from loyalty mechanics (governing constraint)

The commercial unit and the loyalty mechanics are **conceptually distinct** and this distinction is governing:

- The **loyalty engine** governs the earning and reward lifecycle — Verified Units, Loyalty Cycles, Rewards and redemption.
- The **commercial model** uses completion/consumption of the governed earning unit as its **billing basis** only.

**Commercial billing logic is never authoritative over loyalty state.** A commercial event must not create, cancel, rewrite or re-interpret loyalty state. Any implementation that lets a commercial concern mutate loyalty truth is non-conformant with this decision.

## 3. Trial

A new business may receive a **free trial allowance of 3–5 commercial units**. **3–5 is the governed range.**

**There is no universal default of 5 established by this decision.** The Platform Administrator may determine the allowance within that range for onboarding and pilot operation.

> This resolves `DEC-SUB-003` (Trial structure) for the consumption-first model. The frozen Experience Reference demonstrates 5 units; that is illustrative prototype scaffolding and is **not** a governed default (see §11).

## 4. Commercial capacity

Commercial credit/capacity governs whether **new** loyalty Circles may start.

When **usable commercial capacity is exhausted, new Circle starts are blocked.**

This must **not** be reinterpreted as cancelling existing loyalty state. Capacity governs entry into new cycles; it does not govern the content or validity of cycles already in progress.

## 5. Grace

A Circle that was **already active** when commercial capacity became exhausted **may finish**.

Commercial restriction must never strand a customer partway through an already-started Circle.

**Grace permits completion of existing Circles. Grace does not create unlimited capacity for new Circles.**

## 6. Negative credit

Commercial credit **may become negative as a recoverable balance**. Subsequent settlement or credit may restore the balance.

**No maximum negative balance and no hard negative floor is established by this decision.**

**This rule is complete and governed. A negative-credit limit is NOT an outstanding or unresolved Product Truth requirement of the current commercial model** — the absence of a limit is itself the governed position. Risk controls or limits, if proposed later, would constitute a **new, separate Founder governance decision**, and must not be treated as a prerequisite for, or a blocker on, this model. No limit is invented by this decision. Accordingly, a Consumption Unit commercial ledger built under this decision must support a negative balance and owes no maximum-balance concept.

## 7. Earned-reward preservation

Commercial restriction must **never**:

- cancel an earned Reward;
- prevent legitimate redemption of an already-earned Reward;
- destroy loyalty history.

**This references existing authority rather than duplicating it.** Customer protection is already governed by **`DEC-LOY-011`** (Reward redemption during business suspension — CONFIRMED, resolved 2026-08-29: redeemable by default during suspension, subject to governed exceptions) and **PRD06 §5** ("Outstanding rewards remain redeemable"). `DEC-SUB-014` introduces **no new or redefined loyalty Product Truth**; it makes the existing protection explicit on the **commercial** axis and defers to the loyalty axis as the authority.

## 8. Manual launch commercial administration

**Automated payment integration is not required for launch.** Until payment integration is introduced, the Platform Administrator may **manually administer commercial standing**.

Authorised operational capabilities:

1. grant a trial allowance within the governed **3–5** range;
2. adjust the remaining trial allowance where governed operational handling requires it;
3. record an offline/manual settlement or payment reference;
4. add or adjust commercial credit;
5. activate paid service after appropriate commercial confirmation;
6. restrict commercial service according to governed commercial standing;
7. restore commercial service after settlement or correction;
8. inspect commercial standing and commercial history.

**All commercial mutations must be attributable and auditable.**

### 8.1 Boundary — what these powers do NOT authorise

These powers concern **platform commercial administration** only. They do **not** authorise the Platform Administrator to:

- operate a Business's loyalty programme;
- record purchases on behalf of the Business;
- approve Business transactions merely by being Platform Administrator;
- redeem customer Rewards;
- alter customer loyalty history;
- override Business permissions;
- modify governed loyalty state outside explicitly authorised support/correction processes.

This boundary is consistent with `DEC-LOY-018` D-2 (Platform Administrator receives **no** default redemption authority) and `DEC-LOY-017` (Platform Administrator receives no routine authority over a Business's Qualifying Items).

## 9. Platform Administrator model

**At launch the Founder is the sole Platform Administrator.**

**No differentiated Platform Administrator roles or RBAC are created by this decision.** Additional Platform Administrators may be introduced later **only** after their roles, permissions and separation-of-duty requirements are explicitly defined and approved. The broader question of which of the TRD18 §18.5 roles exist at launch remains open under `DEC-GOV-007` and is **unchanged** by this decision.

## 10. Separation of duty

This decision **does not redefine** `DEC-GOV-011` or any other established separation-of-duty rule. Where a commercial action would require separation of duty, **existing governance applies**. The Knowledge Studio self-approval-separation principle (`DEC-GOV-011`) is referenced, not redefined.

## 11. Price reconciliation and the frozen Experience Reference

**Canonical documentation inventory (verified 2026-09-29).** A full text search of canonical `docs/` found **no current governing document carrying a USD 1 consumption price**. TRD17 never fixed a unit price (it defers prices to the commercial plan catalogue, §17.7/§17.9). Therefore no canonical price required amendment, and none was altered.

| Location of a USD 1 figure | Class | Disposition |
|---|---|---|
| Untracked candidate FD-COM-001 package (§3, §5) | **Non-canonical** | Not adopted, not canonicalised. Superseded by USD 2 |
| Frozen Experience Reference `Fkenogo/11thonus-prototype` @ `18e8d700` (`unitAmountUSD: 1.0`, credit-balance demos) | **PROTOTYPE-ONLY scaffolding** | **Not modified** (frozen, adopted experience architecture). Not Product Truth |
| `FD-COM-001-REC-ASSESS-001` recovery assessment | **Historical record** | Preserved unchanged; it correctly recorded USD 1 as *never proven* |
| `IMPLEMENTATION_CHANGES.md` / `documentation-changes-log.md` prior entries | **Historical record** | Preserved unchanged |

**Binding implication for Experience Assembly.** The Experience Reference governs **experience architecture, not commercial pricing semantics**. Production Experience Assembly **must bind** any illustrative commercial value it encounters — including the prototype's `$1.00` unit and 5-unit trial display — to the governed **USD 2 equivalent** price and the governed **3–5** trial range. The prototype's `$1` is **not** a reason to alter Product Truth.

## 12. Authority-chain correction

`11THONus-CF-001` (Cloudflare capability & architecture alignment assessment, on `main`) lists, under "SETTLED", "Consumption-first commercial model (`FD-COM-001` / `DEC-SUB-014`)". At that report's date (2026-09-19) **no such decision was canonical**; the cited `DEC-SUB-014` did not exist in the Decision Register. A dated provenance correction has been appended to that report. The authority is now established by **this** Founder reconfirmation (2026-09-29), not by the original CF-001 assessment date.

## 13. Required next action

No implementation may begin under this decision until a **separate, explicit Founder/Technical Lead implementation authorization** is recorded. Required before implementation: a Consumption Unit commercial data architecture, the cycle-completion → consumption-event binding, a cycle-start capacity gate, the commercial ledger (including negative balance), the manual-administration command surface with audit, and TRD17 supersession drafting. This decision authorises **none** of that work.

## 14. Scope boundary — what this decision deliberately does not decide

Recorded 2026-09-29 (`FD-COM-001-CORR-002`) for clarity, adding no rule.

- **Commercial credit/capacity ownership and representation are NOT decided by this decision.** Whether commercial credit/capacity is owned and represented per Business, per Owner, or by another arrangement is a **COMMERCIAL DESIGN question** carried to `11THONUS-COMMERCIAL-DESIGN-001`, to be determined from the governed commercial model. It is **not** an unresolved Product Truth decision requiring a further Founder decision, unless the design assessment finds that the available alternatives would materially change Product Truth.
- **Local-currency derivation/conversion is NOT decided by this decision.** How the governed **USD 2 equivalent** becomes operational **BIF/RWF** values — equivalent determination, administrative versus FX-derived, effective dates, rounding, and price-adjustment governance — is a bounded **COMMERCIAL DESIGN question** carried to `11THONUS-COMMERCIAL-DESIGN-001`. Launch-market scope is **Burundi and Rwanda** and is not expanded here.
- **Complimentary commercial arrangements are NOT decided by this decision.** The governed 3–5 commercial-unit trial in §3 is the standard launch onboarding allowance and is **not** a complimentary commercial arrangement. Whether 11thONUS may later provide a complimentary arrangement or capacity for pilot businesses, partners, promotions, or other exceptional commercial programmes remains the **open** `DEC-SUB-013` decision, which this decision deliberately does **not** supersede.
