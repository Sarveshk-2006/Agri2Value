# 04 — Profit Decision Engine: Calculation and Ranking Specification

## 4.1 Purpose

The Profit Decision Engine is the core of Agri2Value. It compares realistic alternatives and explains which one is expected to leave the farmer with the best net outcome under the farmer's constraints.

It is **not** a price predictor alone. It is a scenario calculator and feasibility-aware ranking system.

## 4.2 Design rules

1. Compare options on the same crop lot and time horizon.
2. Use saleable output quantity, not raw input quantity, for processed products.
3. Include all known material costs.
4. Never silently treat missing cost as zero.
5. Distinguish estimated price from confirmed buyer offer.
6. Apply hard constraints before ranking.
7. Show uncertainty and source freshness.
8. Allow the farmer to change assumptions and compare scenarios.
9. Explain the recommendation in simple language.
10. Record the exact calculation inputs used for each result so it can be audited.

## 4.3 Core definitions

- `Q_in`: input crop quantity.
- `Q_saleable`: quantity that can actually be sold after grading, rejection, processing yield or expected loss.
- `P_sell`: expected or offered sale price per saleable unit.
- `R`: expected revenue.
- `C`: total costs attributable to the option.
- `NP`: expected net profit / net return.
- `NP_per_kg`: expected net profit per kg of original crop input, useful for comparing options with different yields.
- `T`: time to execute / receive payment.
- `F`: feasibility status and unmet prerequisites.
- `U`: uncertainty / confidence information.

Basic formula:

`R = Q_saleable × P_sell`

`NP = R − Σ(C_i)`

`NP_per_kg_input = NP / Q_in`

If payment is delayed, the interface should show expected realization time and payment terms separately. A time-value-of-money adjustment can be a later feature; do not invent an interest rate.

## 4.4 Cost categories

Depending on the option, include:

- Harvesting and sorting.
- Packaging/crates/bags.
- Loading and unloading.
- Transport, tolls and handling.
- Market fee, commission or platform fee.
- Processing charges.
- Labour.
- Energy, water and consumables.
- Storage and cold-chain charges.
- Expected quantity loss, spoilage or rejection.
- Financing/working-capital cost if known and applicable.
- Any other deduction explicitly provided by buyer or service provider.

Avoid double-counting: if a buyer's offered price is already net of a particular fee, document that and do not subtract it again.

## 4.5 Option models

### A. Raw sale to local market

`Q_saleable = Q_in × (1 − expected_rejection_rate)`

`R = Q_saleable × local_market_price`

`NP_raw = R − transport − market_fees − commission − packaging − labour − other_costs`

Use a range if price varies or the source reports a range. If quality/rejection is unknown, mark the assumption rather than inventing a precise rate.

### B. Direct / alternative buyer

`Q_saleable = min(Q_in, buyer_max_quantity)` adjusted for quality acceptance.

`R = Q_saleable × buyer_offer_price`

`NP_buyer = R − pickup_or_delivery_cost − packaging − handling − commissions − other_costs`

The offer must include expiry, quantity, grade and payment terms. An indicative buyer listing is not a confirmed offer.

### C. Processing / value addition

Let `Y` be the processing yield (saleable output quantity per input quantity).

`Q_output = Q_in × Y`

`Q_output_saleable = Q_output × (1 − output_rejection_or_loss)`

`R_process = Q_output_saleable × output_product_price`

`NP_process = R_process − raw_input_handling − processing_cost − labour − energy − packaging − transport − storage − sales_costs − other_costs`

Important feasibility conditions:
- Processing unit exists and is available within the required time.
- Capacity is sufficient for the lot or a valid partial quantity.
- Input quality is accepted.
- Yield assumption has a source or is clearly labelled as a demo assumption.
- Output buyer/demand exists or is represented as a risk scenario.
- Farmer can meet upfront capital and timing needs.
- Packaging and storage are available if required.

If output buyer is not confirmed, show a lower-confidence scenario and do not present it as a guaranteed sale.

### D. Store and sell later

`R_future = Q_after_storage_loss × future_price_scenario`

`NP_store = R_future − storage_cost − handling − extra_transport − financing_cost − other_costs`

This option must account for safe storage capacity, crop-specific holding time, expected losses and price uncertainty. It should be blocked if storage suitability or time is unknown for a perishable crop.

### E. Collective sale / shared transport

`C_transport_per_farmer = total_transport_cost × allocation_share`

Allocation share can be based on weight, volume, distance or an agreed rule. The rule must be visible to all participating farmers.

`NP_group_i = farmer_i_revenue − farmer_i_allocated_costs − farmer_i_other_costs`

Do not assume equal cost splitting if weights or route distances differ. Confirm the allocation method before the group booking.

## 4.6 Feasibility gate

Each candidate option is assessed against hard and soft constraints.

### Hard constraints (must pass to be “feasible”)

- Buyer/market route exists or a credible sale channel is identified.
- Required quantity and quality can be accepted.
- Required processor/storage/transport capacity is available or can be requested and confirmed.
- Delivery time is within crop urgency and provider availability.
- Farmer can meet required capital/advance conditions, if any.
- Legal/operational restrictions are not violated.

### Soft constraints (affect ranking, not necessarily blocking)

- Longer time to payment.
- Higher uncertainty in price or yield.
- Longer distance.
- Higher spoilage exposure.
- Farmer preference (e.g. avoid debt, avoid travel, prefer immediate payment).

Statuses:
- `FEASIBLE_CONFIRMED`: all critical prerequisites confirmed.
- `FEASIBLE_PENDING`: plausible, but one or more requests awaiting confirmation.
- `CONDITIONAL`: depends on an explicit assumption (e.g. estimated processor availability).
- `INFEASIBLE`: hard constraint fails.
- `INSUFFICIENT_DATA`: cannot evaluate responsibly.

Only confirmed or clearly conditional options should be shown as actionable. Infeasible options may be shown for transparency with the reason.

## 4.7 Ranking strategy

For a hackathon MVP, use a transparent rule-based ranking, not a black-box AI score.

Recommended sequence:

1. Generate candidate options.
2. Calculate expected net profit and net profit per input kg.
3. Apply feasibility status.
4. Apply farmer constraints and urgency.
5. Estimate risk/uncertainty band.
6. Rank confirmed-feasible options first; then feasible-pending; then conditional. Keep infeasible options separate.
7. If two options have similar net return, prefer the option with lower execution risk, shorter time or a farmer-stated preference.

A later multi-objective score can be used, but its weights must be configurable and explainable. Do not disguise subjective weights as objective truth.

## 4.8 Uncertainty and confidence

Show a confidence label derived from data quality, not a fabricated model probability.

Example dimensions:
- Price source and freshness.
- Whether price is indicative or a confirmed offer.
- Whether cost values are farmer-entered, provider-quoted or estimated.
- Whether processing yield is measured or assumed.
- Whether capacity is confirmed.
- Whether quality/rejection is known.

Possible labels: `High input certainty`, `Moderate input certainty`, `Low input certainty`. Document the exact rules used to assign them.

Where input values are ranges, calculate a low/base/high scenario:

`NP_low`, `NP_base`, `NP_high`

Avoid presenting a single exact number when the underlying price or cost is highly uncertain.

## 4.9 Worked example (illustrative only)

Assume a 1,000 kg tomato lot. The following figures are invented for demonstrating the calculation and are not live Nashik market rates or verified processing economics.

| Option | Gross revenue | Total costs | Estimated net |
|---|---:|---:|---:|
| Local raw sale | ₹20,000 | ₹8,000 | ₹12,000 |
| Alternative buyer | ₹23,000 | ₹8,000 | ₹15,000 |
| Processing | ₹40,000 | ₹22,000 | ₹18,000 |
| Collective sale | ₹22,000 | ₹6,000 | ₹16,000 |

In this example, processing has the highest estimated net return. But if the processing unit is unavailable or there is no credible output buyer, processing is not the best executable option. The engine should then recommend the best feasible alternative, which may be collective selling or the alternative buyer.

## 4.10 Recommendation explanation template

**Recommended option:** [option name]  
**Estimated net return:** [range/value]  
**Why it ranks first:** [two or three plain-language reasons]  
**What must be confirmed:** [buyer, transport, processing capacity, etc.]  
**Main risks:** [price, quality, time, spoilage, payment]  
**Data used:** [source + timestamp / farmer input / demo data]  
**What could change the recommendation:** [price change, transport cost, yield, availability]

## 4.11 Calculation integrity and auditability

- Store an immutable snapshot of the inputs used for each recommendation run.
- Store formula/version identifier.
- Store source IDs and timestamps.
- Store calculated line items, not just a final number.
- Keep estimates and actuals in separate fields/tables.
- Use decimal types for currency and quantities; avoid floating-point rounding errors in financial totals.
- Define currency (INR) and canonical quantity units.
- Round only for display; preserve calculation precision internally.
- Write unit tests for every option type and edge case.

## 4.12 Required edge cases

- Zero or negative quantity: reject.
- Missing price: mark option unevaluable; do not use zero.
- Missing cost: request input or show an incomplete estimate.
- Buyer quantity below harvest quantity: model partial allocation.
- Processing output yield unknown: show scenario range or mark insufficient data.
- No buyer: processing is conditional, not confirmed feasible.
- Transport cost exceeds incremental revenue: option should rank lower or become uneconomic.
- Price changes before booking: refresh calculation and require farmer review.
- Partial rejection/delivery: reconcile remaining quantity separately.
- Payment delayed or partial: show cash received separately from net profit earned/expected.
