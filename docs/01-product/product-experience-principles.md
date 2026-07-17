> **Title:** Product Experience Principles
> **Version:** 1.0 · **Status:** Active — foundational reference for design and frontend work · **Classification:** Authoritative Product (companion to the PRD; product philosophy, not a UI specification)
> **Governing document:** Platform Constitution; PRD
> **Source-of-truth path:** `docs/01-product/product-experience-principles.md`
> **Last controlled update:** 2026-07-17 (created)

# Product Experience Principles

## 0. What This Document Is and Is Not

This is **not** a UI specification. It contains no mockups, wireframes, components, layouts, CSS, or implementation code, and it does not define one. It is the product's **philosophy of experience** — how 11thONUS should *feel* to a customer or business user, stated at a level stable enough to outlive any particular screen, framework, or design-system version.

It exists to be read **before** wireframes, mockups, components, a design system, or frontend implementation begin, and to be the reference every designer and engineer checks a new screen against afterward. Where this document and a specific TRD16 (Frontend and PWA Architecture) requirement appear to overlap, TRD16 governs the binding technical requirement; this document governs the *reasoning* behind it, so the requirement is never applied mechanically without understanding why it exists.

This document does not change any approved product requirement, business rule, or Constitution principle. It draws its authority from, and is subordinate to, the Platform Constitution and the PRD.

## 1. Product Philosophy

### 1.1 What 11thONUS Is

11thONUS is a **Customer-Verified Loyalty Platform** (Constitution Article 1). It lets businesses recognize loyal customers through transparent, customer-verified Reward Programs — ten verified purchases earn one reward the platform calls an **On Us Moment**. The platform's own promise is simple enough to say in five words: *"Every 11th, on us."*

The platform exists so a business can say, with confidence, **"This one's on us"** (Constitution Article 2) — and mean it, because the customer standing in front of them actually earned it, verifiably.

### 1.2 Why Customer Verification Changes the Loyalty Experience

Almost every loyalty program a customer has used before is recorded entirely by the business: a cashier taps a button, a stamp goes on a card, a point balance updates somewhere the customer cannot see or check. The customer's only role is to trust that it happened correctly. That trust is frequently misplaced — staff can forget, systems can lose records, and there is no way for a customer to know whether their loyalty history is actually complete (Design Decision Knowledge Base §3.2, "Universal Verification").

11thONUS inverts this. **The business records the purchase. The customer verifies the purchase. The platform updates loyalty progress.** No purchase counts toward a reward until the customer who made it confirms it happened — not because the platform doesn't trust businesses, but because a loyalty program's entire value depends on the customer believing their progress is real. This is Constitution Pillar Two: *"Customer verification shall remain the foundation of loyalty progression. The platform exists to create confidence, not merely to record purchases."*

This single structural fact changes what the experience has to do that a traditional points app never had to do:

- It has to make **verification itself feel effortless**, not like a chore standing between the customer and their progress — because every added step is a moment where a real customer might not bother, and an unverified purchase is a purchase that, correctly, does not count.
- It has to make **progress visibly trustworthy**, not just visible — a number going up means little if the customer doesn't understand it came from something *they* confirmed.
- It has to hold the line on trust even when it is inconvenient — the platform never fabricates progress to make an experience feel smoother (§7, §5.4), because a false "you're almost there" is worse than no progress indicator at all.

Every principle in this document traces back to that one structural difference: **11thONUS is a platform where the customer is a participant in their own loyalty record, not a spectator to it.**

## 2. Experience Pillars

These are the platform's non-negotiable qualities. A new screen, flow, or feature is checked against all eight before it ships; failing one is a design defect, not a style preference.

**Trust Before Reward** — No interface may imply progress, availability, or reward before the underlying record is real and verified. A customer's trust in what they see on screen matters more than making that screen look impressive in the moment.

**One Clear Next Action** — Every screen answers, without ambiguity, "what do I do here?" A screen with three equally-weighted actions is a screen that has not finished being designed.

**Progress Should Motivate** — Loyalty progress is the emotional engine of the product (§1.1's "ten verified purchases"). It should always be visible where relevant, always accurate, and always framed as *forward* movement toward something specific, never as an abstract balance.

**Simple Beats Clever** — A clever interaction that requires explanation has already failed the Grandmother Test (§8.1). Plain and immediately understandable beats novel and impressive, every time, without exception.

**Confidence Through Clarity** — A customer or business user should never have to guess what a status means, what happens next, or whether an action succeeded. Ambiguity is the enemy of confidence, and confidence is the product.

**Verification Builds Trust** — The moment of verification is not friction to be minimized away — it is the platform's core trust mechanism (§1.2) and deserves to feel purposeful, quick, and clearly consequential, not apologized for or hidden.

**Business Efficiency Matters** — Trust does not require business users to suffer needless steps. A business owner recording purchases all day needs speed and low cognitive load as much as a customer needs clarity — efficiency and trust are not in tension, and a design that trades one for the other without reason has failed both.

**Celebrate Without Gimmicks** — An earned On Us Moment deserves a genuine, warm acknowledgment (§7, §9.3) — never a hollow animation performing excitement the moment itself already carries on its own.

## 3. Design Principles

- **Every screen has a primary action.** Secondary actions exist, but never compete visually with the one thing the screen wants the user to do.
- **Every important state is obvious.** Waiting for verification, verified, reward available, reward redeemed, pending sync, error — a user should be able to tell which state they're in at a glance, not by reading carefully.
- **Reduce cognitive load.** Ask for the minimum information needed at each step (§16.36/§16.37's progressive disclosure and lightweight registration are the technical expression of this); never make a user hold more than one new idea in their head at a time.
- **Prefer recognition over recall.** Show the user their options and their history rather than asking them to remember a code, a rule, or a prior step. This is why a loyalty number is shown, scanned, or looked up — never typed from memory by someone who has to recall it exactly.
- **Use plain language.** See §6 in full — this principle is important enough to warrant its own section.
- **Make progress visible.** Wherever a customer has verified purchases building toward a reward, that progress is shown, not buried behind a tap.
- **Avoid unnecessary choices.** Every additional decision point is a place a user can hesitate, get it wrong, or abandon the flow. Default to the platform's judgment; offer a choice only where the user's own preference genuinely changes the outcome.

## 4. Information Hierarchy

What deserves priority on a screen follows directly from the Experience Pillars, not from what's easiest to build or what fits available space.

1. **The user's current state and what it means** — e.g., "Waiting for You" versus "8 of 10 verified" versus "Your next one's on us" (§16.42's approved customer-facing language) comes first, because a user who doesn't know where they stand cannot act confidently on anything else.
2. **The one primary action available right now** (§3) — placed with the state, not separated from it.
3. **Context that explains the state** — why something is waiting, what happens next, when it will resolve.
4. **Secondary information and navigation** — everything else the user might want, but did not come to this screen specifically for.
5. **System/administrative detail** — anything closer to how the platform works internally than to what the user is trying to do belongs last, if it belongs on the screen at all (see §6.1 — much of it should not be shown to customers).

A screen that leads with navigation, branding, or decorative content ahead of the user's actual state has inverted this hierarchy and should be redesigned.

## 5. Interaction Principles

### 5.1 Confirmations

A confirmation exists to prevent a genuinely costly mistake, not to add ceremony to routine actions. Confirmations are reserved for actions that are hard or impossible to undo and that matter commercially (e.g. redeeming a reward) — routine, safe, or reversible actions proceed without an extra confirmation step, consistent with "avoid unnecessary choices" (§3).

### 5.2 Errors

An error tells the user three things: what happened, in plain language; whether it's their fault, a temporary problem, or something the platform needs to fix; and what they can do next (retry, wait, contact support). It never shows a raw technical message, a stack trace, or an internal error code with no explanation (§16.46). Where something has genuinely gone wrong on the server side, the user gets a plain apology and a short, human-readable support reference — never a demand that they somehow diagnose the problem themselves (§16.47).

### 5.3 Loading

Loading should never feel like uncertainty. A short wait gets a lightweight, immediate indicator; a longer or content-shaped wait gets a skeleton that previews the shape of what's coming rather than a spinner with no context (§16.44). Nothing spins indefinitely without an explanation for why.

### 5.4 Empty States

An empty state is never a dead end. It explains what the section is for, why it's currently empty, and — where there's a relevant next step — what the user can do about it (§16.45). "Nothing is waiting for you right now" is a complete, honest, reassuring statement; a blank screen with no words is not.

### 5.5 Notifications

A notification exists because the user needs to know something changed, not because the platform has something to say. Every notification is actionable or informative on its own — a user should never receive a notification and then have to go hunting through the app to understand what it meant. Notification language follows the same plain-language rule as everything else (§6).

## 6. Language Principles

- **Customers never see backend/architecture terminology.** "Purchase Verification Lifecycle," "Customer-Verified Loyalty Engine," "Trust Ledger," "Reward Token," "state transition," "event," "immutable record" — none of these belong in customer-facing copy, ever, regardless of how accurately they describe what's happening underneath (§16.42).
- **Customers see human language for the same concepts:** Purchase, Waiting for You, Progress, Your Next One's On Us, Your On Us Moments, History (§16.42's approved vocabulary). Business users may see a small set of operational terms — Reward Program, Waiting for Customer Verification, Redemption, Activity History — because they are running a business, not because the underlying architecture is any more "theirs" to see (§16.43).
- **English and French are both first-class, not a translation of one primary language onto another.** Every piece of customer-facing copy is written with both languages in mind from the start — including that French text typically runs longer, and layouts need to hold up under that (§16.40).
- **Plain language, always.** If a word wouldn't be understood by a first-time smartphone user with no formal training on the app (§8.1's Grandmother Test), it does not belong in customer-facing copy. This applies as much to a menu label as to an error message.
- **Reward language feels human, not transactional.** "Your Next One's On Us" carries warmth a generic "Reward Available" notification does not; the platform's tagline — *"Every 11th, on us"* — is the model for how earned language should sound: plain, specific, warm, never salesy.
- **Business-authored content is distinguished from platform copy.** When a business's own text isn't available in the customer's language, the UI shows the best available version and never silently blends system and business language into one ambiguous voice (§16.41).

## 7. Emotional Design

The platform's intended emotional arc, purchase to reward, is:

```
Trust
  ↓
Confidence
  ↓
Progress
  ↓
Achievement
  ↓
Celebration
```

**Trust** is earned the moment a customer's first purchase is recorded and they're asked to verify it — this is the platform proving, from the very first interaction, that nothing counts without them. **Confidence** follows once verification resolves cleanly and the customer sees their progress reflected accurately. **Progress** is the sustained middle of the journey — each subsequent verified purchase should feel like visible forward motion, not a repeat of the same screen. **Achievement** is the moment the tenth unit resolves and a reward becomes available — the platform should make this moment unmistakable, not just a number quietly changing. **Celebration** is the On Us Moment itself: brief, warm, and never performative (§9.3) — earned confidence expressed simply, the way a good business owner would say "this one's on us" in person.

This arc repeats every cycle. A returning customer on their third reward should feel the same integrity in the experience as they did on their first — familiarity should deepen trust, never dilute the moment.

## 8. Accessibility Principles

- **Readable** — sufficient contrast, scalable text, and layouts that hold up under both English and longer French copy (§16.40, §16.49).
- **Simple** — every accessible path is also the simplest path; accessibility is never a separate, secondary experience bolted onto a more complex primary one.
- **Inclusive** — designed for people across languages, literacy levels, devices, and connectivity, per the Constitution's Inclusivity value — not for a single assumed "typical user."
- **Large touch targets** — sized for real-world mobile use, including older devices and imprecise touch, not just for a designer's cursor.
- **Color is never the only indicator** — every status that uses color also uses text, an icon, or a label, so the meaning survives for anyone who can't distinguish the colors used (§16.49).
- **Keyboard accessible where relevant** — business and administration surfaces in particular support full keyboard navigation and visible focus states, semantic structure, and screen-reader labels (§16.49).

### 8.1 The Grandmother Test

Every customer journey is reviewed against one standing question, unchanged since it was first written into the platform's technical architecture (TRD16 §16.50): **can a first-time smartphone user understand what to do without training?** If the honest answer is no, the feature is redesigned — not explained better, not documented more thoroughly, *redesigned*. This is the single sharpest test in this entire document, and the one every other principle here ultimately serves.

## 9. Motion Principles

Motion in 11thONUS has one job: **communicate meaning.** It is never decoration for its own sake.

- **Motion should communicate meaning.** A transition should tell the user something true — that a state changed, that an action succeeded, that something new has arrived — not simply move for visual interest.
- **Never distract.** Motion never competes with the primary action (§3) or delays a user from doing the one thing the screen exists for. An authoritative result (a redemption confirming, a verification completing) is never held up waiting for an animation to finish (§16.65 — celebration shall never delay the authoritative redemption response).
- **Celebrate important milestones subtly.** The On Us Moment (§7) is the platform's biggest emotional beat, and its celebration is brief, warm, accessible, and motion-sensitive — respecting users who need reduced motion — rather than loud or attention-seeking (§16.49, §16.65). A milestone earns warmth, not spectacle.
- **Respect reduced-motion preferences absolutely.** Where a user has indicated they need reduced motion, every principle above still applies through non-motion means (a state change, a color, a label) — accessibility is never sacrificed for delight.

## 10. Future Design System Alignment

This document is the philosophy the platform's future **Design System** (Constitution Article-referenced governance position, not yet authored — see `docs/README.md` §1 item 5) will express in concrete, reusable form. Each future design-system artifact should be traceable back to a principle here:

- **Design tokens** (color, spacing, radius, elevation values) encode §8's "color is never the only indicator" and §5's state-clarity requirements — every token exists to make a state or hierarchy (§4) instantly legible, not to satisfy an aesthetic preference in isolation.
- **Components** (buttons, cards, progress indicators, status badges) are the reusable expression of §3's "every important state is obvious" and §4's information hierarchy — a component library is only as good as its ability to make the pillars in §2 hold true on every screen it's used on.
- **Iconography** supports §6's plain-language principle — an icon should reduce the need for words, never add a second vocabulary the user has to separately learn.
- **Spacing and typography** are the concrete mechanism for §3's "reduce cognitive load" and §8's readability requirement — generous, consistent spacing and legible type sizes are not visual polish, they are the accessibility and clarity principles made physical.
- **Motion** in the future design system implements §9 exactly — any motion token or transition pattern is checked against "does this communicate meaning" before it is added to the library.
- **Accessibility** is not a layer applied after the design system exists — every future token, component, and pattern is built to §8's standard from the start, the same way this document treats it as foundational rather than supplementary.

Where the future Design System and this document ever appear to diverge, this document's principles govern and the Design System is corrected — exactly the same relationship the Canonical Reference already holds with the PRD and TRD.

## 11. Relationship to Other Documents

- **Platform Constitution** — the source of this document's philosophical authority (Articles 1–5, Core Values, Three Pillars, CP-001 Customer Trust Before Automation); this document operationalizes that philosophy into product-experience terms without repeating it wholesale.
- **PRD** (`01-product/prd/`) — defines *what* the product does; this document defines how it should *feel* while doing it.
- **TRD16 (Frontend and PWA Architecture)** — the binding technical requirements this document's principles are already partially expressed through (copy rules, loading/empty/error states, optimistic UI policy, accessibility standard, Grandmother Test, celebration design); cited throughout above rather than restated as new rules.
- **Design Decision Knowledge Base** (`00-governance/design-decision-knowledge-base.md`) — the detailed *why* behind Verified Units and Universal Verification that §1.2 above draws on.
- **Canonical Reference** (`00-governance/canonical-reference.md`) — the approved terminology this document's Language Principles (§6) must never contradict.
- **(Future) Platform Design System** — the concrete design-token/component/pattern library this document exists to guide, per §10.
