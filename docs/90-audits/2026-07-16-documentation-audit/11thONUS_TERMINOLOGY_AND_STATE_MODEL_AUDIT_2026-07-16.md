# 11thONUS Terminology and State-Model Audit

**Audit date:** 16 July 2026
**Rule:** Recommendations only — no source document has been edited. Canonical recommendations follow the TRD Consolidation Audit (§3, §7) and TRD23 (§23.9), tested here against the entire suite including root documents and PRDs.

---

## PART A — Canonical Terminology Recommendations

| Concept | Recommended canonical term | UI term (customer-facing) | Notes |
|---|---|---|---|
| Product category | Customer-Verified Loyalty Platform | — | "Cloud-based" only as technical delivery descriptor |
| Long-term direction | Verified Commerce™ | — | Never an MVP deliverable label |
| Loyalty offering | Reward Program | Reward Program / business display name | Replaces "loyalty product", "loyalty item", "listing" |
| Purchase entity | Purchase Record | Purchase | Not proof of payment |
| Progress unit | Verified Unit | Progress ("7 of 10") | Immutable credit/reversal, never a mutable balance |
| Earning container | Loyalty Cycle | (not exposed) | One active or reward-available per customer+program |
| Reward experience | On Us Moment | "Your next one is on us" etc. | Engineering: reward entitlement / redemption |
| Consumer | Customer | — | Replaces "shopper", "consumer", "participant" |
| Paying entity | Business | — | Replaces "vendor", "merchant" |
| Roles | Owner / Manager / Staff Member / Customer / Platform Super Administrator | — | TRD18 sub-admin roles are administration-internal |
| Identity code | Loyalty number (+ QR code) | Loyalty number | Replaces "customer code", "shopper_code", "vendor_code" |
| Event history | Trust Event (commercial), Administrative Audit Record (privileged), Security Log (technical) | History / Activity | Three distinct record classes (Consolidation Audit §5.5) |
| Threshold | requiredVerifiedUnits = 10 (MVP fixed) | "Every 11th, on us" | See DOC-P0-003 |
| Backend vocabulary | engine, ledger, lifecycle, state machine, event, token | **prohibited in customer copy** | TRD23 §23.9; TRD13 §13.11 |

## PART B — Terminology Conflict Table

| # | Term used | Location (file → section) | Conflicting canonical term | Recommended | Editorial or meaning-changing? |
|---|---|---|---|---|---|
| 1 | "Owner transactions are automatically approved" | Product Definition → Fraud Controls | Mandatory customer verification for all recorders | Label document superseded | **Meaning-changing (P0)** |
| 2 | vendor / shopper / punch / listing | 11THONUS-data-model.md (throughout) | business / customer / Purchase Record / Reward Program | Label superseded | **Meaning-changing (P0)** |
| 3 | redemption_threshold default 11, per-listing | data-model §3 | requiredVerifiedUnits = 10 fixed | Label superseded | **Meaning-changing (P0)** |
| 4 | "loyalty product" | PRD0 (throughout, PD-019), PRD1, PRD2, PRD3 §14, Product Definition | Reward Program | Normalize | Editorial in prose; **meaning-changing in plan limits** (see #5) |
| 5 | "active loyalty products" as plan limit basis | PRD0 §18.2–18.3, PRD3 §9–10, Product Definition → Subscription Plans | Active Reward Program limit | Adopt Reward Program basis (Consolidation Audit §11.1) | **Meaning-changing (P1)** |
| 6 | "approve / approval" for customer action | PRD0 §14.3, PRD1 §5.2, PRD2 §15 (buttons "Approve / Approve All") | verify / verification | Normalize engineering docs to "verify"; UI may keep "Approve" if chosen once | Editorial, but must be one choice |
| 7 | "cloud-based loyalty platform" | Product Definition (Exec Summary), PRD0 §3 | Customer-Verified Loyalty Platform | Normalize | Editorial |
| 8 | Bronze / Silver / Gold | Rules Studio → Subscription Plan Rules | Working labels Starter/Growth/Professional; final open (OPD-001) | Mark illustrative | **Meaning-changing if read as approved** (staff limits differ) |
| 9 | Entry / Mid / Advanced tier | PRD0 §18.3 | Working labels Starter/Growth/Professional | Mark as superseded working names | Editorial |
| 10 | "Trust Ledger" | PRD4 §21, PRD5 §5 | trustEvents (implementation), Trust Event (record) | Add glossary mapping | Editorial |
| 11 | "Reward Programme" / "programme" | PRD4 §3 et al. (British spelling) | Reward Program | Normalize spelling | Editorial |
| 12 | "Pending Customer Verification" / "Pending Verification" | PRD2 §12, PRD5 §12, Product Definition | Stored state `waiting_for_customer`; UI "Waiting for You" | Distinguish stored vs UI | Editorial with engineering impact |
| 13 | "Super Administrator" vs "Platform Super Administrator" vs "Super Admin" | PRD0 §15.5, PRD1 §9, PRD9 §17, PRD10 §4 | Platform Super Administrator | Normalize | Editorial |
| 14 | "code" vs "loyalty number" | PRD0 §15.1/§21.5 ("loyalty code"), PRD1 §3.5 | loyalty number | Normalize ("code" acceptable colloquially in customer copy if defined) | Editorial |
| 15 | "transaction" for Purchase Record | Product Definition (throughout), PRD1 §12.2 ("Transaction Management") | Purchase Record | Normalize; "transaction" only for atomic DB operations | Editorial, occasionally meaning-changing |
| 16 | "shopper" in behavior tag "Family Shopper" | CKS Part IX; TRD14 §601 | (tag label, not actor term) | Acceptable as tag name; note exception | Editorial note |
| 17 | "Verified Progress" | TRD22 §22.2, TRD23 §23.9 (business UI) | Verified Units (engineering) / Progress (customer UI) | Keep as business-UI explanatory term only | Editorial |
| 18 | "11thONUS" vs "11THONUS" vs "The 11th" | folder/file names; data-model title | 11thONUS | Normalize in documents | Editorial |
| 19 | Crashlytics + Tailwind asserted | Product Definition → Technology Platform | TRD22 Technical Foundation + OTD-001 (open) | Treat as historical | Editorial (potentially misleading) |
| 20 | "Approval Threshold", "Maximum staff approval quantity" | Product Definition → Fraud Controls | Bulk/Quantity Review Threshold (review, not approval) | Label superseded | **Meaning-changing** (implies business approval gate replacing customer verification) |

## PART C — Entity State Tables

Canonical column = TRD Consolidation Audit §7 unless noted. "Found variants" lists every state name encountered in the suite.

### C.1 User
| Canonical | Found variants | Conflict |
|---|---|---|
| pending, active, locked, suspended, closed, archived | PRD2 §7: Pending Verification, Active, Suspended, Locked, Closed, Archived; TRD10 users: pending/active/locked/suspended/closed (**no archived**) | Minor: TRD10 enum omits `archived`; PRD2 "Pending Verification" = UI label for `pending`. Terminal states clear (closed→archived). |

### C.2 Customer Profile
| TRD10: active, suspended, closed, archived | No PRD-level conflict | Note: no `locked` at profile level (lock lives on user) — acceptable if documented. |

### C.3 Business
| draft, pending_verification, trial, active, suspended, expired, closed, archived | PRD3 §4 identical (prose form) | **No conflict** — well aligned. Terminal: closed→archived. |

### C.4 Business Membership
| invited, active, suspended, removed | PRD1 §13 lifecycle (invitation→acceptance→activation→suspension→removal) | Aligned. `removed` is terminal; history preserved (BR-010). |

### C.5 Reward Program
| draft, active, paused, retired, archived | PRD4 §15, PRD6 §5 identical | **No conflict.** Missing transition detail: paused→retired vs paused→active both implied; retirement with outstanding rewards defined (PRD6 §5 "Outstanding rewards remain redeemable") — carry into transition table. |

### C.6 Purchase Record
| waiting_for_customer, verified, rejected, under_review, corrected, cancelled, expired, archived (8) | PRD5 §7 adds **Draft** and **Recorded** before waiting; PRD2 §14 lifecycle uses "Pending Customer Verification"; TRD10 matches canonical | **Conflict (DOC-P1-002):** Draft/Recorded are transient implementation moments, not stored states, per TRD. Decide: either canonicalize a `recorded` instant or declare PRD5 Draft/Recorded as non-persisted description. Terminal states: verified?, rejected, corrected, cancelled, expired → archived. Note: `verified` is terminal for the record but spawns Verified Units. Missing transition: expired→(customer late verification?) — PRD0 §14.5 "approval of older records" implies expiry must be recoverable or reminders must precede expiry; **undefined**, add to decisions. |

### C.7 Purchase Dispute
| open, business_review, resolved_verified, resolved_rejected | TRD10 identical; PRD5 "Under Review" is the Purchase Record's parallel state | Aligned. Future customer-review-of-replacement state noted in Consolidation Audit §7.6. |

### C.8 Verified Unit
| entryType: credit, reversal (no lifecycle states) | PRD4: "Pending Units / Rejected Units / Disputed Units" as unit vocabulary | **Clarification needed:** PRD4 speaks of pending/rejected "Units"; canonically only *verified* units exist as records — pending/rejected quantities live on Purchase Records. Also "pending allocation" units (overflow, TRD11 §11.21) need an explicit representation decision (part of OPD-006). |

### C.9 Loyalty Cycle
| active, reward_available, reward_redeemed, closed | PRD6 §14: **Current**, Reward Available, Reward Redeemed, Closed, **Historical** | **Conflict (DOC-P1-002):** Current=active (rename); Historical=closed (or archived view) — UI wording confused with stored state. Open engineering question (Consolidation Audit §7.7): is reward_redeemed durable or transitional to closed? Assign to Engineering Standards. |

### C.10 Reward
| available, redeemed, cancelled, expired | PRD7 §10: Available, Redeemed, Cancelled, **Historical** (no Expired; heading says "Redemption States") | **Conflict (DOC-P1-002):** "Historical" is a UI view, not a state; `expired` supported architecturally, disabled in MVP. Correct PRD7 heading (reward vs redemption entity). |

### C.11 Redemption
| completed, reversed | TRD10 identical; PRD7 does not define separate redemption states | Aligned once PRD7 heading fixed. |

### C.12 Notification
| queued, processing, partially_delivered, delivered, failed, suppressed, cancelled | TRD10 notifications: queued/processing/partially_delivered/delivered/failed (**no suppressed/cancelled in schema example**) | Minor schema/example gap; align TRD10 example with canonical 7-state list. |

### C.13 Subscription
| draft, trial, active, past_due, grace_period, suspended, cancelled, expired, archived (+TRD17 defines each) | TRD10 §10.14.1: trial/active/past_due/suspended/cancelled only | **Conflict (DOC-P1-003):** TRD10 example missing draft, grace_period, expired, archived. |

### C.14 Payment Attempt
| created, submitted, pending_customer_approval, confirmed, failed, timed_out, cancelled, reversed, refunded, requires_review | Defined in Consolidation Audit §7.11; TRD9/TRD17 flows consistent | Aligned; ensure final schema in Engineering Standards. |

### C.15 Knowledge Object
| draft, in_review, approved, published, retired, archived | TRD10 knowledgeNodes: draft, **pending_review**, **active**, retired, archived; knowledgeTranslations: draft, reviewed, published; Knowledge Studio doc pipeline: Suggested→Reviewed→Approved→Translated→Tagged→Indexed→Published | **Conflict:** three vocabularies (pending_review vs in_review; active vs published; the Studio pipeline adds pre-states). Normalize to one set; map Studio pipeline steps to states vs process activities. |

### C.16 Rule Version
| draft, approved, scheduled, active, superseded, suspended, retired | TRD10 ruleVersions: draft/approved/scheduled/active/superseded (**no suspended/retired**); Rules Studio doc lifecycle: Draft→Review→Approved→Scheduled→Active→Superseded→Archived (**Review and Archived extra; no suspended**) | **Conflict:** three variants. Recommend canonical = Consolidation Audit §7.14 + `archived`; add `in_review` only if the workflow requires a stored state. |

### C.17 Support Case
| No canonical published | TRD10 lists /supportCases; TRD18 workflow | **Gap:** state model required (recommend: open, in_progress, waiting_customer, resolved, closed) — Engineering Standards task. |

### C.18 Operational Review
| TRD10: open, in_review, resolved_valid, resolved_actioned | No conflicts found | Aligned; confirm terminal semantics. |

### C.19 Bulk Job
| No canonical published | TRD18 bulk-job framework | **Gap:** state model required (recommend: draft, approved, running, paused, completed, failed, cancelled). |

### C.20 Trial (sub-lifecycle)
| TRD17 §17.12 trial statuses | Not audited in detail against PRD3 (trial rule open OPD-003) | Confirm after OPD-003. |

## PART D — UI Wording vs Stored State (explicit mapping to publish)

| Stored state | Customer UI | Business UI |
|---|---|---|
| waiting_for_customer | "Waiting for You" | "Waiting for Customer Verification" |
| verified | "Verified" / progress updated | "Verified" |
| rejected | "Rejected" | "Rejected — review" |
| under_review | "Being reviewed" | "Under review" |
| reward_available (cycle) | "Your next one is on us" | "Reward available" |
| pending (user) | "Pending verification" (account) | — |

## PART E — Items Requiring Founder Approval

1. Canonical state tables C.6, C.9, C.10, C.13, C.15, C.16 (adoption of Consolidation Audit §7 suite-wide).
2. Whether Purchase Record `recorded` exists as a stored state (PRD5 vs TRD).
3. Batch rejection policy (DOC-P1-006) — affects verification UI vocabulary.
4. Customer action verb: "Verify" vs "Approve" in customer UI (one choice, both currently used).
5. Expired pending purchases: recoverable or final (C.6 note) + expiry defaults (DOC-P1-009).
6. Plan-limit basis wording change in PRD0/PRD3 (DOC-P1-005).
7. Support case and bulk job state models (C.17, C.19) — may be delegated to Engineering Standards.
