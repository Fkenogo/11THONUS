# 11thONUS — Founder Development & Preview Workflow Alignment

**Status:** Founder Direction Recorded  
**Effective date:** 11 September 2026  
**Authority:** Founder  
**Scope:** Development workflow, Founder product review, hosted preview use, review proportionality

## 1. Decision

11thONUS adopts a **local-first Founder review workflow** for active development.

Routine Founder product review is part of the development loop and does not require a Firebase Hosting preview, dedicated cloud environment, or other hosted deployment unless hosting itself is under test or remote access is materially required.

GitHub remains the canonical repository. Product-facing changes should be made reviewable from a committed repository state locally where practical.

## 2. Default loop

1. implement the authorised bounded change;
2. run the appropriate automated/local validation, including emulator-backed validation where relevant;
3. commit and push the change to GitHub;
4. run the committed state locally for Founder product review when the change materially affects behaviour or UI;
5. address material Founder feedback;
6. continue the authorised programme.

Existing Firebase Emulator Suite and local browser validation paths are valid tools for this purpose.

## 3. Hosted preview disposition

Existing hosted Founder-QA/preview capability is retained for deployment-relevant use. It is not the default prerequisite for normal Founder review.

Hosted environments are appropriate for:

- deployment or pre-pilot readiness;
- hosted integration behaviour;
- remote/external review;
- validation that specifically depends on real hosted services;
- explicit Founder instruction.

This workflow direction does not require removal of existing hosted-preview code or infrastructure.

## 4. Architecture boundary

This record does not alter current authentication-architecture authority, AUTH-ARCH-003, PostgreSQL direction, provider qualification, Firebase state, MFA requirements, or security decisions.

The current architectural principle remains that provider choices should not unnecessarily own 11thONUS domain authority. Identity/provider integration should remain behind the approved application boundaries and replacement-provider decisions remain separately governed.

## 5. Review proportionality

Review depth must be proportional to consequence.

Independent/high-rigor review remains appropriate for material security boundaries, authentication/authorization, irreversible migrations, authoritative commercial/accounting logic, legal/security controls, production infrastructure and major architecture changes.

Routine UI work, bounded reversible corrections, copy/localisation changes, local-preview enablement and other low-risk implementation work should not automatically receive the same governance treatment.

Governance exists to protect material decisions and risks; it should not become the development objective itself.

## 6. Effect

Any earlier project practice whose practical effect is that the Founder cannot review ordinary development until a hosted environment has been provisioned is superseded by this workflow direction.

Production, pilot and customer-data controls remain unchanged and apply when those environments are actually used.
