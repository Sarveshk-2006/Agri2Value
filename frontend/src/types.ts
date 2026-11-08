// frontend/src/types.ts
export type UserRole = 'FARMER' | 'BUYER' | 'PROCESSOR' | 'TRANSPORTER' | 'RESOURCE_PROVIDER' | 'FPO_MANAGER' | 'ADMIN';

export interface User {
  id: string;
  full_name: string;
  phone: string;
  role: UserRole;
  preferred_language: string;
  is_active: boolean;
  demo_mode?: boolean;
}

export interface FarmResource {
  id: string;
  farm_id?: string;
  resource_type: string;
  name: string;
  quantity?: number;
  unit?: string;
  availability_status: string;
  created_at?: string;
}

export interface Farm {
  id: string;
  owner_user_id: string;
  farm_name: string;
  state: string;
  district: string;
  village: string;
  latitude?: number;
  longitude?: number;
  land_area?: number;
  land_area_unit: string;
  boundary_geojson?: string;
  is_active: boolean;
  resources: FarmResource[];
  created_at: string;
  updated_at: string;
}

export interface CropLotEvent {
  id: string;
  crop_lot_id: string;
  event_type: string;
  description?: string;
  actor_user_id?: string;
  created_at: string;
}

export interface CropLot {
  id: string;
  farm_id: string;
  owner_user_id: string;
  crop_name: string;
  variety?: string;
  quantity: number;
  quantity_unit: string;
  quantity_kg_normalized: number;
  harvest_date?: string;
  quality_grade?: string;
  status: string;
  data_mode: 'real' | 'demo';
  notes?: string;
  events?: CropLotEvent[];
  created_at: string;
  updated_at: string;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  user_id: string;
  full_name: string;
  role: string;
  demo_mode: boolean;
}

// ---- Phase 2 Decision Engine Types ------------------------------

export type RouteType = 'RAW_MANDI' | 'DIRECT_BUYER' | 'PROCESSING' | 'STORAGE' | 'GROUP_SELLING';
export type FeasibilityStatus = 'FEASIBLE' | 'CONDITIONALLY_FEASIBLE' | 'INFEASIBLE' | 'NEEDS_MORE_DATA';
export type AssumptionProvenance = 'VERIFIED' | 'CONFIGURED' | 'ILLUSTRATIVE_BENCHMARK' | 'UNKNOWN';

export interface AssumptionItem {
  name: string;
  value: string | number;
  unit: string;
  provenance: AssumptionProvenance;
  source_description: string;
  is_configurable: boolean;
}

export interface ScenarioVariation {
  scenario_type?: string;
  name: string;
  description: string;
  projected_gross_revenue: number;
  projected_total_costs: number;
  projected_net_profit: number;
  projected_net_profit_per_kg?: number;
  recommended_route?: string;
  net_profit_variance_inr?: number;
  net_profit_variance_pct?: number;
  variance_from_expected?: number;
}

export interface SensitivityAnalysisResult {
  scenarios: ScenarioVariation[];
  key_vulnerabilities: string[];
  recommendation_stability: string;
  sensitivity_summary: string;
}

export interface OutcomeComparison {
  has_actual_outcome: boolean;
  status: string;
  decision_run_id: string;
  crop_lot_id: string;
  recommended_route: string;
  expected_quantity_kg: number;
  expected_unit_price: number;
  estimated_deductions_inr: number;
  estimated_net_profit_inr: number;
  expected_realization_days: number;
  actual_quantity_kg?: number;
  actual_unit_price?: number;
  actual_deductions_inr?: number;
  actual_net_proceeds_inr?: number;
  actual_realization_days?: number;
  quantity_variance_pct?: number;
  price_variance_pct?: number;
  deductions_variance_inr?: number;
  net_profit_variance_inr?: number;
  net_profit_variance_pct?: number;
  comparison_notes: string;
}

export interface CostItem {
  name: string;
  category: string;
  amount: number;
  unit_rate?: number;
  unit_name?: string;
  is_estimated: boolean;
  source?: string;
}

export interface CostBreakdown {
  transport: number;
  labour: number;
  packaging: number;
  commission_and_fees: number;
  processing: number;
  storage: number;
  wastage_loss: number;
  other: number;
  total_costs: number;
  line_items: CostItem[];
}

export interface FeasibilityReasons {
  status: FeasibilityStatus;
  is_feasible: boolean;
  passed_checks: string[];
  failed_checks: string[];
  unmet_prerequisites: string[];
  data_gaps: string[];
}

export interface DecisionOption {
  id: string;
  decision_run_id: string;
  route_type: RouteType;
  route_name: string;
  feasibility_status: FeasibilityStatus;
  rank?: number;
  is_recommended: boolean;
  saleable_quantity: number;
  saleable_quantity_unit: string;
  gross_revenue: number;
  total_costs: number;
  net_profit: number;
  net_profit_per_kg: number;
  effective_realization_per_kg: number;
  additional_profit_vs_baseline: number;
  time_to_payment_days?: number;
  cost_breakdown: CostBreakdown;
  feasibility_reasons: FeasibilityReasons;
  risks_and_confidence: Record<string, any>;
  explanation: string;
  data_source: string;
  data_timestamp: string;
  itemized_assumptions?: AssumptionItem[];
  operational_constraints?: string[];
}

export interface DecisionRun {
  id: string;
  crop_lot_id: string;
  owner_user_id: string;
  algorithm_version: string;
  status: string;
  recommended_option_id?: string;
  recommended_route_type?: string;
  recommended_net_profit?: number;
  baseline_net_profit?: number;
  additional_profit_vs_baseline?: number;
  input_snapshot: {
    lot_id: string;
    crop_name: string;
    variety?: string;
    quantity_kg: number;
    quality_grade?: string;
    harvest_date?: string;
    farm_district?: string;
    farm_village?: string;
    data_source_mode?: string;
    data_mode?: string;
    mandi_name?: string;
    source?: string;
    assumptions_disclosed?: AssumptionItem[];
    sensitivity_preview?: SensitivityAnalysisResult;
  };
  disclaimer: string;
  created_at: string;
  options: DecisionOption[];
  assumptions_disclosed?: AssumptionItem[];
  sensitivity_preview?: SensitivityAnalysisResult;
}

// ---- Weather Interfaces (Phase 2.6) ----

export interface WeatherObserved {
  temperature_c: number;
  apparent_temperature_c: number;
  relative_humidity_pct: number;
  precipitation_mm: number;
  rain_mm: number;
  wind_speed_kmh: number;
  weather_code: number;
  weather_description: string;
  weather_icon: string;
  observed_at: string;
}

export interface DailyForecastItem {
  date: string;
  weather_code: number;
  weather_description: string;
  weather_icon: string;
  temp_max_c: number;
  temp_min_c: number;
  precipitation_sum_mm: number;
  max_wind_speed_kmh: number;
  sunrise?: string;
  sunset?: string;
}

export interface FieldWorkAdvisory {
  status: 'FAVORABLE' | 'CAUTION' | 'UNFAVORABLE' | 'UNKNOWN';
  headline: string;
  reasons: string[];
  disclaimer: string;
}

export interface WeatherResponse {
  latitude: number;
  longitude: number;
  timezone: string;
  is_live: boolean;
  source_type: string;
  attribution: string;
  retrieved_at: string;
  current: WeatherObserved;
  daily_forecast: DailyForecastItem[];
  advisory: FieldWorkAdvisory;
}

// ---- Mandi Interfaces (Phase 2.6) ----

export interface MandiRecord {
  state: string;
  district: string;
  market: string;
  commodity: string;
  variety?: string;
  observation_date: string;
  retrieval_timestamp: string;
  min_price: number;
  max_price: number;
  modal_price: number;
  source_unit: string;
  unit_normalized: boolean;
  normalized_unit?: string;
  normalized_modal_price_per_kg?: number;
  is_live: boolean;
  source_type: string;
  data_source: string;
  is_stale: boolean;
  staleness_warning?: string;
}

export interface MandiPricesResponse {
  records: MandiRecord[];
  total_records: number;
  is_live: boolean;
  data_source: string;
  retrieved_at: string;
  disclaimer: string;
}

export interface MandiQuoteResponse {
  commodity: string;
  market_name: string;
  district: string;
  state: string;
  rate_per_kg: number;
  observation_date: string;
  retrieval_date: string;
  source_unit: string;
  normalized_unit: string;
  is_live: boolean;
  source_type: string;
  data_source: string;
  is_stale: boolean;
  staleness_warning?: string;
}

// ---- Phase 3: Smart Execution Network & Crop Rescue Types --------

export interface BuyerOffer {
  id: string;
  buyer_id: string;
  commodity: string;
  variety?: string;
  accepted_grades: string;
  min_quantity_kg: number;
  max_quantity_kg: number;
  current_fulfilled_kg: number;
  offered_price_per_kg: number;
  price_unit: string;
  logistics_requirement: string;
  payment_terms_days: number;
  valid_until: string;
  status: string;
  data_mode: string;
}

export interface Buyer {
  id: string;
  company_name: string;
  contact_person: string;
  phone: string;
  email?: string;
  district: string;
  state: string;
  address: string;
  buyer_type: string;
  service_radius_km: number;
  is_verified: boolean;
  verification_badge: string;
  rating?: number;
  data_mode: string;
  created_at: string;
  offers: BuyerOffer[];
}

export interface LogisticsProvider {
  id: string;
  provider_name: string;
  contact_phone: string;
  vehicle_type: string;
  capacity_kg: number;
  current_available_capacity_kg: number;
  base_district: string;
  service_districts: string;
  per_km_rate_per_kg: number;
  minimum_fare: number;
  pricing_unit: string;
  is_temperature_controlled: boolean;
  availability_status: string;
  data_mode: string;
  created_at: string;
  latitude?: number;
  longitude?: number;
  verified?: boolean;
  distance_km?: number;
}

export interface ColdStorageFacility {
  id: string;
  facility_name: string;
  contact_phone: string;
  location_district: string;
  location_taluka: string;
  compatible_commodities: string;
  total_capacity_kg: number;
  available_capacity_kg: number;
  storage_rate_per_kg_per_month: number;
  pricing_unit: string;
  min_holding_days: number;
  max_holding_days: number;
  temperature_range_celsius: string;
  humidity_range_pct: string;
  availability_status: string;
  data_mode: string;
  created_at: string;
  latitude?: number;
  longitude?: number;
  verified?: boolean;
  distance_km?: number;
}

export interface ProcessingFacility {
  id: string;
  facility_name: string;
  contact_phone: string;
  facility_type: string;
  accepted_commodities: string;
  accepted_grades: string;
  daily_capacity_kg: number;
  available_capacity_kg: number;
  processing_charge_per_kg: number;
  pricing_unit: string;
  output_recovery_ratio: number;
  output_product_name: string;
  location_district: string;
  location_taluka: string;
  availability_status: string;
  data_mode: string;
  created_at: string;
  latitude?: number;
  longitude?: number;
  verified?: boolean;
  distance_km?: number;
}

export interface ExecutionRequestEvent {
  id: string;
  request_id: string;
  from_status?: string;
  to_status: string;
  actor_user_id?: string;
  actor_role: string;
  message: string;
  metadata_json?: string;
  created_at: string;
}

export interface ExecutionRequest {
  id: string;
  crop_lot_id: string;
  farmer_user_id: string;
  decision_run_id?: string;
  route_type: string;
  status: 'SUBMITTED' | 'PROVIDER_ACCEPTED' | 'CONFIRMED' | 'IN_EXECUTION' | 'COMPLETED' | 'CANCELLED' | 'REJECTED';
  buyer_id?: string;
  buyer_offer_id?: string;
  logistics_provider_id?: string;
  cold_storage_facility_id?: string;
  processing_facility_id?: string;
  requested_quantity_kg: number;
  indicative_unit_price: number;
  indicative_total_value: number;
  indicative_logistics_cost: number;
  indicative_storage_cost: number;
  indicative_processing_cost: number;
  indicative_net_payout: number;
  actual_quantity_kg?: number;
  actual_unit_price?: number;
  actual_gross_revenue?: number;
  actual_logistics_cost?: number;
  actual_storage_cost?: number;
  actual_processing_cost?: number;
  actual_net_payout?: number;
  completion_notes?: string;
  completed_at?: string;
  pickup_location: string;
  delivery_location: string;
  scheduled_date?: string;
  notes?: string;
  data_mode: string;
  created_at: string;
  updated_at: string;
  events: ExecutionRequestEvent[];
}

export interface RescuePathwayOption {
  route_type: string;
  title: string;
  channel_name: string;
  estimated_net_payout: number;
  salvaged_value_pct: number;
  time_to_safety_hours: number;
  capacity_status: string;
  risk_level: string;
  action_button_label: string;
  target_entity_id?: string;
  feasibility_status?: string;
  itemized_deductions?: Array<{
    name: string;
    amount: number;
    rate: number;
    unit: string;
    description: string;
  }>;
  assumptions_disclosed?: AssumptionItem[];
}

export interface CropRescueCustomAssumptions {
  ambient_shelf_life_days?: number;
  rainfall_alert_threshold_mm?: number;
  mandi_price_slump_threshold_pct?: number;
  cold_storage_monthly_rate_per_kg?: number;
  processing_recovery_pct?: number;
  puree_selling_price_per_kg?: number;
}

export interface CropRescueAssessment {
  crop_lot_id: string;
  crop_name: string;
  variety?: string;
  quantity_kg: number;
  quality_grade?: string;
  urgency_level: 'CRITICAL' | 'HIGH' | 'MODERATE' | 'LOW';
  urgency_score: number;
  risk_reasons: string[];
  weather_alert?: string;
  mandi_price_signal?: string;
  salvage_pathways: RescuePathwayOption[];
  recommended_action: string;
  missing_data_warnings?: string[];
  disclaimer: string;
  assumptions_disclosed?: AssumptionItem[];
  scenario_comparison_notes?: string[];
}

export type TabKey =
  | 'dashboard'
  | 'farms'
  | 'lots'
  | 'decision-preview'
  | 'rescue'
  | 'buyers'
  | 'infrastructure'
  | 'execution'
  | 'market-weather'
  | 'iot-monitoring'
  | 'protection'
  | 'profile'
  | 'specs';

export interface IoTTelemetrySample {
  reading_id: string;
  sensor_type: 'SOIL_MOISTURE' | 'AIR_TEMP' | 'HUMIDITY' | 'RAINFALL' | 'BATTERY_VOLTAGE' | 'LIGHT_INTENSITY';
  value: number;
  unit: string;
  device_timestamp: string;
  server_ingested_at: string;
  source_type: 'SIMULATED' | 'PHYSICAL';
  quality_flag: string;
}

export interface IoTDevice {
  id: string;
  device_code: string;
  device_name: string;
  farm_id: string;
  farmer_user_id: string;
  device_type: string;
  firmware_version: string;
  sensor_capabilities: string;
  status: 'ACTIVE' | 'INACTIVE' | 'REVOKED';
  data_source: 'SIMULATED' | 'PHYSICAL';
  api_key_prefix: string;
  last_seen_at?: string;
  last_reading_summary?: string;
  created_at: string;
  updated_at: string;
  raw_api_key?: string;
}

export interface IoTTelemetryReading {
  id: string;
  device_id: string;
  farm_id: string;
  reading_id: string;
  sensor_type: string;
  value: number;
  unit: string;
  device_timestamp: string;
  server_ingested_at: string;
  source_type: 'SIMULATED' | 'PHYSICAL';
  quality_flag: string;
  raw_metadata?: string;
}

export interface IoTAlert {
  id: string;
  device_id: string;
  farm_id: string;
  alert_type: string;
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
  trigger_reading_id?: string;
  sensor_type?: string;
  trigger_value?: number;
  trigger_unit?: string;
  reading_timestamp?: string;
  threshold_used: string;
  source_type: string;
  explanation: string;
  is_resolved: boolean;
  created_at: string;
  resolved_at?: string;
}

export interface SimulatorPresetResponse {
  scenario: string;
  device_id: string;
  device_code: string;
  telemetry_response?: any;
  alerts_count: number;
  summary: {
    soil_moisture?: number;
    air_temperature?: number;
    humidity?: number;
    rainfall?: number;
    scenario_title?: string;
    quality_check?: string;
    status?: string;
    message?: string;
    simulated_last_seen?: string;
  };
  disclaimer: string;
}

// ---- Phase 5: Farmer Protection, Deal Transparency & Financial Trust ----

export interface AgreementAmendment {
  id: string;
  agreement_id: string;
  version: number;
  changed_by_role: string;
  changed_by_name: string;
  reason: string;
  terms_snapshot_json: string;
  created_at: string;
}

export interface DealAgreement {
  id: string;
  agreement_number: string;
  execution_request_id?: string;
  farmer_user_id: string;
  farm_id: string;
  crop_lot_id: string;
  partner_type: 'BUYER' | 'PROCESSOR' | 'COLD_STORAGE' | 'LOGISTICS';
  partner_id?: string;
  partner_name: string;
  partner_contact?: string;
  commodity: string;
  variety?: string;
  quality_grade?: string;
  agreed_quantity_kg: number;
  quantity_unit: string;
  agreed_unit_price: number;
  pricing_unit: string;
  gross_amount: number;
  logistics_deduction: number;
  processing_deduction: number;
  quality_deduction: number;
  other_deductions: number;
  total_deductions: number;
  estimated_net_payout: number;
  quality_requirements?: string;
  pickup_location?: string;
  delivery_location: string;
  expected_delivery_date?: string;
  payment_terms_days: number;
  expected_payment_date?: string;
  status: 'DRAFT' | 'PENDING_ACCEPTANCE' | 'ACCEPTED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'DISPUTED';
  version: number;
  is_latest: boolean;
  farmer_accepted_at?: string;
  partner_accepted_at?: string;
  farmer_notes?: string;
  terms_acknowledged: boolean;
  data_mode: string;
  created_at: string;
  updated_at: string;
  amendments: AgreementAmendment[];
}

export interface DeliveryRecord {
  id: string;
  delivery_number: string;
  agreement_id: string;
  execution_request_id?: string;
  expected_quantity_kg: number;
  delivered_quantity_kg: number;
  accepted_quantity_kg: number;
  rejected_quantity_kg: number;
  quantity_unit: string;
  delivery_timestamp: string;
  delivery_location: string;
  farmer_confirmed: boolean;
  farmer_confirmed_at?: string;
  partner_confirmed: boolean;
  partner_confirmed_at?: string;
  quality_notes?: string;
  vehicle_number?: string;
  driver_contact?: string;
  evidence_notes?: string;
  evidence_data_mode: string;
  status: 'PENDING' | 'CONFIRMED' | 'PARTIALLY_DELIVERED' | 'DISPUTED';
  created_at: string;
  updated_at: string;
  remaining_quantity_kg?: number;
}

export interface PaymentRecord {
  id: string;
  payment_reference: string;
  agreement_id: string;
  execution_request_id?: string;
  amount_due: number;
  amount_paid: number;
  payment_date?: string;
  due_date: string;
  payment_method: string;
  payment_status: 'NOT_DUE' | 'PENDING' | 'PARTIALLY_PAID' | 'PAID' | 'OVERDUE' | 'DISPUTED';
  payer_name: string;
  payee_name: string;
  transaction_reference_id?: string;
  notes?: string;
  data_mode: string;
  created_at: string;
  updated_at: string;
}

export interface PaymentReconciliationSummary {
  agreement_id: string;
  agreement_number: string;
  gross_agreed_amount: number;
  total_deductions: number;
  net_agreed_payout: number;
  total_paid: number;
  outstanding_balance: number;
  is_fully_paid: boolean;
  is_overdue: boolean;
  overdue_amount: number;
  payments_count: number;
  data_mode_label: string;
}

export interface DisputeEvent {
  id: string;
  dispute_id: string;
  actor_role: string;
  actor_name: string;
  action: string;
  previous_status?: string;
  new_status?: string;
  notes: string;
  created_at: string;
}

export interface FarmerDispute {
  id: string;
  dispute_reference: string;
  agreement_id: string;
  farmer_user_id: string;
  delivery_record_id?: string;
  payment_record_id?: string;
  category: 'PAYMENT_OVERDUE' | 'PAYMENT_AMOUNT_MISMATCH' | 'UNEXPECTED_DEDUCTION' | 'QUANTITY_MISMATCH' | 'QUALITY_DISAGREEMENT' | 'CHANGED_DEAL_TERMS' | 'DELIVERY_DISAGREEMENT' | 'OTHER';
  title: string;
  description: string;
  disputed_amount?: number;
  evidence_notes?: string;
  evidence_data_mode: string;
  status: 'OPEN' | 'UNDER_REVIEW' | 'AWAITING_INFORMATION' | 'RESOLVED' | 'REJECTED' | 'CLOSED';
  resolution_notes?: string;
  resolved_by?: string;
  disclaimer: string;
  created_at: string;
  resolved_at?: string;
  updated_at: string;
  events: DisputeEvent[];
}

export interface FarmerRiskAlert {
  id: string;
  farmer_user_id: string;
  agreement_id?: string;
  risk_type: string;
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
  trigger_evidence: string;
  explanation: string;
  recommended_action: string;
  is_resolved: boolean;
  resolution_notes?: string;
  resolved_at?: string;
  created_at: string;
}

export interface TransactionAuditEvent {
  id: string;
  agreement_id: string;
  event_type: string;
  actor_role: string;
  actor_name: string;
  summary: string;
  details_json?: string;
  created_at: string;
}

export interface ProtectionDashboardMetrics {
  active_agreements_count: number;
  deals_awaiting_acceptance_count: number;
  deliveries_awaiting_confirmation_count: number;
  expected_payments_total: number;
  payments_received_total: number;
  outstanding_balance_total: number;
  overdue_payments_total: number;
  open_disputes_count: number;
  active_risk_alerts_count: number;
  recent_events: TransactionAuditEvent[];
  disclaimer: string;
}

export interface NotificationItem {
  id: string;
  category: 'RISK_ALERT' | 'EXECUTION' | 'PROTECTION' | 'HARVEST' | 'IOT';
  title: string;
  message: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL' | 'SUCCESS';
  is_read: boolean;
  created_at: string;
  action_route?: string;
  action_label?: string;
}

export interface NotificationListResponse {
  items: NotificationItem[];
  unread_count: number;
  total: number;
}

export interface AIAdvisorResponse {
  answer: string;
  provider: string;
  is_ai_generated: boolean;
  model_name: string;
  confidence_score: number;
  suggested_actions: Array<{ label: string; route: string }>;
  disclaimer: string;
}




