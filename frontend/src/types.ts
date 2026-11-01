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
