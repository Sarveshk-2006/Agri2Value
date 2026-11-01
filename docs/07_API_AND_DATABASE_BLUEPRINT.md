# 07 — Suggested Database and API Blueprint

This is a logical starting schema. Adapt field names and relationships to the team's framework. Use migrations and constraints; do not create every table if the corresponding feature is not in the MVP.

## 7.1 Core entities

### `users`
- `id` (UUID, primary key)
- `phone` (unique, nullable if alternate auth)
- `display_name`
- `role`
- `preferred_language`
- `auth_provider_id`
- `is_active`
- `created_at`, `updated_at`

### `farms`
- `id`
- `owner_user_id` → users
- `farm_name`
- `village`, `district`, `state`
- `latitude`, `longitude` (nullable; consent-based)
- `area_value`, `area_unit`
- `soil_type` (nullable)
- `irrigation_type` (nullable)
- `water_source` (nullable)
- `created_at`, `updated_at`

### `farm_resources`
- `id`
- `farm_id` → farms
- `resource_type` (storage, equipment, labour, vehicle, processing access, etc.)
- `description`
- `capacity_value`, `capacity_unit`
- `availability_status`
- `source_type` (farmer, provider, admin, demo)

### `crop_lots`
- `id`
- `farm_id` → farms
- `owner_user_id` → users
- `crop_name`, `variety`
- `quantity_value`, `quantity_unit`, `quantity_kg_normalized`
- `quality_grade`, `condition_notes`
- `harvest_date`, `expected_sale_by`
- `location_text`
- `status`
- `data_mode` (real/demo)
- `created_at`, `updated_at`

### `crop_lot_events`
- `id`, `crop_lot_id`
- `event_type` (created, quantity_changed, buyer_cancelled, rescued, dispatched, delivered, etc.)
- `event_payload` (JSON)
- `actor_user_id`
- `created_at`

### `market_observations`
- `id`
- `crop_name`, `variety_or_grade`
- `market_name`, `district`, `state`
- `price_min`, `price_modal`, `price_max`
- `price_unit`, `normalized_price_per_kg`
- `observed_at`, `ingested_at`
- `source_name`, `source_reference`
- `data_mode`, `freshness_status`

### `buyers`
- `id`, `user_id` (nullable for admin-managed demo listing)
- `business_name`, `buyer_type`
- `service_location`, optional coordinates
- `verification_status`
- `contact_method` (protected)
- `is_active`

### `buyer_requirements`
- `id`, `buyer_id`
- `crop_name`, `grade_requirements`
- `min_quantity`, `max_quantity`, `quantity_unit`
- `delivery_location`
- `delivery_window_start`, `delivery_window_end`
- `price_method`, `indicative_price`
- `payment_terms`
- `availability_status`, `expires_at`

### `offers`
- `id`, `crop_lot_id`, `buyer_id`
- `quantity_offered`, `quantity_unit`
- `price_per_unit`, `price_unit`
- `pickup_or_delivery_terms`
- `payment_terms`
- `expires_at`
- `status` (draft, sent, received, accepted, rejected, expired, cancelled)
- `created_at`, `updated_at`

### `processors`
- `id`, `user_id` (nullable for demo)
- `business_name`, `location`, `verification_status`
- `is_active`

### `processing_capabilities`
- `id`, `processor_id`
- `input_crop`, `input_quality_requirements`
- `output_product`
- `yield_min`, `yield_base`, `yield_max`
- `capacity_per_day`, `capacity_unit`
- `processing_cost_basis`, `processing_cost_value`
- `packaging_requirements`
- `availability_window`
- `source_type`, `verified_at`

### `providers`
- `id`, `user_id` (nullable for demo)
- `provider_type` (transporter, storage, equipment, labour)
- `business_name`, `location`, `verification_status`
- `is_active`

### `provider_capacities`
- `id`, `provider_id`
- `capacity_value`, `capacity_unit`
- `service_area`
- `availability_start`, `availability_end`
- `price_basis`, `price_value`

### `decision_runs`
- `id`, `crop_lot_id`, `created_by_user_id`
- `engine_version`
- `input_snapshot` (JSON)
- `status`
- `created_at`

### `decision_options`
- `id`, `decision_run_id`
- `option_type`
- `gross_revenue`
- `total_cost`
- `net_profit`
- `net_profit_per_kg`
- `currency`
- `feasibility_status`
- `confidence_label`
- `rank`
- `explanation`
- `assumptions` (JSON)
- `cost_breakdown` (JSON)

### `service_requests`
- `id`, `crop_lot_id`, `decision_option_id`
- `service_type` (transport, processing, storage, equipment, labour)
- `requested_by_user_id`
- `provider_id` (nullable)
- `requested_quantity`, `unit`
- `requested_window`
- `estimated_cost`
- `status` (requested, confirmed, rejected, cancelled, completed)
- `created_at`, `updated_at`

### `bookings`
- `id`, `service_request_id`
- `provider_confirmation_reference`
- `confirmed_cost`
- `pickup_time`, `delivery_time`
- `status`

### `transactions`
- `id`, `crop_lot_id`, `decision_option_id`
- `buyer_id`
- `agreed_quantity`, `delivered_quantity`, `rejected_quantity`
- `agreed_price`, `actual_price`, `price_unit`
- `delivery_status`, `payment_status`
- `created_at`, `completed_at`

### `transaction_costs`
- `id`, `transaction_id`
- `cost_type`, `description`
- `estimated_amount`, `actual_amount`
- `currency`, `paid_by`, `source_reference`

### `payments`
- `id`, `transaction_id`
- `amount`, `currency`, `payment_date`
- `payment_method_reference` (avoid storing sensitive credentials)
- `status`, `proof_file_id`

### `documents`
- `id`, `owner_user_id`, `crop_lot_id` (nullable), `transaction_id` (nullable)
- `document_type`, `storage_key`, `mime_type`, `file_size`
- `consent_record_id`, `created_at`

### `contract_reviews`
- `id`, `document_id`, `model_version`
- `ocr_text_reference`
- `review_summary`
- `created_at`

### `contract_flags`
- `id`, `contract_review_id`
- `flag_type`, `severity_label`
- `source_text`, `page_number`
- `explanation`, `recommended_question`

### `devices` and `sensor_readings`
- `devices`: `id`, `farm_id`, `device_key_hash`, `device_type`, `calibration_info`, `last_seen_at`, `status`
- `sensor_readings`: `id`, `device_id`, `sequence`, `observed_at`, `received_at`, `metric`, `value`, `unit`, `quality_status`

### `notifications`, `audit_logs`, `consents`
Store notification status, sensitive user actions and consent version/time/purpose.

## 7.2 Data integrity rules

- Use foreign keys and database constraints.
- Store money as `DECIMAL`, not binary float.
- Store quantity with explicit unit and normalized quantity where conversion is valid.
- Use UTC timestamps internally and display local timezone to user.
- Use unique device sequence/message IDs to avoid duplicate telemetry.
- Prevent booking capacity overrun using transactions/locking or atomic capacity reservations.
- Preserve historical offers and decision runs; do not overwrite them when a new offer arrives.
- Separate `estimated_amount` and `actual_amount`.
- Keep source and data mode for external values.

## 7.3 Suggested REST API surface

All endpoints require authentication unless explicitly public. Exact paths are implementation choices.

### Authentication and profile
- `POST /auth/request-otp`
- `POST /auth/verify-otp`
- `GET /me`
- `PATCH /me`

### Farms and crop lots
- `GET /farms`
- `POST /farms`
- `GET /farms/{farm_id}`
- `PATCH /farms/{farm_id}`
- `POST /farms/{farm_id}/crop-lots`
- `GET /crop-lots/{lot_id}`
- `PATCH /crop-lots/{lot_id}`
- `POST /crop-lots/{lot_id}/events`

### Decision engine
- `POST /crop-lots/{lot_id}/decision-runs`
- `GET /decision-runs/{run_id}`
- `GET /decision-runs/{run_id}/options`
- `POST /decision-runs/{run_id}/recalculate`
- `POST /decision-options/{option_id}/select`

### Market and offers
- `GET /buyers?crop=&location=`
- `GET /processors?crop=&location=`
- `POST /crop-lots/{lot_id}/offer-requests`
- `POST /offers`
- `PATCH /offers/{offer_id}/respond`

### Execution
- `POST /decision-options/{option_id}/service-requests`
- `GET /service-requests/{id}`
- `PATCH /service-requests/{id}/status`
- `POST /service-requests/{id}/confirm`
- `GET /crop-lots/{lot_id}/execution-status`

### Rescue
- `POST /crop-lots/{lot_id}/rescue`
- `GET /crop-lots/{lot_id}/rescue-options`

### Transactions and profit
- `POST /crop-lots/{lot_id}/transactions`
- `PATCH /transactions/{id}/delivery`
- `POST /transactions/{id}/costs`
- `POST /transactions/{id}/payments`
- `GET /transactions/{id}/profit-reconciliation`

### Crop AI / documents / IoT
- `POST /crop-health/predict`
- `POST /documents`
- `POST /documents/{id}/contract-review`
- `GET /contract-reviews/{id}`
- `POST /iot/telemetry` (device-authenticated)
- `GET /farms/{farm_id}/sensor-readings`

### Admin
- `GET /admin/data-health`
- `POST /admin/demo-seed`
- `PATCH /admin/listings/{id}/verification`

## 7.4 Example decision request

```json
{
  "crop_lot_id": "lot_uuid",
  "constraints": {
    "must_sell_by": "2026-11-02T18:00:00+05:30",
    "needs_payment_within_days": 3,
    "max_upfront_spend": 5000,
    "can_travel": false
  },
  "include_options": ["raw_local", "direct_buyer", "processing", "collective_sale"],
  "data_mode": "demo"
}
```

Illustrative payload only. Validate and adapt field names to actual implementation.

## 7.5 Example decision response

```json
{
  "decision_run_id": "run_uuid",
  "engine_version": "0.1.0",
  "currency": "INR",
  "options": [
    {
      "type": "direct_buyer",
      "net_profit": 15000,
      "feasibility": "FEASIBLE_PENDING",
      "confidence": "MODERATE_INPUT_CERTAINTY",
      "required_actions": ["Confirm buyer offer", "Confirm transport"],
      "data_mode": "demo"
    }
  ],
  "notice": "Illustrative demo values; confirm all offers and costs before acting."
}
```

## 7.6 API design requirements

- Validate all request bodies and units.
- Return stable error codes and useful user-facing messages.
- Use pagination for listings.
- Add idempotency keys to actions that could create duplicate bookings or payments.
- Enforce ownership and role permissions server-side.
- Version APIs or maintain backward compatibility as the frontend evolves.
- Keep sensitive contact and document data out of broad listing responses.
