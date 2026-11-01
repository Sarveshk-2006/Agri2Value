# 03 — End-to-End User Journeys and Workflows

## 3.1 Primary journey: harvest to verified profit

This is the main product workflow and should be the central hackathon demo.

### Stage 1 — Farmer enters a harvest

1. Farmer signs in.
2. Selects or creates a farm profile.
3. Creates a crop lot: crop, quantity, location, harvest date, quality if known and urgency.
4. App displays missing or estimated information.
5. Farmer confirms the values used for analysis.

**System records:** farmer ID, farm ID, crop lot ID, entered values, units, timestamps and provenance.

### Stage 2 — Agri2Value prepares the decision context

1. Retrieve market references available for the crop and selected markets.
2. Retrieve buyer/processor offers from the platform.
3. Read farm resource profile: storage, equipment, transport access, water/crop context where relevant.
4. Apply farmer constraints: cannot travel, needs payment quickly, cannot invest capital, must sell by a date, etc.
5. Mark stale or missing data.

**System rule:** no source value is presented as live unless it was successfully retrieved and timestamped.

### Stage 3 — Decision engine compares options

1. Generate candidate options.
2. Estimate quantity saleable under each option.
3. Calculate revenue and itemized costs.
4. Check hard constraints and required services.
5. Estimate uncertainty and time to completion.
6. Rank feasible options and show non-feasible options separately with reasons.
7. Explain what could change the recommendation.

### Stage 4 — Farmer selects a path

The farmer reviews the recommended option and alternatives. The farmer can:
- Accept a buyer offer.
- Request a new buyer offer.
- Request a processing slot.
- Request transport.
- Choose raw sale if it is safer or faster.
- Re-enter costs or constraints and recalculate.

The farmer must explicitly approve actions that create requests or bookings.

### Stage 5 — Execution confirmation

The platform records each prerequisite:
- Buyer offer accepted.
- Processor availability confirmed (if relevant).
- Transport booking confirmed.
- Quantity and pickup/delivery details agreed.
- Agreement/receipt attached if used.

An option is marked **ready to execute** only when its required conditions are confirmed. If a condition fails, the engine re-runs the comparison.

### Stage 6 — Delivery and payment

1. Record dispatch quantity and time.
2. Record delivered quantity and any rejection/deduction.
3. Record agreed and actual selling price.
4. Record transport, processing, packaging, labour and other actual costs.
5. Track amount paid and amount pending.
6. Attach invoice/receipt or proof if the farmer chooses.

### Stage 7 — Actual profit and learning

Calculate realized net profit and compare it with the estimate. Ask for reason codes for significant variance: price changed, quantity rejected, transport cost increased, processing yield differed, delay, buyer deduction or other.

The system may use this history to improve future estimates, but it must not automatically treat one farmer's data as public or share it with other users without consent.

## 3.2 Decision states

Suggested state machine for a crop lot:

`DRAFT → READY_FOR_ANALYSIS → ANALYZED → OPTION_SELECTED → REQUESTS_PENDING → READY_TO_EXECUTE → IN_PROGRESS → DELIVERED → PAYMENT_PENDING → COMPLETED`

Alternative terminal or recovery states:

- `CANCELLED`
- `EXPIRED`
- `BLOCKED` (missing or failed prerequisite)
- `RESCUE_REQUIRED`
- `PARTIALLY_COMPLETED`

Do not allow invalid jumps. For example, `COMPLETED` requires delivery and payment reconciliation rules to be satisfied; if payment is only partial, use `PAYMENT_PENDING` or `PARTIALLY_COMPLETED`.

## 3.3 Crop Rescue Mode journey

**Scenario:** a buyer cancels after harvest, and the crop has limited safe holding time.

1. Farmer opens the affected crop lot and selects “Buyer cancelled” or “Need urgent sale”.
2. App asks for remaining quantity, current condition, location and approximate time remaining.
3. System marks previous buyer offer as cancelled; it does not delete the record.
4. Candidate options are regenerated:
   - another buyer already listed;
   - nearby market route;
   - processor with available capacity;
   - group transport / shared load;
   - short-term storage only if safe capacity and timing are confirmed.
5. Options are ranked by expected recoverable net value, feasibility and time.
6. Farmer chooses an option.
7. Platform creates the required requests and tracks confirmation.
8. Outcome is recorded, including any loss avoided or actual loss if known.

**Key UX requirement:** display urgency clearly but do not use alarming language or imply guaranteed rescue.

## 3.4 Buyer journey

1. Buyer signs in or is represented by a verified admin-managed listing in the MVP.
2. Buyer creates a requirement: crop, grade, quantity range, location, delivery window, price/offer method and payment terms.
3. Farmer sees the requirement only if it is relevant to the crop lot and geography.
4. Buyer submits an offer or responds to a farmer request.
5. Farmer accepts/rejects/counters.
6. Accepted offer becomes the commercial basis for execution records.
7. Buyer confirms received quantity and quality; discrepancies are recorded, not silently overwritten.

## 3.5 Transporter journey

1. Transporter lists vehicle type, capacity, service area, availability and pricing basis.
2. Farmer requests transport with pickup, destination, crop, quantity, packaging and time window.
3. System checks capacity and compatibility.
4. Transporter confirms or rejects.
5. Booking status progresses through requested, confirmed, picked up, delivered or cancelled.
6. Actual cost and delivery time are recorded for profit reconciliation.

For a prototype, admin confirmation can stand in for a real transporter account, but the UI must say “pending confirmation” until confirmed.

## 3.6 Processor journey

1. Processor lists accepted raw crops, input quality, capacity, output product, expected yield range, processing cost, packaging requirements and availability.
2. Engine estimates processed quantity using the configured yield assumption/range.
3. Processor confirms capacity and price/cost.
4. Farmer accepts the option only after buyer demand or a credible output sales route is known.
5. Processing output, actual yield, cost and sale are recorded.

**Critical rule:** do not recommend processing based solely on a higher output price. Include yield loss, processing cost, packaging, buyer demand, working capital, time and spoilage.

## 3.7 FPO / collective selling journey

1. Farmers opt in to a group sale or shared transport request.
2. System checks crop, grade, quantity, pickup radius, delivery time and vehicle capacity.
3. A group lot is created with per-farmer allocations.
4. Buyer makes an offer for total quantity or defined sub-lots.
5. Each farmer sees their estimated proceeds and cost allocation.
6. Each farmer independently consents.
7. Delivery and payment are reconciled per farmer.

## 3.8 Water/IoT journey

1. ESP32 sends sensor readings with device ID, timestamp and sequence number.
2. Backend validates device identity, units, range and freshness.
3. Dashboard shows last reading and connection state.
4. A configured rule may produce an irrigation suggestion.
5. Farmer reviews and confirms. Any pump actuation requires a separately designed safe control workflow and manual override.

Sensor readings should not be directly mixed into the crop-sale profit calculation unless they have a clear, documented effect on yield, quality, timing or cost.

## 3.9 Contract assistant journey

1. Farmer uploads a contract or image with consent.
2. OCR extracts text and page references.
3. Farmer can correct extraction errors.
4. Rule-based checks identify required commercial terms and potential concerns.
5. Language model, if used, summarizes the clause in the farmer's preferred language and points to source text.
6. Farmer sees “clarify before signing” items and a clear legal-advice limitation.
7. The accepted offer and transaction facts are stored separately from the extracted contract.

## 3.10 Exception handling

| Exception | Expected behaviour |
|---|---|
| Market data unavailable | Show last known value with timestamp or ask for manual input; mark stale |
| Buyer cancels | Preserve cancelled offer; trigger re-analysis / Rescue Mode |
| Transport unavailable | Mark option blocked; search another provider or re-rank |
| Sensor offline | Show offline/stale state; never infer a moisture value |
| Crop image low confidence | Ask for another image or expert confirmation |
| OCR poor quality | Show extraction confidence and allow manual correction |
| Partial delivery | Keep delivered and remaining quantities separate |
| Partial payment | Track received and pending amounts separately |
| Farmer changes quantity | Recalculate and invalidate incompatible requests if needed |
| Two farmers reserve same capacity | Use transactional capacity reservation to prevent overbooking |
