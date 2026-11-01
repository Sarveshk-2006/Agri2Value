# 01 — Product Vision, Problem and Scope

## 1.1 Product vision

**Agri2Value is an AI-assisted farm-to-profit decision and execution platform.** It helps farmers identify the best *achievable* economic outcome for a crop, rather than simply displaying a mandi price, a disease prediction or a list of buyers.

The word *achievable* matters. A theoretical high price is not useful if the farmer has no transport, the buyer cannot accept the produce, the processing unit is unavailable, the farmer cannot wait, or the extra costs consume the margin.

### Product promise

> “Know your options. Choose the feasible one. Connect the resources. Protect the transaction. See what you actually earned.”

### North-star outcome

Improve the farmer's **realized net return per harvest transaction**, while reducing avoidable delay, spoilage, uncertainty and transaction risk.

This is a product objective, not a guaranteed outcome. The prototype must measure it rather than claim it in advance.

## 1.2 Problem definition

The submitted concept identifies six connected problem areas:

1. **Resource and logistics challenges:** limited access to machinery, labour, storage, cold-chain facilities and affordable transport.
2. **Unclear farm decisions:** farmers may lack timely information about crop condition, demand and profitable opportunities.
3. **Financial and contract risks:** complex agreements, delayed payments, penalties, crop damage, disease and difficult claim/scheme processes.
4. **Limited market access:** dependence on local markets or intermediaries can restrict access to alternative buyers and prices.
5. **Water and crop resilience:** water scarcity, inefficient irrigation, disease and environmental risks affect production and crop value.
6. **Price and profit uncertainty:** the selling price alone does not reveal net profit after transport, commissions, labour, processing and other costs.

### The sharper problem statement

A farmer often has to make a time-sensitive crop-sale decision without a single trusted view of the available options, their full costs, feasibility, buyer availability and transaction risks. Information may exist in separate places, but the farmer still has to connect it and carry out the decision.

Agri2Value addresses that gap by linking decision support to execution and outcome verification.

## 1.3 What Agri2Value is — and is not

### It is

- A decision-support product, not an autonomous agent that commits a farmer to a sale.
- A comparison engine for raw sale, alternative buyers, processing, storage where appropriate and collective selling.
- A resource and transaction coordination layer.
- A transparent estimator that explains its inputs, assumptions and uncertainty.
- A farmer-centred record of offers, agreements, delivery, costs and payment.
- A modular platform that can later serve FPOs, buyers, processors and service providers.

### It is not

- A guaranteed price prediction system.
- A replacement for an agronomist, lawyer, insurer, bank or government authority.
- A guarantee that a buyer, processor, truck, cold store or insurance claim is available.
- A system that should automatically sign contracts, transfer funds or operate irrigation pumps without explicit authorization and safeguards.
- A universal crop-disease diagnostic tool until each crop/disease model is properly trained and validated.

## 1.4 Target users and jobs-to-be-done

| User | Main job | Agri2Value value |
|---|---|---|
| Farmer | Decide where/how to sell harvest and avoid losses | Compare feasible net returns; coordinate execution; track actual payment |
| Buyer / trader | Discover suitable produce and make offers | Structured listings, quantity/quality/location details and offer workflow |
| Processor | Source suitable raw material | Crop/quantity matching and processing feasibility information |
| Transporter | Find loads and routes | Transport requests, load aggregation and booking records |
| Equipment / storage owner | Offer spare capacity | Service listing, availability and booking requests |
| FPO / farmer group | Aggregate produce and resources | Collective selling and shared logistics workflows |
| Admin / operations | Maintain platform quality | Verify accounts/listings, review reports, manage data quality |

The hackathon MVP should focus on the farmer journey first. Other roles can have simple dashboards or admin-managed test workflows.

## 1.5 Product principles

1. **Farmer control:** recommendations are advisory; the farmer chooses whether to proceed.
2. **Net profit over headline price:** include all material costs and feasible quantities.
3. **Feasibility before ranking:** an impossible option must not win just because its estimated margin is high.
4. **Explainability:** show why an option ranks first and what assumptions could change the result.
5. **Evidence and provenance:** every price, offer, prediction and sensor reading has a source and timestamp.
6. **No false certainty:** use ranges or confidence labels where data is incomplete.
7. **Local usability:** simple language, mobile-first interface, Marathi/Hindi/English support where available, and voice as an enhancement.
8. **Graceful fallback:** allow manual entry if a sensor or external data source is unavailable.
9. **Privacy and consent:** collect only required data and obtain consent before sharing farm or transaction details.
10. **Build for proof:** prefer fewer complete workflows over many mock screens.

## 1.6 Proposed product pillars

These preserve the five pillars in the submitted PPT while sharpening their roles.

### Pillar A — Smart Profit Decision Engine

Compares raw selling and value-addition options using expected revenue, processing yield, packaging, transport, demand, time, risk and feasibility. It produces a ranked, explainable recommendation.

### Pillar B — AI-Powered Farm Intelligence

Combines farmer-provided farm/crop information with optional weather, sensor and crop-health signals. It supplies relevant context to the decision engine; it does not become an unrelated collection of AI demos.

### Pillar C — Smart Market and Execution Network

Connects farmers to mandis, direct buyers, processors, transport, storage, labour and equipment. It turns an approved recommendation into requests, offers and bookings.

### Pillar D — Farmer Protection and Financial Support

Supports contract clause explanation, payment tracking, transaction evidence, scheme information and profit reconciliation. It must not represent AI-generated legal analysis as professional legal advice.

### Pillar E — Water and Resource Resilience

Uses soil-moisture and environmental signals to support irrigation decisions and improves access to shared resources. Pump control, if demonstrated, requires manual override and electrical safety safeguards.

## 1.7 Proposed differentiators

These are the design choices we should emphasize. They are not claims that the underlying technologies do not exist elsewhere.

- **Decision-to-execution loop:** recommendation, resource check, buyer/transport coordination, transaction and actual-result recording in one flow.
- **Feasibility-aware profit ranking:** reject or downgrade options that cannot be executed under the farmer's real constraints.
- **Crop Rescue Mode:** urgent alternative routing when produce is at risk from perishability, buyer cancellation, delay or a sharp market change.
- **Expected-versus-actual profit reconciliation:** learn from the difference between estimates and completed transactions.
- **Evidence-backed trust:** retain offer, quantity, agreed price, delivery and payment status records with consent.

## 1.8 MVP scope and non-goals

### Recommended MVP

- One pilot geography selected by the team.
- One primary crop selected based on team access to data and a credible demonstration.
- Farmer profile and harvest entry.
- Raw sale, alternative buyer and one processing alternative (where credible data exists).
- Net-profit estimate with visible assumptions.
- Feasibility checks for buyer, processing capacity, transport, time and capital.
- Basic buyer/processor and transport request flow.
- Transaction record and actual-profit tracker.
- One supporting intelligence module: either crop disease classification or an ESP32 sensor/irrigation demonstration. A second can be included only if it is reliable.
- Crop Rescue Mode demonstrated as a decision workflow using clearly labelled test data if live partners are unavailable.

### Out of scope for first release

- Nationwide all-crop coverage.
- Guaranteed price forecasting.
- Fully automated insurance claims or legal decisions.
- Unverified live integrations presented as complete.
- Complex satellite-derived insurance evidence unless a working, defensible pipeline exists.
- Automatic payment settlement or autonomous pump control.

## 1.9 Success metrics

Measure product quality, not just feature count.

- **Decision correctness:** test calculations match independently calculated expected values.
- **Feasibility correctness:** infeasible options are never recommended as executable.
- **Data freshness:** percentage of displayed live values with a valid timestamp and source.
- **Execution completion:** percentage of accepted recommendations that reach a recorded delivery/payment outcome in test scenarios.
- **Profit estimate error:** difference between predicted and actual net profit, when actual transaction data exists.
- **User comprehension:** farmer/tester can explain why the recommended option was chosen.
- **Task completion time:** time to enter harvest and compare options.
- **Accessibility:** key tasks work with simple language and without mandatory typing-heavy workflows.

Do not invent target accuracy or income uplift percentages. Establish baselines from tests and label any pilot results with sample size and method.
