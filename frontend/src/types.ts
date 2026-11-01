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
  };
  disclaimer: string;
  created_at: string;
  options: DecisionOption[];
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
}


