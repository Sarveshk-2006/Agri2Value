# 02 — Detailed Feature Specifications

This file defines the product modules, their purpose, inputs, outputs, key logic, dependencies and acceptance criteria. **P0** means required for the first convincing end-to-end prototype; **P1** means valuable supporting capability; **P2** means later expansion.

## 2.1 Feature map

| Feature | Priority | Product role |
|---|---:|---|
| Farmer identity and farm profile | P0 | Establishes user and context |
| Harvest / crop lot management | P0 | Defines the transaction being optimized |
| Profit Decision Engine | P0 | Core intelligence |
| Buyer / processor discovery and offers | P0 | Makes options actionable |
| Transport request and booking | P0 | Checks execution feasibility |
| Transaction and actual-profit tracker | P0 | Closes the loop |
| Crop Rescue Mode | P0 demo / P1 operational | Distinctive urgent workflow |
| Contract explanation and evidence log | P1 | Trust and protection |
| Crop-health intelligence | P1 | Adds crop condition context |
| IoT water / soil sensing | P1 | Demonstrates water resilience |
| Farmer resource exchange / group loads | P1 | Improves resource access |
| Voice / local-language interaction | P1 | Accessibility |
| Satellite / advanced analytics | P2 | Scale-up capability |
| Scheme / claims workflow | P2 | Broader farmer support |

## 2.2 Farmer identity, onboarding and farm profile (P0)

**Purpose:** create a reusable, practical farm profile without burdening the farmer with excessive onboarding.

**Inputs:** name or display name, mobile number, preferred language, village/area, optional GPS consent, farm identifier, crop(s), approximate land area, irrigation type, optional available resources.

**Requirements:**
- Mobile-first sign-in. OTP is preferred if a real provider is available; a demo OTP must be clearly marked as demo-only.
- Do not store plaintext OTPs or passwords.
- Ask for location permission only when needed; allow manual village/market selection.
- Allow the farmer to edit profile details.
- Distinguish required from optional fields.
- Avoid asking for sensitive identity or bank information unless the product truly needs it.

**Acceptance criteria:**
- A user can create and reopen a farmer profile.
- The app does not require GPS to proceed.
- Preferred language and basic farm context persist.
- Demo authentication cannot be mistaken for production security.

## 2.3 Farm Digital Profile / Digital Twin (P0)

**Purpose:** maintain a structured snapshot of the farm and current crop lot that powers decisions. For the MVP, “digital twin” means a data-backed farm representation, not a 3D simulation.

**Farm-level fields:** location, approximate area, soil type if known, irrigation method, water source, available equipment, storage access and preferred markets.

**Crop-lot fields:** crop, variety if known, planted/harvest date, growth stage, expected or actual quantity, quality/grade, moisture/condition if known, harvest urgency, storage status and photos.

**Behaviour:**
- Keep farm profile and harvest lot separate. A farm can have multiple crop lots.
- Record who entered each value and when.
- Support unknown values rather than forcing guesses.
- Allow farmer confirmation before using estimates in profit calculations.

**Acceptance criteria:** a farmer can create a harvest lot and see which fields are missing or estimated before starting a recommendation.

## 2.4 Harvest and crop-lot management (P0)

A crop lot is the unit of analysis for a selling/processing decision.

**Minimum fields:** crop, quantity and unit, harvest date, location, quality/grade (optional), expected sale deadline or urgency, photos (optional), farmer notes.

**Rules:**
- Normalize internal quantity to a canonical unit (e.g. kg) while preserving the farmer's entered unit.
- Validate positive quantity and valid date.
- Do not assume quality grade from an image unless a validated model exists.
- Permit partial allocation: e.g. 600 kg to buyer A and 400 kg to processor B, but do not double-count inventory.

**Acceptance criteria:** lot quantity is traceable through offers, bookings, delivery and final reconciliation.

## 2.5 Profit Decision Engine (P0 — core feature)

**Purpose:** compare feasible crop value paths using a consistent cost model.

**Candidate options:**
1. Sell immediately to a local market/trader.
2. Sell to an alternative buyer/direct buyer.
3. Process into a specified product.
4. Store and sell later (only if storage, safe holding time and price scenario are credible).
5. Aggregate with other farmers for collective sale or shared transport.

**Inputs:** crop lot, price/offer sources, processing yield and capacity, labour, packaging, energy, transport, commissions, storage, expected loss/spoilage, time, capital requirement, buyer demand and farmer constraints.

**Outputs:** ranked options, expected gross revenue, itemized costs, expected net profit, net profit per kg, time to realization, feasibility status, confidence/data quality, key assumptions and explanation.

**Acceptance criteria:**
- A calculation can be reproduced from the displayed input values.
- The system does not rank a hard-infeasible option as the best executable option.
- Missing costs are visible; no hidden zero-cost assumptions.
- User can edit uncertain cost assumptions and recalculate.
- Results show source and timestamp for market/offer values.

See `04_PROFIT_DECISION_ENGINE.md` for formulas and examples.

## 2.6 Smart Market Network (P0)

**Purpose:** show actionable buyers and processors, not just names or contact cards.

**Buyer listing fields:** buyer name/type, accepted crops, quality requirements, quantity range, location, indicative or offered price, pickup/delivery terms, offer expiry, payment terms, verification status and contact workflow.

**MVP behaviour:**
- Use a small seeded buyer/processor directory if real partners are unavailable, clearly labelled “demo listing”.
- Allow farmer to request an offer or express interest.
- Buyer can submit an offer with quantity, price, expiry and terms.
- Farmer accepts, rejects or asks for clarification.
- Do not label an indicative price as a confirmed offer.

**Acceptance criteria:** an option only becomes “buyer-confirmed” after a buyer offer is recorded and accepted by the farmer.

## 2.7 Smart Execution Network (P0)

**Purpose:** check and coordinate resources required to execute the selected option.

**Resources:** transport, processor, storage, equipment, labour and collection point.

**MVP behaviour:**
- Farmer selects a preferred option.
- App lists missing prerequisites.
- Farmer submits a request for the required service.
- Provider/admin confirms availability (manual confirmation is acceptable for prototype).
- A booking record stores date/time, quantity, estimated cost, status and provider.
- A failed booking triggers re-evaluation or another option; it must not silently remain “feasible”.

**Acceptance criteria:** the app distinguishes requested, confirmed, cancelled and completed services.

## 2.8 Shared transport and collective selling (P1)

**Purpose:** reduce per-unit logistics cost by combining compatible loads.

**Matching constraints:** crop compatibility, pickup radius, quantity, vehicle capacity, delivery deadline, route, quality/segregation requirements and participant consent.

**MVP simulation:** create a group load from two or more test farmers and calculate the per-farmer cost allocation. Clearly label route and cost as estimates until confirmed by a transporter.

**Acceptance criteria:** total vehicle capacity is not exceeded; each farmer's share and cost allocation are visible; a farmer can decline group participation.

## 2.9 Crop Rescue Mode (P0 demo / P1 real workflow)

**Purpose:** respond when a harvest is at risk and the normal selling plan is no longer viable.

**Trigger examples:** buyer cancellation, approaching spoilage deadline, delayed transport, market price drop, rejected quality, unexpected crop damage or storage failure.

**Flow:**
1. Farmer activates Rescue Mode or a system event suggests it.
2. App asks only essential urgent questions: remaining quantity, condition, time left, location and current offer if any.
3. System re-evaluates feasible options with urgency and spoilage risk weighted appropriately.
4. Shows actions ordered by time-to-execute and expected net recovery, not price alone.
5. Farmer chooses an action; app creates buyer/processor/transport requests.
6. Outcome is recorded.

**Important:** do not claim the system can prevent spoilage or guarantee a buyer. It prioritizes available options and helps coordinate a response.

**Acceptance criteria:** a buyer-cancelled lot can be re-evaluated and a second option selected without duplicating or losing inventory.

## 2.10 Crop and disease intelligence (P1)

**Purpose:** provide a supporting crop-health signal that may affect harvest quality, urgency or farm decisions.

**MVP scope:** one crop and a small, explicitly supported set of classes, if a trained and tested model exists.

**Requirements:**
- Show model-supported crop/classes and limitations.
- Display prediction confidence and an “uncertain / seek expert confirmation” state.
- Keep original image and prediction metadata only with consent.
- Do not make pesticide dosage or treatment recommendations unless backed by reliable, crop-specific agronomic guidance.
- Record model version and inference timestamp.

**Acceptance criteria:** unknown or low-confidence images do not receive a confident diagnosis.

## 2.11 Water and IoT intelligence (P1)

**Purpose:** demonstrate water-resilience support using actual sensor readings where available.

**Possible hardware:** ESP32 with soil-moisture sensor; optional temperature/humidity sensor; optional relay and pump for a controlled bench demonstration.

**Requirements:**
- Show value, unit, device ID, timestamp and connection status.
- Calibrate soil-moisture readings against the actual sensor and soil conditions; do not use arbitrary thresholds as universal agronomic truth.
- Allow manual override.
- If pump control is shown, include electrical isolation, enclosure, emergency stop/manual switch and fail-safe default OFF.
- Sensor loss must not be interpreted as dry soil.

**Acceptance criteria:** stale/offline sensor state is clearly visible and does not trigger automatic irrigation.

## 2.12 Farmer Protection: contract assistant and evidence log (P1)

**Purpose:** help a farmer understand a proposed agreement and preserve the transaction details.

**Possible checks:** parties, crop/grade, quantity, price, measurement method, pickup/delivery, quality rejection, payment deadline, deductions, penalties, cancellation, dispute process and signatures.

**Behaviour:**
- OCR extracts text from uploaded agreement images/PDFs.
- Rules and/or an LLM identify clauses that deserve attention.
- Every flagged item includes the source clause or page/paragraph where possible.
- Use cautious labels: “potential concern”, “missing detail”, “clarify before signing”.
- Do not say a contract is legally valid/invalid or provide definitive legal advice.
- Farmer can correct OCR errors and export a summary.

**Evidence log:** store accepted offer, agreed quantity/price, delivery confirmation, deductions, invoice/receipt and payment status with role-based access.

**Acceptance criteria:** a tester can see which clause was flagged and why; the app explicitly advises independent professional review for consequential agreements.

## 2.13 Actual Profit Tracker (P0)

**Purpose:** compare the engine's estimate with the completed transaction.

**Inputs:** actual delivered quantity, actual selling price, actual costs, deductions, rejected quantity, payment received and pending amount.

**Outputs:** realized gross revenue, realized cost, realized net profit, profit per kg, variance from estimate and reason categories.

**Acceptance criteria:** actual profit is calculated from transaction records and is not overwritten by the estimate. Partial payments and partial deliveries are supported.

## 2.14 Accessibility and local language (P1)

- Provide short, plain-language labels and explain financial terms.
- Support Marathi/Hindi/English interface strings where translations are available and reviewed.
- Voice input can fill structured fields but must show a confirmation screen before saving.
- Text-to-speech can read recommendations and alerts.
- Do not assume voice recognition is correct; allow edit/confirm.
- Consider low bandwidth: compact pages, cached non-sensitive reference data and graceful retry.

## 2.15 Admin and data operations (P0)

Admin capabilities: manage demo users, verify/disable listings, seed test market data, view failed bookings, inspect data freshness, review user reports and label demo data.

Admin must not silently alter a farmer's transaction history. Changes to sensitive records should be auditable.

## 2.16 Notifications (P1)

Possible notifications: offer received, offer expiring, booking confirmed/cancelled, delivery due, payment pending, sensor offline and urgent crop-risk reminder. Use in-app notifications for MVP; SMS/WhatsApp integration only with consent and a real provider.
