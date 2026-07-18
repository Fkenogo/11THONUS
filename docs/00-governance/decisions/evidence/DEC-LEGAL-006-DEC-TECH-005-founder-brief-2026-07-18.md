> **Title:** Founder Brief — Where 11thONUS's Data Will Live (DEC-LEGAL-006 and DEC-TECH-005)
> **Version:** 1.0 · **Status:** Research summary for Founder review — not a decision · **Classification:** Working (governance record — evidence)
> **Governing document:** [Decision Register](../decision-register.md)
> **Source-of-truth path:** `docs/00-governance/decisions/evidence/DEC-LEGAL-006-DEC-TECH-005-founder-brief-2026-07-18.md`
> **Last controlled update:** 2026-07-18 (DEC-LEGAL-006/DEC-TECH-005 Evidence Gathering — created; corrected twice same day — first after reading Burundi's law directly and fixing a Rwanda language error, second to separate the Cloud Scheduler and Cloud Tasks findings and narrow the Firebase Authentication wording)

# Founder Brief — Where 11thONUS's Data Will Live

*Written for a non-technical reader. Full technical/legal detail is in the [Legal Evidence Pack](DEC-LEGAL-006-cross-border-hosting-evidence-2026-07-18.md) and [Technical Evidence Pack](DEC-TECH-005-firebase-region-evaluation-2026-07-18.md).*

## 1. What Must Be Decided

Two connected decisions:

1. **The legal position** on storing 11thONUS's data outside Rwanda (since we're a Rwanda-based company but our cloud provider, Google Firebase, has no data center in Rwanda) — this is **DEC-LEGAL-006**.
2. **Which specific Google Firebase location** to actually store the data in — this is **DEC-TECH-005**.

Neither has been decided yet. This brief summarizes what we found while researching both, so you and legal counsel can make an informed decision.

## 2. Why It Blocks Product Development

Every piece of real engineering work in Phase 1 — setting up the actual Firebase project, building the login system, storing purchase records — needs a real, chosen location for that data. We can't build on a location we haven't legally cleared and technically confirmed. That's why this sits before all further engineering work.

## 3. Legal Findings in Plain Language

*(Updated 2026-07-18: we went back and read Burundi's actual law directly — the PDF was a scanned document with no readable text layer, so it was reviewed page by page as images — and corrected an error in how many official languages Rwanda has. Both corrections are below.)*

- **Rwanda has a real, specific rule about this.** Rwandan law says company data must be stored inside Rwanda **by default**. Since Google Firebase doesn't have a data center in Rwanda, storing data anywhere else requires either (a) formal permission from Rwanda's data protection regulator (the NCSA), or (b) meeting one of a short list of alternative legal grounds (like getting customer consent), **plus** a written contract covering the transfer. This isn't a one-time box to check — it's a formal process with its own paperwork.
- **Correction: Rwanda actually has four official languages, not three.** Kinyarwanda, English, and French were already noted — we missed that **Kiswahili was added as a fourth official language in 2017**, to strengthen ties with East Africa. This doesn't change the bottom line (English and French are still in the official list, so our current product languages still count), but it means the full picture available to Rwandan counsel is a four-language list, not three.
- **We now have real answers on Burundi's law, not just "too new to know."** Burundi's new law (passed 10 March 2026) uses an **"adequacy" approach**, similar in spirit to how the EU handles this: data can be sent to another country if that country is on an approved list, or if the receiving party has safeguards approved by Burundi's new data protection agency (now confirmed to be officially named the **"Agence de protection des données à caractère personnel"**). What we still don't know: **what's actually on that approved list, or whether the new agency is even up and running yet to approve alternative safeguards.** That's now a narrower, more specific question for Burundian counsel than before. We also learned the law gives us a compliance deadline — six months from when it took effect, so roughly **early September 2026** — which is a real clock already running, independent of when we finalize this decision.
- **On language:** Rwanda's law says people must be able to understand consent/notice text in "one of Rwanda's official languages" (now confirmed as four: Kinyarwanda, English, French, Kiswahili). Since we already plan to offer English and French, this is likely fine for Rwanda — though for consumer-facing text, offering Kinyarwanda too would reduce risk. **For Burundi, we now have a clearer answer: we read all 55 articles of the new law directly, and it does not contain any requirement about what language notices or consent must be in.** That's a real, checked finding — not just "we couldn't find anything." It doesn't rule out a language requirement showing up somewhere else in Burundian law (a separate, older consumer-protection law is still an open question), but the data protection law itself is silent on it. **This does not mean we're adding Kirundi to the app** — it means this specific compliance question has a clearer answer now, separate from what languages the product itself supports.
- **New finding: Burundi's law may require a local representative.** If our technical setup ends up using anything physically located in Burundi (a local payment gateway, for example), and our Burundi processing isn't "occasional" (an ongoing loyalty program probably isn't), the law may require us to name a Burundi-based representative. Whether this actually applies to us depends on our specific technical setup and needs a lawyer's read.
- **Bottom line, unchanged:** nothing found in this research says "you cannot do this." Everything found says "this is doable, but there's a specific legal process to follow on both sides, and the open items are now narrower and more specific than before."

## 4. Technical Candidates

*(Corrected 2026-07-18, second pass: this section previously implied both Johannesburg gaps had "the same fix" — that's only true for one of them. It also previously left Firebase Authentication's location question sounding more settled than it is. Both are corrected below.)*

Google Firebase doesn't have a location in Rwanda or Burundi. The closest real option is **Johannesburg, South Africa** (opened by Google in 2024) — the only Google data center location on the African continent. **Belgium currently offers the simpler single-region path among the candidates we checked** — every service we looked at is confirmed available there in one place, so there's no extra setup complexity. **Johannesburg may offer lower latency for users in Rwanda and Burundi, but we have not actually measured this** — it's an informed estimate based on how the region's internet infrastructure is laid out, not a real speed test.

**Johannesburg has two separate service gaps, and they are not the same problem:**

- **Google's "scheduled task" service (Cloud Scheduler)** — used for automatic reminders or renewal processing — isn't available in Johannesburg. But there's a genuinely workable design for this: the scheduler doesn't have to run in the same location as the thing it triggers, so we could keep the main app in Johannesburg and run just the scheduling piece from a European location. This is a real, documented pattern — not automatic, and it takes deliberate setup, but it's a solved problem architecturally.
- **A second, related service called "Cloud Tasks"** — used for background job queues — is also unavailable in Johannesburg, but **we do not yet know whether the same fix works for it.** Task queues behave differently from simple scheduled reminders (retries, failure handling, and how data flows through the queue all work differently), and we haven't found documentation confirming the cross-region trick works the same way here. **This needs its own separate technical answer** before we could treat Johannesburg as fully ready, if our app ends up needing this specific kind of background job queue.

**On login/identity (Firebase Authentication):** we found that Google doesn't give us a location-selection option for this piece, the same way it does for the database and file storage. What we *don't* know yet is exactly where that data actually lives — the documentation we reviewed doesn't say. **We need to get a direct answer from Google (their data-processing terms, or asking them directly) before this can factor into a legal decision** — we're not assuming an answer either way.

## 5. Recommended Direction

**Not a final decision** — an advisory starting point:

- **Safer choice: Belgium (Europe).** Of the technical pieces we checked, every one is confirmed available there in one place — it's Google's most mature location, and there's no extra complexity. It will likely mean slightly slower app performance for users in Rwanda and Burundi.
- **Faster choice: Johannesburg (Africa).** Likely the fastest option for our actual users (though we couldn't measure this directly — we estimated it based on how Africa's internet infrastructure is laid out), and it's on the same continent for future growth. But it comes with real, deliberate technical work, not a small tweak: scheduled reminders/renewals need a specific cross-region setup (a solved design, but not automatic), and background job queues (Cloud Tasks) need a separate technical answer we don't have yet. It's also a newer location with less of a track record, and we don't yet know if it costs more.

**Neither is confirmed. Both need the legal question (§3) settled first**, since the legal analysis doesn't currently favor one location over another — it applies the same regardless of which we pick.

## 6. Costs and Trade-Offs

We could not produce a real cost estimate — that requires knowing the region **and** roughly how much data/traffic we expect at pilot scale, neither of which we have yet. What we do know: moving data in and out of Africa/South America tends to cost more than moving it within Europe or North America, so Johannesburg may carry a modest cost premium over the Belgium option — but this is an assumption, not a confirmed number.

## 7. Questions Requiring Legal Counsel

The research surfaced specific, answerable questions rather than vague uncertainty:

- **Rwanda:** How, in practice, do we get NCSA's permission to store data abroad — what's the process, cost, and timeline? Is English/French consent text actually sufficient in practice, or does Kinyarwanda (or Kiswahili) become necessary?
- **Burundi (now more specific, since we've read the law directly):** Has the government actually published its list of "approved" countries yet, or do we need to go the alternative route of getting our safeguards individually approved by the new agency? Is that new agency actually operating yet — accepting approvals, registrations, complaints? Does our specific technical setup trigger the law's "local representative" requirement? Does a separate, older consumer-protection law require Kirundi for consumer notices, even though the data protection law itself doesn't?
- **General:** Does running a Rwanda company serving Burundi customers create any Burundi tax or business-registration obligation separate from the data question? Given Burundi's law already took effect and gives us until roughly early September 2026 to be compliant, what's the minimum posture we should adopt for the pilot before that date, independent of when this decision itself is finalized?

## 8. Decisions Requested From the Founder

This brief does not ask you to decide the region or the legal position today. It asks for:

1. **Whether to engage Rwandan and Burundian legal counsel now** to answer the questions in §7 — this is the actual next step, not more internal research.
2. **Confirmation that the research direction above (favoring either Belgium as the safe default, or Johannesburg pending a real latency test) is reasonable to bring to counsel**, or whether you'd like a different starting framing.

## 9. What Happens Immediately After Approval

Once counsel answers the open questions: the legal position (DEC-LEGAL-006) gets formally confirmed in our Decision Register, then the region (DEC-TECH-005) gets confirmed using counsel's answer plus a real latency test, and only then does Phase 1 engineering work (actually setting up Firebase) become allowed to start.

## 10. What Remains Out of Scope

This brief and the research behind it did **not**: create any Firebase or Google Cloud project, select a final region, resolve either Decision Register entry, start any Phase 1 engineering work, or provide formal legal advice. Everything above is research to hand to counsel, not a decision already made.
