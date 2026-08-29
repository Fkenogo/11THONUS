# ENG-P3-002-UI-IMP-H — Founder Visual QA Checklist

**HOSTED FOUNDER QA: DEFERRED / NOT REQUIRED FOR CURRENT CLOSURE ASSESSMENT**

No hosted preview was deployed for this package (Phase Q, deferred by
Founder decision — recorded here, not represented as failed or blocked).
This checklist substitutes a structured **local** visual-review pass over
the already-captured, real-emulator-backed screenshot evidence, so the
Founder's product-feel judgment can still be exercised before any future
hosted pass, without waiting on one.

**Evidence directory:** `docs/05-implementation/evidence/ENG-P3-002-UI-IMP-H/`
(34 PNGs) — indexed in `screenshot-index.md` in the same directory, which
also records the automated visual-review pass already done (per-file
PASS/FINDING notes from an engineer actually opening every screenshot).

**What this checklist is for:** things only a human product judgment can
evaluate — visual hierarchy, copy tone, product feel, journey coherence.
**What it is deliberately NOT for:** anything already mechanically verified
elsewhere in this package — do not re-litigate:
- Accessibility (axe scan, zero violations across every route — see the
  main implementation report, Phase M).
- Forbidden-concept presence ("PROGRES," merchant/appointments language,
  Add Location, tier badges, etc. — grepped and screenshot-audited clean,
  Phase O / `screenshot-index.md`'s forbidden-concept section).
- Overflow/responsive breakage at the two captured breakpoints (already
  checked file-by-file in `screenshot-index.md`).
- Whether a given screen is reachable/wired correctly (that's E2E-verified,
  Phases C/G/H/I/J).

If a Founder observation *does* fall into one of those already-automated
categories, it's still worth raising — automation can have gaps — but flag
it as "does this contradict the automated result?" rather than treating
the checklist as the first pass on it.

## How to use this

For each row: open the named file(s) from the evidence directory, look at
what's asked, and mark Approve / Note / Concern. A "Note" is a
non-blocking observation for a future package. A "Concern" is something
the Founder believes should block moving forward — write what and why.

## Section 1 — Establishment (EST-01/02/03)

| # | Screens | What to judge | Verdict |
|---|---|---|---|
| 1 | `01-establishment-step-1-{mobile,desktop}-en.png` | Does "Tell us about your business" read as an inviting first step, not a bureaucratic form? Is the 3-step progress indicator reassuring or does it make the flow feel longer than it is? | |
| 2 | `02-establishment-step-2-{mobile,desktop}-en.png` | Six fields on one screen ("Your main location") — does this feel like too much at once? Is "Address (optional)" clearly optional at a glance? | |
| 3 | `03-establishment-step-3-review-{mobile,desktop}-en.png` | Does the three-card review ("Business" / "Main location" / "Operating details") read as trustworthy confirmation before commit, or as redundant re-entry of what was just typed? Is "Finish setup" clearly the primary action? | |

**Known, already-disclosed finding for this section** (not a defect to
re-flag, already documented and left as-is per governance): the "Location
name" and "Address" typed on screen 2 are not what appears as "Main
location" on screen 3 — the review shows the *Business* name instead. This
is an intentional backend-contract gap (`EstablishmentLocationStep.tsx`
docblock, tied to the still-open `Business.address`/`BusinessBranch.address`
question), not a rendering bug. Founder note: is this confusing enough in
practice to warrant prioritizing that backend decision sooner rather than
later? That's a product judgment worth capturing here even though the
underlying gap itself isn't Package H's to close.

## Section 2 — Dashboard Home

| # | Screens | What to judge | Verdict |
|---|---|---|---|
| 4 | `04-dashboard-home-{mobile,desktop}-en.png` | Does "Overview" feel like a real home base, or too sparse (just 4 links + a status banner)? Is the "Business Terms aren't available yet" banner tone right — informative without alarming? | |

## Section 3 — Business Profile

| # | Screens | What to judge | Verdict |
|---|---|---|---|
| 5 | `05-business-profile-{mobile,desktop}-en.png` | Is the Business Code framing ("An internal reference for 11thONUS support — not a code for sharing.") clear and reassuring, not cryptic or alarming? Does "No specific type" / "No email provided" read as neutral, not broken? | |

## Section 4 — Main Location

| # | Screens | What to judge | Verdict |
|---|---|---|---|
| 6 | `06-main-location-{mobile,desktop}-en.png` | Single-location-only is by design (no "Add Location") — does the screen make that feel like a deliberate MVP scope rather than a missing feature? | |

## Section 5 — Business Terms

| # | Screens | What to judge | Verdict |
|---|---|---|---|
| 7 | `07-business-terms-unavailable-{mobile,desktop}-en.png` | This is the ONLY reachable Terms state today (no readable legal content exists yet, `DEC-LEGAL-002` open — "accepted"/"pending" states are not shown anywhere in this evidence set because they cannot be reached, not because they were skipped). Does "currently unavailable... check back soon" read as trustworthy rather than broken? | |

## Section 6 — Team

| # | Screens | What to judge | Verdict |
|---|---|---|---|
| 8 | `08-team-active-only-{mobile,desktop}-en.png` | Does "Unnamed team member" read as a normal, temporary state rather than an error? | |
| 9 | `09-team-invite-dialog-{mobile,desktop}-en.png` | Is the invite flow (delivery method → contact → role) intuitive without any explanatory copy beyond field labels? | |
| 10 | `10-team-pending-invite-{mobile,desktop}-en.png` | Does "Staff · Pending" plus a "Cancel invitation" action feel complete, or does the Founder expect a "Resend" action here (explicitly out of scope/not built — worth confirming that's still the right call)? | |

## Section 7 — Display Name

| # | Screens | What to judge | Verdict |
|---|---|---|---|
| 11 | `11-display-name-incomplete-{mobile,desktop}-en.png` | Does the framing ("Not a legal name or verified identity, and not a unique username — just a label others may see.") strike the right tone — informative without being off-puttingly legalistic? | |
| 12 | `12-display-name-complete-{mobile,desktop}-en.png` | Clean read view + edit action — anything missing? | |

## Section 8 — French coherence

| # | Screens | What to judge | Verdict |
|---|---|---|---|
| 13 | `13-dashboard-home-{mobile,desktop}-fr.png` | Does the French read naturally (not machine-translated-sounding) to a native/fluent speaker? | |
| 14 | `14-business-profile-{mobile,desktop}-fr.png` | Same check for the Business Code framing sentence specifically — it's a nuanced one to translate well. | |
| 15 | `15-main-location-{mobile,desktop}-fr.png` | General coherence check. | |
| 16 | `16-business-terms-{mobile,desktop}-fr.png` | General coherence check. | |
| 17 | `17-team-{mobile,desktop}-fr.png` | General coherence check, including "Propriétaire"/"Actif" role/status labels. | |

## Cross-cutting product-feel questions (not tied to one screen)

- Looking at the full set in sequence (establishment → dashboard → the four
  management screens), does the journey feel coherent as *one product*, or
  like screens built at different times with different design instincts?
- Is dark mode (what every capture shows — the system rendered in the
  emulator's default color scheme) the right default first impression, or
  should a light-mode pass be captured too before wider review?
- Any screen where the Founder's gut reaction is "this doesn't look like
  11thONUS" — even if nothing above names it specifically?

## Already-labeled non-findings (confirm these stay labeled, don't get silently treated as verified)

`screenshot-index.md` explicitly marks the following as **not** individually
re-inspected or **not reachable**, rather than pretending they were
checked to the same depth as everything else. Founder QA should not assume
these got the same scrutiny as the rest without opening them directly:
- Rows #29–32 (`15-main-location-*-fr.png`, `16-business-terms-*-fr.png`) —
  marked "not individually re-opened," extrapolated from the pattern
  established by the English/French pairs that *were* opened.
- The "Terms — accepted" state — not captured anywhere in this evidence
  set because it cannot be reached in this environment (`DEC-LEGAL-002`
  open). If the Founder wants to see it, that requires either a
  content-availability decision first or a fixture/harness override,
  neither of which exists today.
- The transient category-id-flash finding (`cat_bakery` → `Bakery`,
  ~100–150ms) is not visible in any saved screenshot (the capture script
  was written to wait past it) — it's a real, disclosed, non-blocking
  finding documented in the main implementation report, not something to
  look for in this evidence set.

## Sign-off

| Reviewer | Date | Overall verdict (Approve for current scope / Approve with notes / Concerns — see above) |
|---|---|---|
| | | |
