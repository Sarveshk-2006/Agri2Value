# 06 — Data, AI, IoT and External Integrations

## 6.1 Data strategy

Agri2Value depends on data quality. A sophisticated model cannot rescue incorrect or stale price, cost, quantity, yield or availability inputs.

For every data item, store:
- value and unit;
- source/provider;
- observation time and ingestion time;
- geographic coverage;
- crop/grade/market context;
- data mode: live, farmer-entered, sensor, model-estimated or demo;
- confidence/quality status where meaningful;
- license/terms and permitted use where applicable.

## 6.2 Data categories

| Category | Use in product | MVP method |
|---|---|---|
| Farmer/farm profile | Constraints and context | User-entered |
| Crop lot | Quantity, quality, urgency | User-entered, optional photo |
| Market price | Raw-sale scenario | Approved source or timestamped demo data |
| Buyer offer | Alternative sale | Platform offer record |
| Processing yield/cost | Value-add scenario | Verified processor input or clearly labelled assumptions |
| Transport cost/availability | Execution and net profit | Provider quote or demo listing |
| Weather | Context and alerts | Weather provider/API where available |
| Soil moisture | Irrigation support | ESP32 sensor |
| Crop disease image | Supporting crop-health signal | Validated crop-specific model |
| Contract text | Clause explanation | OCR + rules/LLM |
| Satellite imagery | Later crop/area evidence | P2 unless pipeline validated |

## 6.3 Market data

Potential source categories include official mandi/AGMARKNET data, e-NAM information where accessible and permitted, market boards, verified buyer offers and farmer-entered quotes. The exact source and API availability must be checked by the team before implementation.

Rules:
- Store market, commodity, variety/grade, unit and observation date.
- Convert units carefully and retain original units.
- Do not compare different grades as if identical.
- Show whether the value is modal, minimum/maximum, indicative or a buyer offer.
- Show last-updated time.
- Do not infer a guaranteed future price from historical data.
- If no fresh price exists, show stale status and ask the farmer for a current quote.

## 6.4 Weather and location

Weather may inform harvest timing, crop risk and logistics context. It should not be used as a substitute for agronomic advice. Location services should support manual entry and farmer consent. For maps, use geocoding and routing services with attention to terms, quotas and accuracy.

## 6.5 Crop AI / disease detection

### Scope selection

Pick one crop that the team can obtain representative images for. Define a limited class set and include a healthy/unknown class only if the dataset supports it.

### Pipeline

1. Farmer captures/uploads image.
2. Backend validates file and image quality.
3. Preprocessing matches training conditions.
4. Model predicts class scores.
5. Confidence and out-of-distribution checks are applied.
6. Result includes supported class, confidence, model version and timestamp.
7. Low confidence routes to “uncertain — seek expert confirmation”.

### Evaluation

Report a confusion matrix, per-class precision/recall/F1, test-set composition and limitations. Avoid relying on overall accuracy alone, especially with imbalanced classes. Keep test images separate from training images. Test images from the same plant/session should not leak across train/test splits.

### Safety

Do not output definitive pesticide prescriptions from a classification model. Any treatment guidance must be reviewed against reliable crop-specific agronomic sources and local regulations.

## 6.6 Contract OCR and explanation

Pipeline:
1. Upload PDF/image with consent.
2. Malware/file validation and size limits.
3. OCR text extraction with page/region references.
4. OCR quality check; allow corrections.
5. Rule-based detection for key fields (price, quantity, grade, deductions, payment deadline, penalties, cancellation, dispute process).
6. Optional LLM explanation grounded only in extracted text.
7. Show flagged clause, source text and reason.
8. Export a farmer-friendly summary.

LLM guardrails:
- Do not invent clauses or legal effects.
- Quote/point to the source text.
- Distinguish missing clause from risky clause.
- State uncertainty when OCR is poor.
- Do not make a final legal-validity judgment.
- Do not send documents to an external model provider without appropriate user consent and data controls.

## 6.7 IoT design

### Recommended prototype hardware

- ESP32 development board.
- Capacitive soil-moisture sensor (calibrated for demo soil).
- Optional temperature/humidity sensor.
- Optional relay + low-voltage demonstration pump only if safely assembled.

### Telemetry payload example

```json
{
  "device_id": "demo-field-01",
  "sequence": 184,
  "observed_at": "2026-11-01T10:30:00+05:30",
  "soil_moisture_raw": 2180,
  "soil_moisture_percent": 42.5,
  "air_temperature_c": 29.1,
  "air_humidity_percent": 61.0
}
```

This is an illustrative schema, not a real device reading. The backend should validate the device, sequence, timestamp, ranges and units.

### Device reliability

- Device authentication/token rotation.
- Sequence number or message ID to avoid duplicate processing.
- Heartbeat / last-seen timestamp.
- Stale-data threshold configured for the device.
- Calibration record for sensor.
- Manual override and fail-safe behaviour.
- No pump activation on missing/stale sensor readings.

### Irrigation logic

For MVP, display moisture trend and a configurable advisory threshold set for the demonstration context. Do not claim a universal threshold works for all crops/soil types. If pump control is shown, keep actuation separate from prediction and require an explicit farmer action.

## 6.8 Satellite / drone imagery

The submitted PPT mentions satellite/drone imagery and satellite-backed evidence as a proposed capability. Treat this as future scope unless the team has a verified pipeline. A credible pipeline would need:
- imagery source and licensing;
- cloud masking and image quality checks;
- field boundary/parcel identification;
- vegetation index calculation and temporal comparison;
- ground-truth validation;
- clear limitations for crop type, resolution, cloud cover and interpretation.

Do not present an NDVI screenshot as proof of crop damage or insurance eligibility. That requires a validated method and insurer/regulatory acceptance.

## 6.9 Local language and voice

- Store UI translations in resource files, not hardcoded strings.
- Have a fluent speaker review critical financial and contract terminology.
- Voice input should produce a draft field value and ask for confirmation.
- Read critical numbers slowly and repeat units/currency.
- Provide a text alternative for all voice features.

## 6.10 Data governance

- Obtain consent before collecting precise location, crop images, contracts or transaction details.
- Explain why each data field is required.
- Restrict access by role and ownership.
- Encrypt traffic and use secure storage controls.
- Define retention/deletion practices for documents and images.
- Do not expose farmer contact details or transaction values to other users without consent.
- Use anonymized/aggregated data for analytics only when re-identification risk is addressed.
- Maintain audit logs for sensitive access and changes.

## 6.11 Data-source validation checklist

Before connecting any external source, record:
- Is the source official or otherwise credible?
- Is programmatic access available?
- What are the terms, rate limits and attribution requirements?
- What exact commodity/grade/market/unit does it cover?
- How frequently does it update?
- Can values be cached?
- What happens when it fails?
- Does it permit commercial use or hackathon demonstration?

Do not scrape or redistribute data in breach of source terms.
