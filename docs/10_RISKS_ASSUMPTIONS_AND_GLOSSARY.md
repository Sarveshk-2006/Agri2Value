# 10 — Risks, Assumptions, Mitigations and Glossary

## 10.1 Key risks

| Risk | Why it matters | Mitigation |
|---|---|---|
| Stale or wrong market prices | Can produce harmful recommendations | Timestamp, source label, freshness rules and manual confirmation |
| Incomplete cost model | Inflates net profit | Itemized costs, missing-data warnings and farmer-editable assumptions |
| Processing yield uncertainty | Makes value-add option unreliable | Use measured/verified range; show scenarios; label demo assumptions |
| No confirmed output buyer | Processed goods may remain unsold | Require buyer/demand path or classify as conditional |
| Provider availability changes | Execution fails after recommendation | Confirm capacity before “ready to execute”; re-run engine if cancelled |
| Crop quality unknown | Buyer rejection and loss | Ask for grade/inspection; do not infer from unsupported image model |
| Disease model overconfidence | Incorrect crop-health advice | Limited classes, evaluation, low-confidence fallback, expert referral |
| IoT sensor drift/offline | Misleading irrigation advice | Calibration, last-seen status, manual override, no actuation on stale data |
| OCR errors | Contract clause misread | Show source text, allow correction, flag low OCR quality |
| LLM hallucination | False legal interpretation | Ground output in clauses, source references, cautious wording and review |
| Privacy breach | Farmer trust and safety | Consent, role permissions, encryption, minimal collection and audit logs |
| Scope creep | Core product remains unfinished | P0/P1/P2 priorities and feature freeze |
| Demo failure | Judges cannot see value | Stable seed data, reset script, backup video and smoke test |
| Overclaiming impact | Credibility loss | Label assumptions and report only measured outcomes |

## 10.2 Assumptions to validate with real users

- Farmers want a comparison of net returns across more than one selling option.
- Farmers can provide enough crop-lot information for an initial estimate.
- Buyer/processor availability can be represented accurately enough for a pilot.
- Transport and processing costs can be obtained or estimated transparently.
- Farmers value a clear feasibility explanation, not only a ranked price.
- A local-language mobile workflow improves comprehension.
- Crop Rescue Mode addresses a frequent enough pain point to justify its interface.

These are hypotheses. Validate them through farmer interviews and a small pilot rather than presenting them as proven facts.

## 10.3 Pilot validation questions

Ask farmers:
- How do you currently decide where to sell a harvest?
- Which costs are usually missed when estimating profit?
- How often does a buyer cancel or change terms?
- What is the maximum time you can safely wait before selling this crop?
- Which resources are hardest to arrange: transport, labour, storage, processing or equipment?
- Would you use a digital comparison if it showed all assumptions and sources?
- What language and input method is easiest?

Ask buyers/processors:
- Which crop, grade and quantity do you accept?
- How frequently does capacity change?
- What causes rejection?
- What information must a farmer provide before you make an offer?
- What payment terms are typical?

## 10.4 Glossary

- **Crop lot:** a specific quantity of a crop being considered for sale, processing or storage.
- **Farm Digital Profile / Digital Twin:** a structured digital representation of the farm and its current crop context; in the MVP this is data-driven, not a 3D simulation.
- **Gross revenue:** saleable quantity multiplied by selling price, before costs.
- **Net profit / net return:** gross revenue minus relevant costs.
- **Processing yield:** saleable output quantity divided by input crop quantity.
- **Feasibility:** whether the option can realistically be executed with the required buyer, capacity, resources, time and constraints.
- **Indicative price:** a reference price that is not a confirmed buyer offer.
- **Confirmed offer:** an offer with defined quantity, price, terms and expiry, submitted by a buyer and accepted by the farmer.
- **Decision run:** one saved calculation using a particular input snapshot and engine version.
- **Crop Rescue Mode:** urgent re-evaluation and coordination workflow for a harvest at risk.
- **Actual-profit reconciliation:** calculation of realized outcome from delivered quantity, actual price, costs and payment records.
- **Data provenance:** where a value came from, when it was observed and how it was obtained.
- **Demo data:** seeded or illustrative data used for a controlled demonstration, not a live market observation.

## 10.5 Product language to use consistently

Prefer:
- “estimated net return” over “guaranteed profit”;
- “potential concern” over “illegal contract”;
- “model prediction” over “confirmed disease”;
- “buyer listing” over “confirmed buyer” until an offer is accepted;
- “request submitted” over “booking confirmed” until provider confirmation;
- “sensor last reported” over “current soil condition” when data may be stale;
- “pilot target” over “proven impact” until measured.

## 10.6 Open decisions before implementation

The team must explicitly decide:
1. Which crop is the first demo crop?
2. Which geography/markets are in scope?
3. Which market data source is actually accessible and permitted?
4. Which processing product has a credible yield/cost model?
5. Is there a real buyer/processor partner, or will listings be demo-only?
6. Which transport workflow can be confirmed?
7. Which one supporting AI/IoT feature is already reliable?
8. What is the event deadline and team availability?
9. What stack and code already exist?
10. Which features can be honestly labelled as implemented at demo time?
