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

