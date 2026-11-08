import type {
  AuthTokens,
  CropLot,
  Farm,
  User,
  DecisionRun,
  WeatherResponse,
  MandiPricesResponse,
  MandiQuoteResponse,
  Buyer,
  BuyerOffer,
  LogisticsProvider,
  ColdStorageFacility,
  ProcessingFacility,
  ExecutionRequest,
  CropRescueAssessment,
  IoTDevice,
  IoTTelemetryReading,
  IoTAlert,
  SimulatorPresetResponse,
  DealAgreement,
  DeliveryRecord,
  PaymentRecord,
  PaymentReconciliationSummary,
  FarmerDispute,
  FarmerRiskAlert,
  TransactionAuditEvent,
  ProtectionDashboardMetrics,
  AssumptionItem,
  SensitivityAnalysisResult,
  OutcomeComparison,
  CropRescueCustomAssumptions,
  NotificationListResponse,
  AIAdvisorResponse,
} from './types';

import {
  MOCK_DECISION_RUN,
  MOCK_SENSITIVITY_RESULT,
  MOCK_OUTCOME_COMPARISON,
  MOCK_ASSUMPTIONS,
  MOCK_WEATHER,
  MOCK_MANDI_PRICES,
  MOCK_MANDI_QUOTE,
  MOCK_BUYERS,
  MOCK_BUYER_OFFERS,
  MOCK_LOGISTICS,
  MOCK_COLD_STORAGE,
  MOCK_PROCESSING,
  MOCK_EXECUTION_REQUESTS,
  MOCK_CROP_RESCUE,
  MOCK_IOT_DEVICES,
  MOCK_IOT_READINGS,
  MOCK_IOT_ALERTS,
  MOCK_AGREEMENTS,
  MOCK_DELIVERIES,
  MOCK_PAYMENTS,
  MOCK_DISPUTES,
  MOCK_RISK_ALERTS,
  MOCK_AUDIT_EVENTS,
  MOCK_PROTECTION_METRICS,
} from './mockData';

// Dynamically resolve API base from environment or relative proxy
const API_BASE = (import.meta.env.VITE_API_BASE_URL as string)?.replace(/\/$/, '') || '/api/v1';

// Default seed data for instant UI presentation / offline resilience
export const DEFAULT_DEMO_USER: User = {
  id: '07db312f-99dc-4d16-a176-bbaf2a33ca94',
  full_name: 'Ramesh Patil',
  phone: '9876543210',
  role: 'FARMER',
  preferred_language: 'en',
  is_active: true,
  demo_mode: true,
};

export const DEFAULT_DEMO_FARM: Farm = {
  id: 'd57a5758-a0f9-4e71-8203-315981944e1f',
  owner_user_id: '07db312f-99dc-4d16-a176-bbaf2a33ca94',
  farm_name: 'Patil Krishi Farm',
  state: 'Maharashtra',
  district: 'Nashik',
  village: 'Niphad',
  latitude: 20.0768,
  longitude: 74.0375,
  land_area: 3.5,
  land_area_unit: 'acre',
  boundary_geojson: JSON.stringify({
    type: 'Polygon',
    coordinates: [[
      [74.036931, 20.076265],
      [74.038069, 20.076265],
      [74.038069, 20.077335],
      [74.036931, 20.077335],
      [74.036931, 20.076265]
    ]]
  }),
  is_active: true,
  resources: [
    {
      id: '3bf623c7-4852-4433-b806-2a96e6cc7514',
      resource_type: 'storage',
      name: 'Shaded On-farm Shed (2 MT capacity)',
      quantity: 2000,
      unit: 'kg',
      availability_status: 'available',
    },
    {
      id: '68ce498c-d712-49f6-844d-c60855d73a2a',
      resource_type: 'equipment',
      name: 'Plastic Harvesting Crates (20 kg each)',
      quantity: 80,
      unit: 'crates',
      availability_status: 'available',
    },
    {
      id: '06432bd2-f7ba-4c57-9e00-6f36a6ac76c7',
      resource_type: 'labour',
      name: 'Family + 2 Seasonal Labourers',
      quantity: 3,
      unit: 'persons',
      availability_status: 'available',
    },
  ],
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

export const DEFAULT_DEMO_FARMS: Farm[] = [
  DEFAULT_DEMO_FARM,
  {
    id: '2b41e8d7-4f8a-510f-9b6c-fb5b8176d5b0',
    owner_user_id: '07db312f-99dc-4d16-a176-bbaf2a33ca94',
    farm_name: 'Sahyadri Farms',
    state: 'Maharashtra',
    district: 'Nashik',
    village: 'Pimpalgaon',
    latitude: 20.1654,
    longitude: 73.9880,
    land_area: 5.6,
    land_area_unit: 'acre',
    boundary_geojson: JSON.stringify({
      type: 'Polygon',
      coordinates: [[
        [73.987280, 20.164723],
        [73.988720, 20.164723],
        [73.988720, 20.166077],
        [73.987280, 20.166077],
        [73.987280, 20.164723]
      ]]
    }),
    is_active: true,
    resources: [
      {
        id: 'res-4',
        resource_type: 'storage',
        name: 'On-farm Shaded Shed',
        quantity: 2000,
        unit: 'kg',
        availability_status: 'available',
      },
      {
        id: 'res-5',
        resource_type: 'equipment',
        name: 'Harvesting Crates',
        quantity: 60,
        unit: 'crates',
        availability_status: 'available',
      },
    ],
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export const DEFAULT_DEMO_LOT: CropLot = {
  id: 'db92a8cd-c22f-4685-9f2e-9df926b88302',
  farm_id: 'd57a5758-a0f9-4e71-8203-315981944e1f',
  owner_user_id: '07db312f-99dc-4d16-a176-bbaf2a33ca94',
  crop_name: 'Tomato',
  variety: 'Abhinav (Fresh Table & Processing)',
  quantity: 4000,
  quantity_unit: 'kg',
  quantity_kg_normalized: 4000,
  harvest_date: new Date().toISOString(),
  quality_grade: 'A',
  status: 'READY_FOR_ANALYSIS',
  data_mode: 'demo',
  notes: '[DEMO_SEED] 4,000 kg Summer Tomato harvest ready for decision analysis. Grade A firm red tomatoes.',
  events: [
    {
      id: '0cdb94ca-d32b-4076-9cc3-69d5b513ee81',
      crop_lot_id: 'db92a8cd-c22f-4685-9f2e-9df926b88302',
      event_type: 'CREATED',
      description: '[DEMO_SEED] Initial demo crop lot seeded for Phase 1 demonstration.',
      created_at: new Date().toISOString(),
    },
  ],
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

class ApiService {
  private token: string | null = localStorage.getItem('a2v_access_token');
  private backendOnlineState: boolean | null = null;

  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('a2v_access_token', token);
    } else {
      localStorage.removeItem('a2v_access_token');
    }
  }

  getToken(): string | null {
    return this.token;
  }

  hasToken(): boolean {
    return !!this.token;
  }

  isBackendOnline(): boolean | null {
    return this.backendOnlineState;
  }

  private getHeaders(): HeadersInit {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    return headers;
  }

  async checkHealth(): Promise<{
    status: string;
    backendOnline: boolean;
    app?: string;
    version?: string;
    environment?: string;
    database?: string;
    demo_mode?: boolean;
    latency_ms?: number;
  }> {
    const start = typeof performance !== 'undefined' ? performance.now() : Date.now();
    try {
      const res = await fetch(`${API_BASE}/health`);
      const latency = Math.round((typeof performance !== 'undefined' ? performance.now() : Date.now()) - start);
      if (res.ok) {
        const contentType = res.headers.get('content-type') || '';
        if (!contentType.includes('application/json')) {
          this.backendOnlineState = false;
          return { status: 'offline', backendOnline: false, latency_ms: latency };
        }
        const data = await res.json();
        this.backendOnlineState = true;
        return {
          status: data.status || 'healthy',
          backendOnline: true,
          app: data.app || 'Agri2Value',
          version: data.version || '0.1.0',
          environment: data.environment || 'production',
          database: data.database || 'connected',
          demo_mode: data.demo_mode ?? true,
          latency_ms: latency,
        };
      }
      this.backendOnlineState = false;
      return { status: 'offline', backendOnline: false, latency_ms: latency };
    } catch {
      this.backendOnlineState = false;
      return { status: 'offline', backendOnline: false, latency_ms: 0 };
    }
  }

  async demoLogin(phone: string, demoCode: string = '123456', fullName: string = 'Ramesh Patil'): Promise<AuthTokens> {
    try {
      const res = await fetch(`${API_BASE}/auth/demo-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, demo_code: demoCode, full_name: fullName }),
      });
      const contentType = res.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        throw new Error('Backend returned non-JSON response');
      }
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || err.detail || 'Demo login failed');
      }
      const data: AuthTokens = await res.json();
      this.setToken(data.access_token);
      return data;
    } catch (err: any) {
      // If backend is unreachable, gracefully support offline demo session with local tokens
      console.warn('Backend API unreachable, using local session fallback:', err.message);
      const fakeTokens: AuthTokens = {
        access_token: 'demo-local-token-' + Date.now(),
        refresh_token: 'demo-local-refresh-' + Date.now(),
        user_id: DEFAULT_DEMO_USER.id,
        full_name: fullName,
        role: 'FARMER',
        demo_mode: true,
      };
      this.setToken(fakeTokens.access_token);
      return fakeTokens;
    }
  }

  async sendOtp(phone: string, fullName: string = 'Farmer'): Promise<{
    success: boolean;
    phone: string;
    message: string;
    is_simulated?: boolean;
    rate_limited?: boolean;
    cooldown_seconds?: number;
  }> {
    try {
      const res = await fetch(`${API_BASE}/auth/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, full_name: fullName }),
      });
      const contentType = res.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        throw new Error('Backend returned non-JSON response');
      }
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.detail || data.message || 'Failed to dispatch verification code');
      }
      return data;
    } catch (err: any) {
      console.warn('Backend offline, simulated sendOtp fallback:', err.message);
      return {
        success: true,
        phone,
        message: '[OFFLINE DEMO] Backend offline. Use demo code 123456.',
        is_simulated: true,
        cooldown_seconds: 60,
      };
    }
  }

  async verifyOtp(phone: string, otpCode: string, fullName: string = 'Farmer'): Promise<AuthTokens> {
    try {
      const res = await fetch(`${API_BASE}/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, otp_code: otpCode, full_name: fullName }),
      });
      const contentType = res.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        throw new Error('Backend returned non-JSON response');
      }
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || err.message || 'OTP verification failed');
      }
      const data: AuthTokens = await res.json();
      this.setToken(data.access_token);
      return data;
    } catch (err: any) {
      if (err.message && !err.message.includes('fetch') && !err.message.includes('Failed to fetch') && !err.message.includes('non-JSON') && !err.message.includes('JSON')) {
        throw err;
      }
      return this.demoLogin(phone, otpCode, fullName);
    }
  }

  async getMe(): Promise<User> {
    if (this.backendOnlineState === false) {
      const saved = localStorage.getItem('a2v_current_user');
      if (saved) {
        try { return JSON.parse(saved); } catch {}
      }
      return DEFAULT_DEMO_USER;
    }
    try {
      const res = await fetch(`${API_BASE}/auth/me`, {
        headers: this.getHeaders(),
      });
      if (res.ok) {
        const u = await res.json();
        localStorage.setItem('a2v_current_user', JSON.stringify(u));
        return u;
      }
    } catch {
      // Fallback
    }
    const saved = localStorage.getItem('a2v_current_user');
    if (saved) {
      try { return JSON.parse(saved); } catch {}
    }
    return DEFAULT_DEMO_USER;
  }

  async updatePreferredLanguage(language: string): Promise<User> {
    try {
      const res = await fetch(`${API_BASE}/auth/me/language`, {
        method: 'PATCH',
        headers: {
          ...this.getHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ preferred_language: language }),
      });
      if (res.ok) {
        return await res.json();
      }
    } catch {
      // Fallback
    }
    return { ...DEFAULT_DEMO_USER, preferred_language: language };
  }

  async getFarms(): Promise<Farm[]> {
    if (this.backendOnlineState === false) {
      const saved = localStorage.getItem('a2v_farms');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        } catch {}
      }
      return DEFAULT_DEMO_FARMS;
    }
    try {
      const res = await fetch(`${API_BASE}/farms`, {
        headers: this.getHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.farms && Array.isArray(data.farms)) {
          if (data.farms.length > 0) {
            localStorage.setItem('a2v_farms', JSON.stringify(data.farms));
            return data.farms;
          } else if (this.hasToken()) {
            return [];
          }
        }
      }
    } catch {
      // Fallback
    }
    // Return stored or default
    const saved = localStorage.getItem('a2v_farms');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch {}
    }
    return DEFAULT_DEMO_FARMS;
  }

  async createFarm(farmData: Partial<Farm>): Promise<Farm> {
    try {
      const res = await fetch(`${API_BASE}/farms`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(farmData),
      });
      if (res.ok) {
        const newFarm = await res.json();
        const farms = await this.getFarms();
        localStorage.setItem('a2v_farms', JSON.stringify([newFarm, ...farms.filter((f) => f.id !== newFarm.id)]));
        return newFarm;
      }
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || err.message || `Server error ${res.status}`);
    } catch (err: any) {
      if (err.message && !err.message.includes('fetch') && !err.message.includes('Failed to fetch')) {
        throw err;
      }
      console.warn('Backend API unreachable, saving farm locally:', err.message);
    }

    // Local persistence fallback
    const newFarm: Farm = {
      id: 'farm-' + Math.random().toString(36).substring(2, 9),
      owner_user_id: DEFAULT_DEMO_USER.id,
      farm_name: farmData.farm_name || 'My Farm',
      state: farmData.state || 'Maharashtra',
      district: farmData.district || 'Pune',
      village: farmData.village || 'Narayangaon',
      latitude: farmData.latitude,
      longitude: farmData.longitude,
      land_area: farmData.land_area,
      land_area_unit: farmData.land_area_unit || 'acre',
      boundary_geojson: farmData.boundary_geojson,
      is_active: true,
      resources: farmData.resources || [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    const farms = await this.getFarms();
    farms.unshift(newFarm);
    localStorage.setItem('a2v_farms', JSON.stringify(farms));
    return newFarm;
  }

  async updateFarm(farmId: string, farmData: Partial<Farm>): Promise<Farm> {
    try {
      const res = await fetch(`${API_BASE}/farms/${farmId}`, {
        method: 'PATCH',
        headers: this.getHeaders(),
        body: JSON.stringify(farmData),
      });
      if (res.ok) {
        const updated = await res.json();
        const farms = await this.getFarms();
        const idx = farms.findIndex((f) => f.id === farmId);
        if (idx !== -1) {
          farms[idx] = { ...farms[idx], ...updated };
          localStorage.setItem('a2v_farms', JSON.stringify(farms));
        }
        return updated;
      }
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || err.message || `Server error ${res.status}`);
    } catch (err: any) {
      if (err.message && !err.message.includes('fetch') && !err.message.includes('Failed to fetch')) {
        throw err;
      }
    }

    // Local persistence fallback
    const farms = await this.getFarms();
    const idx = farms.findIndex((f) => f.id === farmId);
    if (idx !== -1) {
      farms[idx] = {
        ...farms[idx],
        ...farmData,
        updated_at: new Date().toISOString(),
      };
      localStorage.setItem('a2v_farms', JSON.stringify(farms));
      return farms[idx];
    }
    throw new Error('Farm not found');
  }

  async deleteFarm(farmId: string): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/farms/${farmId}`, {
        method: 'DELETE',
        headers: this.getHeaders(),
      });
      if (res.ok) {
        const farms = await this.getFarms();
        localStorage.setItem('a2v_farms', JSON.stringify(farms.filter((f) => f.id !== farmId)));
        return true;
      }
    } catch {}
    const farms = await this.getFarms();
    localStorage.setItem('a2v_farms', JSON.stringify(farms.filter((f) => f.id !== farmId)));
    return true;
  }

  async getCropLots(farmId?: string): Promise<CropLot[]> {
    if (this.backendOnlineState === false) {
      const saved = localStorage.getItem('a2v_crop_lots');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        } catch {}
      }
      return [DEFAULT_DEMO_LOT];
    }
    try {
      const url = farmId ? `${API_BASE}/crop-lots?farm_id=${farmId}` : `${API_BASE}/crop-lots`;
      const res = await fetch(url, { headers: this.getHeaders() });
      if (res.ok) {
        const data = await res.json();
        if (data.crop_lots && Array.isArray(data.crop_lots)) {
          if (data.crop_lots.length > 0) {
            localStorage.setItem('a2v_crop_lots', JSON.stringify(data.crop_lots));
            return data.crop_lots;
          } else if (this.hasToken()) {
            return [];
          }
        }
      }
    } catch {
      // Fallback
    }

    const saved = localStorage.getItem('a2v_crop_lots');
    return saved ? JSON.parse(saved) : [DEFAULT_DEMO_LOT];
  }

  async createCropLot(farmId: string, lotData: Partial<CropLot>): Promise<CropLot> {
    try {
      const res = await fetch(`${API_BASE}/farms/${farmId}/crop-lots`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ ...lotData, farm_id: farmId }),
      });
      if (res.ok) {
        const newLot = await res.json();
        const lots = await this.getCropLots();
        localStorage.setItem('a2v_crop_lots', JSON.stringify([newLot, ...lots.filter((l) => l.id !== newLot.id)]));
        return newLot;
      }
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || err.message || `Server error ${res.status}`);
    } catch (err: any) {
      if (err.message && !err.message.includes('fetch') && !err.message.includes('Failed to fetch')) {
        throw err;
      }
      console.warn('Backend API unreachable, saving crop lot locally:', err.message);
    }

    const qty = Number(lotData.quantity) || 1000;
    const unit = lotData.quantity_unit || 'kg';
    const multiplier: Record<string, number> = {
      kg: 1,
      quintal: 100,
      tonne: 1000,
      bag: 50,
      maund: 37.3242,
    };
    const normKg = qty * (multiplier[unit] || 1);

    const newLot: CropLot = {
      id: 'lot-' + Math.random().toString(36).substring(2, 9),
      farm_id: farmId,
      owner_user_id: DEFAULT_DEMO_USER.id,
      crop_name: lotData.crop_name || 'Tomato',
      variety: lotData.variety,
      quantity: qty,
      quantity_unit: unit,
      quantity_kg_normalized: normKg,
      harvest_date: lotData.harvest_date || new Date().toISOString(),
      quality_grade: lotData.quality_grade || 'A',
      status: lotData.status || 'READY_FOR_ANALYSIS',
      data_mode: (lotData.data_mode as 'real' | 'demo') || 'demo',
      notes: lotData.notes,
      events: [
        {
          id: 'evt-' + Date.now(),
          crop_lot_id: 'lot-temp',
          event_type: 'CREATED',
          description: `Registered ${qty} ${unit} (${normKg} kg) of ${lotData.crop_name}`,
          created_at: new Date().toISOString(),
        },
      ],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const lots = await this.getCropLots();
    lots.unshift(newLot);
    localStorage.setItem('a2v_crop_lots', JSON.stringify(lots));
    return newLot;
  }

  async deleteCropLot(lotId: string): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/crop-lots/${lotId}`, {
        method: 'DELETE',
        headers: this.getHeaders(),
      });
      if (res.ok) {
        const lots = await this.getCropLots();
        localStorage.setItem('a2v_crop_lots', JSON.stringify(lots.filter((l) => l.id !== lotId)));
        return true;
      }
    } catch {}
    const lots = await this.getCropLots();
    localStorage.setItem('a2v_crop_lots', JSON.stringify(lots.filter((l) => l.id !== lotId)));
    return true;
  }

  // ---- Phase 2: Profit Decision Engine Endpoints ------------------

  async evaluateDecision(
    cropLotId: string,
    scenarioPreset?: string,
    customParams?: Record<string, any>
  ): Promise<DecisionRun> {
    try {
      const payload: Record<string, any> = { crop_lot_id: cropLotId };
      if (scenarioPreset) payload.scenario_preset = scenarioPreset;
      if (customParams) payload.custom_parameters = customParams;

      const res = await fetch(`${API_BASE}/decision-engine/evaluate`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const contentType = res.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          const data = await res.json();
          localStorage.setItem('a2v_last_decision', JSON.stringify(data));
          return data;
        }
      }
    } catch (err: any) {
      console.warn('Backend evaluation unavailable, falling back to local deterministic model:', err.message);
    }

    const fallback: DecisionRun = {
      ...MOCK_DECISION_RUN,
      id: 'drun-' + Date.now(),
      crop_lot_id: cropLotId,
      created_at: new Date().toISOString(),
    };
    localStorage.setItem('a2v_last_decision', JSON.stringify(fallback));
    return fallback;
  }

  async getDecision(decisionId: string): Promise<DecisionRun> {
    try {
      const res = await fetch(`${API_BASE}/decision-engine/decisions/${decisionId}`, {
        headers: this.getHeaders(),
      });
      if (res.ok) {
        return await res.json();
      }
    } catch {}

    const saved = localStorage.getItem('a2v_last_decision');
    return saved ? JSON.parse(saved) : MOCK_DECISION_RUN;
  }

  async getLotDecisions(lotId: string): Promise<DecisionRun[]> {
    try {
      const res = await fetch(`${API_BASE}/decision-engine/lots/${lotId}/decisions`, {
        headers: this.getHeaders(),
      });
      if (res.ok) {
        return await res.json();
      }
    } catch {}

    const saved = localStorage.getItem('a2v_last_decision');
    return saved ? [JSON.parse(saved)] : [MOCK_DECISION_RUN];
  }

  async getBenchmarkAssumptions(): Promise<AssumptionItem[]> {
    try {
      const res = await fetch(`${API_BASE}/decision-engine/assumptions-config`, {
        headers: this.getHeaders(),
      });
      if (res.ok) return await res.json();
    } catch {}
    return MOCK_ASSUMPTIONS;
  }

  async runSensitivityAnalysis(
    lotId: string,
    params?: {
      price_variance_pct?: number;
      transport_variance_pct?: number;
      wastage_variance_pct?: number;
      holding_days_shift?: number;
    }
  ): Promise<SensitivityAnalysisResult> {
    try {
      const res = await fetch(`${API_BASE}/decision-engine/sensitivity/${lotId}`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(params || {}),
      });
      if (res.ok) {
        return await res.json();
      }
    } catch {}
    return MOCK_SENSITIVITY_RESULT;
  }

  async getDecisionOutcomeComparison(decisionId: string): Promise<OutcomeComparison> {
    try {
      const res = await fetch(`${API_BASE}/decision-engine/outcome-comparison/${decisionId}`, {
        headers: this.getHeaders(),
      });
      if (res.ok) {
        return await res.json();
      }
    } catch {}
    return { ...MOCK_OUTCOME_COMPARISON, decision_run_id: decisionId };
  }

  // ---- Weather API (Phase 2.6) ----

  async getWeather(lat = 20.0760, lon = 74.0534): Promise<WeatherResponse> {
    try {
      const res = await fetch(`${API_BASE}/weather?latitude=${lat}&longitude=${lon}`, {
        headers: this.getHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        if (data && data.current && data.advisory) {
          return data;
        }
      }
    } catch {}
    return MOCK_WEATHER;
  }

  // ---- Mandi API (Phase 2.6) ----

  async getMandiPrices(state = 'Maharashtra', commodity?: string): Promise<MandiPricesResponse> {
    const url = commodity
      ? `${API_BASE}/mandi/prices?state=${encodeURIComponent(state)}&commodity=${encodeURIComponent(commodity)}`
      : `${API_BASE}/mandi/prices?state=${encodeURIComponent(state)}`;
    try {
      const res = await fetch(url, {
        headers: this.getHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data.records)) {
          return data;
        }
      }
    } catch {}
    return MOCK_MANDI_PRICES;
  }

  async getMandiQuote(cropName: string, district = 'Nashik', market?: string): Promise<MandiQuoteResponse> {
    const url = market
      ? `${API_BASE}/mandi/quote?crop_name=${encodeURIComponent(cropName)}&district=${encodeURIComponent(district)}&market=${encodeURIComponent(market)}`
      : `${API_BASE}/mandi/quote?crop_name=${encodeURIComponent(cropName)}&district=${encodeURIComponent(district)}`;
    try {
      const res = await fetch(url, {
        headers: this.getHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        if (data && data.rate_per_kg !== undefined) {
          return data;
        }
      }
    } catch {}
    return {
      ...MOCK_MANDI_QUOTE,
      commodity: cropName,
      district,
      market_name: market || MOCK_MANDI_QUOTE.market_name,
    };
  }

  // ---- Phase 3: Smart Execution Network API ----

  async getBuyers(params?: { commodity?: string; district?: string; buyer_type?: string; verified_only?: boolean }): Promise<Buyer[]> {
    const q = new URLSearchParams();
    if (params?.commodity) q.append('commodity', params.commodity);
    if (params?.district) q.append('district', params.district);
    if (params?.buyer_type) q.append('buyer_type', params.buyer_type);
    if (params?.verified_only) q.append('verified_only', 'true');

    try {
      const res = await fetch(`${API_BASE}/execution/buyers?${q.toString()}`, {
        headers: this.getHeaders(),
      });
      if (res.ok) {
        return await res.json();
      }
    } catch {}
    return MOCK_BUYERS;
  }

  async getBuyerOffers(params?: { commodity?: string; district?: string; grade?: string }): Promise<BuyerOffer[]> {
    const q = new URLSearchParams();
    if (params?.commodity) q.append('commodity', params.commodity);
    if (params?.district) q.append('district', params.district);
    if (params?.grade) q.append('grade', params.grade);

    try {
      const res = await fetch(`${API_BASE}/execution/buyer-offers?${q.toString()}`, {
        headers: this.getHeaders(),
      });
      if (res.ok) {
        return await res.json();
      }
    } catch {}
    return MOCK_BUYER_OFFERS;
  }

  async getLogisticsProviders(params?: { district?: string; min_capacity_kg?: number; temperature_controlled?: boolean; available_only?: boolean }): Promise<LogisticsProvider[]> {
    const q = new URLSearchParams();
    if (params?.district) q.append('district', params.district);
    if (params?.min_capacity_kg) q.append('min_capacity_kg', params.min_capacity_kg.toString());
    if (params?.temperature_controlled !== undefined) q.append('temperature_controlled', params.temperature_controlled.toString());
    if (params?.available_only) q.append('available_only', 'true');

    try {
      const res = await fetch(`${API_BASE}/execution/logistics?${q.toString()}`, {
        headers: this.getHeaders(),
      });
      if (res.ok) {
        return await res.json();
      }
    } catch {}
    return MOCK_LOGISTICS;
  }

  async getColdStorageFacilities(params?: { district?: string; commodity?: string; min_capacity_kg?: number; available_only?: boolean }): Promise<ColdStorageFacility[]> {
    const q = new URLSearchParams();
    if (params?.district) q.append('district', params.district);
    if (params?.commodity) q.append('commodity', params.commodity);
    if (params?.min_capacity_kg) q.append('min_capacity_kg', params.min_capacity_kg.toString());
    if (params?.available_only) q.append('available_only', 'true');

    try {
      const res = await fetch(`${API_BASE}/execution/cold-storage?${q.toString()}`, {
        headers: this.getHeaders(),
      });
      if (res.ok) {
        return await res.json();
      }
    } catch {}
    return MOCK_COLD_STORAGE;
  }

  async getProcessingFacilities(params?: { commodity?: string; district?: string; facility_type?: string; available_only?: boolean }): Promise<ProcessingFacility[]> {
    const q = new URLSearchParams();
    if (params?.commodity) q.append('commodity', params.commodity);
    if (params?.district) q.append('district', params.district);
    if (params?.facility_type) q.append('facility_type', params.facility_type);
    if (params?.available_only) q.append('available_only', 'true');

    try {
      const res = await fetch(`${API_BASE}/execution/processing?${q.toString()}`, {
        headers: this.getHeaders(),
      });
      if (res.ok) {
        return await res.json();
      }
    } catch {}
    return MOCK_PROCESSING;
  }

  async createExecutionRequest(data: {
    crop_lot_id: string;
    route_type: string;
    requested_quantity_kg: number;
    decision_run_id?: string;
    buyer_id?: string;
    buyer_offer_id?: string;
    logistics_provider_id?: string;
    cold_storage_facility_id?: string;
    processing_facility_id?: string;
    pickup_location?: string;
    delivery_location?: string;
    scheduled_date?: string;
    notes?: string;
  }): Promise<ExecutionRequest> {
    try {
      const res = await fetch(`${API_BASE}/execution/requests`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(data),
      });
      if (res.ok) {
        return await res.json();
      }
    } catch {}

    const newReq: ExecutionRequest = {
      id: 'exec-' + Date.now(),
      farmer_user_id: DEFAULT_DEMO_USER.id,
      crop_lot_id: data.crop_lot_id,
      decision_run_id: data.decision_run_id,
      route_type: data.route_type,
      status: 'CONFIRMED',
      buyer_id: data.buyer_id,
      buyer_offer_id: data.buyer_offer_id,
      logistics_provider_id: data.logistics_provider_id,
      cold_storage_facility_id: data.cold_storage_facility_id,
      processing_facility_id: data.processing_facility_id,
      requested_quantity_kg: data.requested_quantity_kg,
      indicative_unit_price: 18.00,
      indicative_total_value: data.requested_quantity_kg * 18.00,
      indicative_logistics_cost: 1800,
      indicative_storage_cost: 0,
      indicative_processing_cost: 200,
      indicative_net_payout: data.requested_quantity_kg * 18.00 - 2000,
      pickup_location: data.pickup_location || 'Patil Krishi Farm, Gate 2, Niphad',
      delivery_location: data.delivery_location || 'Sahyadri Mega Food Park, Mohadi',
      scheduled_date: data.scheduled_date || new Date().toISOString(),
      notes: data.notes,
      data_mode: 'demo',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      events: [],
    };
    const list = await this.getExecutionRequests();
    const updated = [newReq, ...list.filter(r => r.id !== newReq.id)];
    localStorage.setItem('a2v_exec_requests', JSON.stringify(updated));
    return newReq;
  }

  async getExecutionRequests(status?: string): Promise<ExecutionRequest[]> {
    const url = status ? `${API_BASE}/execution/requests?status=${status}` : `${API_BASE}/execution/requests`;
    try {
      const res = await fetch(url, {
        headers: this.getHeaders(),
      });
      if (res.ok) {
        return await res.json();
      }
    } catch {}
    const saved = localStorage.getItem('a2v_exec_requests');
    let items: ExecutionRequest[] = saved ? JSON.parse(saved) : MOCK_EXECUTION_REQUESTS;
    if (saved && Array.isArray(items)) {
      for (const mockReq of MOCK_EXECUTION_REQUESTS) {
        if (!items.some(i => i.id === mockReq.id)) {
          items.push(mockReq);
        }
      }
    }
    return status ? items.filter(r => r.status === status) : items;
  }

  async getExecutionRequest(requestId: string): Promise<ExecutionRequest> {
    try {
      const res = await fetch(`${API_BASE}/execution/requests/${requestId}`, {
        headers: this.getHeaders(),
      });
      if (res.ok) {
        return await res.json();
      }
    } catch {}
    const items = await this.getExecutionRequests();
    const found = items.find(r => r.id === requestId);
    return found || MOCK_EXECUTION_REQUESTS[0];
  }

  async transitionExecutionStatus(requestId: string, toStatus: string, message: string): Promise<ExecutionRequest> {
    try {
      const res = await fetch(`${API_BASE}/execution/requests/${requestId}/transition`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ to_status: toStatus, message }),
      });
      if (res.ok) {
        return await res.json();
      }
    } catch {}
    const items = await this.getExecutionRequests();
    const item = items.find(r => r.id === requestId) || { ...MOCK_EXECUTION_REQUESTS[0], id: requestId };
    item.status = toStatus as any;
    item.updated_at = new Date().toISOString();
    localStorage.setItem('a2v_exec_requests', JSON.stringify(items));
    return item;
  }

  async completeExecutionRequest(requestId: string, payload: {
    actual_quantity_kg: number;
    actual_unit_price: number;
    actual_logistics_cost?: number;
    actual_storage_cost?: number;
    actual_processing_cost?: number;
    completion_notes?: string;
  }): Promise<ExecutionRequest> {
    try {
      const res = await fetch(`${API_BASE}/execution/requests/${requestId}/complete`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        return await res.json();
      }
    } catch {}
    return await this.transitionExecutionStatus(requestId, 'COMPLETED', payload.completion_notes || 'Execution recorded as completed');
  }

  // ---- Crop Rescue Mode API ----

  async getCropRescueAssessment(cropLotId: string): Promise<CropRescueAssessment> {
    try {
      const res = await fetch(`${API_BASE}/crop-rescue/lot/${cropLotId}`, {
        headers: this.getHeaders(),
      });
      if (res.ok) {
        return await res.json();
      }
    } catch {}
    return { ...MOCK_CROP_RESCUE, crop_lot_id: cropLotId };
  }

  async assessCropRescueCustom(
    cropLotId: string,
    customAssumptions?: CropRescueCustomAssumptions,
    supplementaryTelemetry?: Record<string, any>
  ): Promise<CropRescueAssessment> {
    try {
      const res = await fetch(`${API_BASE}/crop-rescue/lot/${cropLotId}`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          custom_assumptions: customAssumptions,
          supplementary_telemetry: supplementaryTelemetry,
        }),
      });
      if (res.ok) {
        return await res.json();
      }
    } catch {}
    return { ...MOCK_CROP_RESCUE, crop_lot_id: cropLotId };
  }

  // ---- IoT & Edge Telematics API (Phase 4A) ----

  async listIoTDevices(farmId?: string, status?: string): Promise<IoTDevice[]> {
    const params = new URLSearchParams();
    if (farmId) params.append('farm_id', farmId);
    if (status) params.append('status', status);
    const qs = params.toString() ? `?${params.toString()}` : '';
    try {
      const res = await fetch(`${API_BASE}/iot/devices${qs}`, {
        headers: this.getHeaders(),
      });
      if (res.ok) {
        return await res.json();
      }
    } catch {}
    return MOCK_IOT_DEVICES;
  }

  async getIoTDevice(deviceId: string): Promise<IoTDevice> {
    try {
      const res = await fetch(`${API_BASE}/iot/devices/${deviceId}`, {
        headers: this.getHeaders(),
      });
      if (res.ok) {
        return await res.json();
      }
    } catch {}
    const dev = MOCK_IOT_DEVICES.find(d => d.id === deviceId);
    return dev || MOCK_IOT_DEVICES[0];
  }

  async registerIoTDevice(payload: {
    device_code: string;
    device_name: string;
    farm_id: string;
    device_type?: string;
    firmware_version?: string;
    sensor_capabilities?: string;
    data_source?: string;
  }): Promise<IoTDevice> {
    const res = await fetch(`${API_BASE}/iot/devices`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || err.message || 'Failed to register IoT device');
    }
    return await res.json();
  }

  async updateIoTDeviceStatus(deviceId: string, status: string): Promise<IoTDevice> {
    const res = await fetch(`${API_BASE}/iot/devices/${deviceId}/status`, {
      method: 'PATCH',
      headers: this.getHeaders(),
      body: JSON.stringify({ status }),
    });
    if (!res.ok) {
      throw new Error('Failed to update device status');
    }
    return await res.json();
  }

  async rotateIoTDeviceKey(deviceId: string): Promise<{ device_id: string; raw_api_key: string; api_key_prefix: string; message: string }> {
    const res = await fetch(`${API_BASE}/iot/devices/${deviceId}/rotate-key`, {
      method: 'POST',
      headers: this.getHeaders(),
    });
    if (!res.ok) {
      throw new Error('Failed to rotate device key');
    }
    return await res.json();
  }

  async ingestTelemetry(deviceCode: string, deviceKey: string, payload: {
    farm_id?: string;
    readings: Array<{
      reading_id: string;
      sensor_type: string;
      value: number;
      unit: string;
      device_timestamp: string;
      source_type?: string;
      raw_metadata?: string;
    }>;
  }): Promise<any> {
    const res = await fetch(`${API_BASE}/iot/telemetry`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Device-Id': deviceCode,
        'X-Device-Key': deviceKey,
      },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || err.message || 'Telemetry ingestion failed');
    }
    return await res.json();
  }

  async getDeviceTelemetry(deviceId: string, sensorType?: string, limit = 50): Promise<IoTTelemetryReading[]> {
    const params = new URLSearchParams();
    if (sensorType) params.append('sensor_type', sensorType);
    params.append('limit', limit.toString());
    try {
      const res = await fetch(`${API_BASE}/iot/devices/${deviceId}/telemetry?${params.toString()}`, {
        headers: this.getHeaders(),
      });
      if (res.ok) {
        return await res.json();
      }
    } catch {}
    return MOCK_IOT_READINGS;
  }

  async getIoTAlerts(farmId?: string, isResolved?: boolean): Promise<IoTAlert[]> {
    const params = new URLSearchParams();
    if (farmId) params.append('farm_id', farmId);
    if (isResolved !== undefined) params.append('is_resolved', String(isResolved));
    try {
      const res = await fetch(`${API_BASE}/iot/alerts?${params.toString()}`, {
        headers: this.getHeaders(),
      });
      if (res.ok) {
        return await res.json();
      }
    } catch {}
    return MOCK_IOT_ALERTS;
  }

  async resolveIoTAlert(alertId: string): Promise<IoTAlert> {
    try {
      const res = await fetch(`${API_BASE}/iot/alerts/${alertId}/resolve`, {
        method: 'POST',
        headers: this.getHeaders(),
      });
      if (res.ok) {
        return await res.json();
      }
    } catch {}
    const alert = MOCK_IOT_ALERTS.find(a => a.id === alertId) || MOCK_IOT_ALERTS[0];
    alert.is_resolved = true;
    return alert;
  }

  async listSimulatorScenarios(): Promise<Record<string, any>> {
    try {
      const res = await fetch(`${API_BASE}/iot/simulator/scenarios`, {
        headers: this.getHeaders(),
      });
      if (res.ok) {
        return await res.json();
      }
    } catch {}
    return {
      OPTIMAL_CONDITIONS: { label: 'Optimal Post-Harvest Canopy', temp: 24, humidity: 60, moisture: 40 },
      HEAT_STRESS: { label: 'Mid-day Thermal Peak', temp: 36, humidity: 35, moisture: 25 },
      HIGH_MOISTURE_ROT: { label: 'Rain Inundation Risk', temp: 22, humidity: 90, moisture: 85 },
    };
  }

  async runSimulatorPreset(payload: {
    device_id: string;
    scenario: string;
    custom_soil_moisture?: number;
    custom_temperature?: number;
    custom_humidity?: number;
    custom_rainfall?: number;
  }): Promise<SimulatorPresetResponse> {
    try {
      const res = await fetch(`${API_BASE}/iot/simulator/run`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        return await res.json();
      }
    } catch {}
    return {
      scenario: payload.scenario,
      device_id: payload.device_id,
      device_code: 'NODE-NSK-NIPHAD-01',
      alerts_count: 0,
      summary: {
        scenario_title: 'Optimal Post-Harvest Canopy',
        soil_moisture: payload.custom_soil_moisture ?? 38.5,
        air_temperature: payload.custom_temperature ?? 28.2,
        humidity: payload.custom_humidity ?? 62.0,
        status: 'NORMAL',
        message: 'Telemetry sample ingested successfully',
      },
      disclaimer: 'Demonstration simulation',
    };
  }

  // ---- Phase 5: Farmer Protection & Financial Trust API ----

  async getProtectionDashboard(): Promise<ProtectionDashboardMetrics> {
    try {
      const res = await fetch(`${API_BASE}/protection/dashboard`, {
        headers: this.getHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        if (data && data.active_agreements_count !== undefined) {
          return data;
        }
      }
    } catch {}
    return MOCK_PROTECTION_METRICS;
  }

  async getAgreements(status?: string): Promise<DealAgreement[]> {
    const q = status ? `?status=${encodeURIComponent(status)}` : '';
    try {
      const res = await fetch(`${API_BASE}/protection/agreements${q}`, {
        headers: this.getHeaders(),
      });
      if (res.ok) {
        return await res.json();
      }
    } catch {}
    const saved = localStorage.getItem('a2v_agreements');
    const items: DealAgreement[] = saved ? JSON.parse(saved) : MOCK_AGREEMENTS;
    return status ? items.filter(a => a.status === status) : items;
  }

  async getAgreement(id: string): Promise<DealAgreement> {
    try {
      const res = await fetch(`${API_BASE}/protection/agreements/${id}`, {
        headers: this.getHeaders(),
      });
      if (res.ok) {
        return await res.json();
      }
    } catch {}
    const items = await this.getAgreements();
    return items.find(a => a.id === id) || MOCK_AGREEMENTS[0];
  }

  async createAgreement(payload: any): Promise<DealAgreement> {
    try {
      const res = await fetch(`${API_BASE}/protection/agreements`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        return await res.json();
      }
    } catch {}
    const newAgr: DealAgreement = {
      ...MOCK_AGREEMENTS[0],
      id: 'agr-' + Date.now(),
      agreement_number: 'AGR-A2V-2026-' + Math.floor(1000 + Math.random() * 9000),
      agreed_quantity_kg: payload.agreed_quantity_kg || 4000,
      agreed_unit_price: payload.agreed_unit_price || 18.00,
      gross_amount: payload.gross_amount || 72000,
      total_deductions: payload.itemized_deductions_amount || 3600,
      estimated_net_payout: payload.net_payable_amount || 68400,
      status: 'DRAFT',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    const list = await this.getAgreements();
    localStorage.setItem('a2v_agreements', JSON.stringify([newAgr, ...list]));
    return newAgr;
  }

  async createAgreementFromExecution(executionRequestId: string): Promise<DealAgreement> {
    try {
      const res = await fetch(`${API_BASE}/protection/agreements/from-execution/${executionRequestId}`, {
        method: 'POST',
        headers: this.getHeaders(),
      });
      if (res.ok) {
        return await res.json();
      }
    } catch {}
    return await this.createAgreement({ execution_request_id: executionRequestId });
  }

  async acceptAgreement(id: string, notes?: string): Promise<DealAgreement> {
    try {
      const res = await fetch(`${API_BASE}/protection/agreements/${id}/accept`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ terms_acknowledged: true, notes }),
      });
      if (res.ok) {
        return await res.json();
      }
    } catch {}
    const list = await this.getAgreements();
    const item = list.find(a => a.id === id) || { ...MOCK_AGREEMENTS[0], id };
    item.status = 'ACCEPTED';
    item.farmer_accepted_at = new Date().toISOString();
    localStorage.setItem('a2v_agreements', JSON.stringify(list));
    return item;
  }

  async amendAgreement(id: string, payload: any): Promise<DealAgreement> {
    try {
      const res = await fetch(`${API_BASE}/protection/agreements/${id}/amend`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        return await res.json();
      }
    } catch {}
    const list = await this.getAgreements();
    const item = list.find(a => a.id === id) || { ...MOCK_AGREEMENTS[0], id };
    if (payload.agreed_unit_price) item.agreed_unit_price = payload.agreed_unit_price;
    localStorage.setItem('a2v_agreements', JSON.stringify(list));
    return item;
  }

  async getPaymentReconciliation(agreementId: string): Promise<PaymentReconciliationSummary> {
    try {
      const res = await fetch(`${API_BASE}/protection/agreements/${agreementId}/reconciliation`, {
        headers: this.getHeaders(),
      });
      if (res.ok) {
        return await res.json();
      }
    } catch {}
    return {
      agreement_id: agreementId,
      agreement_number: 'AGR-A2V-2026-0814',
      gross_agreed_amount: 72000,
      total_deductions: 3600,
      net_agreed_payout: 68400,
      total_paid: 45000,
      outstanding_balance: 23400,
      is_fully_paid: false,
      is_overdue: false,
      overdue_amount: 0,
      payments_count: 1,
      data_mode_label: 'demo',
    };
  }

  async getDeliveries(agreementId?: string): Promise<DeliveryRecord[]> {
    const q = agreementId ? `?agreement_id=${encodeURIComponent(agreementId)}` : '';
    try {
      const res = await fetch(`${API_BASE}/protection/deliveries${q}`, {
        headers: this.getHeaders(),
      });
      if (res.ok) {
        return await res.json();
      }
    } catch {}
    const saved = localStorage.getItem('a2v_deliveries');
    const items: DeliveryRecord[] = saved ? JSON.parse(saved) : MOCK_DELIVERIES;
    return agreementId ? items.filter(d => d.agreement_id === agreementId) : items;
  }

  async recordDelivery(payload: any): Promise<DeliveryRecord> {
    try {
      const res = await fetch(`${API_BASE}/protection/deliveries`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        return await res.json();
      }
    } catch {}
    const newDel: DeliveryRecord = {
      ...MOCK_DELIVERIES[0],
      id: 'del-' + Date.now(),
      delivery_number: 'DEL-' + Date.now().toString().slice(-4),
      agreement_id: payload.agreement_id || 'agr-canonical-001',
      delivered_quantity_kg: payload.delivered_quantity_kg || payload.quantity_delivered_kg || 1500,
      accepted_quantity_kg: payload.accepted_quantity_kg || 1500,
      remaining_quantity_kg: 2500,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    const list = await this.getDeliveries();
    localStorage.setItem('a2v_deliveries', JSON.stringify([newDel, ...list]));
    return newDel;
  }

  async confirmDelivery(id: string, notes?: string): Promise<DeliveryRecord> {
    try {
      const res = await fetch(`${API_BASE}/protection/deliveries/${id}/confirm`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ confirmed: true, notes }),
      });
      if (res.ok) {
        return await res.json();
      }
    } catch {}
    const list = await this.getDeliveries();
    const item = list.find(d => d.id === id) || { ...MOCK_DELIVERIES[0], id };
    item.status = 'CONFIRMED';
    item.farmer_confirmed = true;
    localStorage.setItem('a2v_deliveries', JSON.stringify(list));
    return item;
  }

  async getPayments(agreementId?: string): Promise<PaymentRecord[]> {
    const q = agreementId ? `?agreement_id=${encodeURIComponent(agreementId)}` : '';
    try {
      const res = await fetch(`${API_BASE}/protection/payments${q}`, {
        headers: this.getHeaders(),
      });
      if (res.ok) {
        return await res.json();
      }
    } catch {}
    const saved = localStorage.getItem('a2v_payments');
    const items: PaymentRecord[] = saved ? JSON.parse(saved) : MOCK_PAYMENTS;
    return agreementId ? items.filter(p => p.agreement_id === agreementId) : items;
  }

  async recordPayment(payload: any): Promise<PaymentRecord> {
    try {
      const res = await fetch(`${API_BASE}/protection/payments`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        return await res.json();
      }
    } catch {}
    const newPay: PaymentRecord = {
      ...MOCK_PAYMENTS[0],
      id: 'pay-' + Date.now(),
      payment_reference: 'PAY-' + Date.now().toString().slice(-4),
      agreement_id: payload.agreement_id || 'agr-canonical-001',
      amount_paid: payload.amount_paid || payload.amount || 23400,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    const list = await this.getPayments();
    localStorage.setItem('a2v_payments', JSON.stringify([newPay, ...list]));
    return newPay;
  }

  async getDisputes(status?: string): Promise<FarmerDispute[]> {
    const q = status ? `?status=${encodeURIComponent(status)}` : '';
    try {
      const res = await fetch(`${API_BASE}/protection/disputes${q}`, {
        headers: this.getHeaders(),
      });
      if (res.ok) {
        return await res.json();
      }
    } catch {}
    const saved = localStorage.getItem('a2v_disputes');
    return saved ? JSON.parse(saved) : MOCK_DISPUTES;
  }

  async getDispute(id: string): Promise<FarmerDispute> {
    try {
      const res = await fetch(`${API_BASE}/protection/disputes/${id}`, {
        headers: this.getHeaders(),
      });
      if (res.ok) {
        return await res.json();
      }
    } catch {}
    const list = await this.getDisputes();
    return list.find(d => d.id === id) || {
      id,
      dispute_reference: 'DISP-8812',
      agreement_id: 'agr-canonical-001',
      farmer_user_id: DEFAULT_DEMO_USER.id,
      category: 'PAYMENT_OVERDUE',
      title: 'Payment Delay',
      description: 'Payment overdue beyond 3-day window.',
      disputed_amount: 23400,
      evidence_data_mode: 'demo',
      status: 'OPEN',
      disclaimer: 'Dispute recorded for mediation.',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      events: [],
    };
  }

  async createDispute(payload: any): Promise<FarmerDispute> {
    try {
      const res = await fetch(`${API_BASE}/protection/disputes`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        return await res.json();
      }
    } catch {}
    const newDisp: FarmerDispute = {
      id: 'disp-' + Date.now(),
      dispute_reference: 'DISP-' + Date.now().toString().slice(-4),
      agreement_id: payload.agreement_id || 'agr-canonical-001',
      farmer_user_id: DEFAULT_DEMO_USER.id,
      category: payload.category || 'PAYMENT_OVERDUE',
      title: payload.title || 'Overdue Payment Dispute',
      description: payload.description || 'Payment overdue beyond 3-day guarantee window.',
      disputed_amount: payload.disputed_amount || 23400,
      evidence_data_mode: 'demo',
      status: 'OPEN',
      disclaimer: 'Dispute registered under farmer protection scheme.',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      events: [],
    };
    const list = await this.getDisputes();
    localStorage.setItem('a2v_disputes', JSON.stringify([newDisp, ...list]));
    return newDisp;
  }

  async updateDisputeStatus(id: string, payload: { status: string; notes: string; resolution_notes?: string }): Promise<FarmerDispute> {
    try {
      const res = await fetch(`${API_BASE}/protection/disputes/${id}/status`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        return await res.json();
      }
    } catch {}
    const list = await this.getDisputes();
    const item = list.find(d => d.id === id) || {
      id,
      dispute_reference: 'DISP-8812',
      agreement_id: 'agr-canonical-001',
      farmer_user_id: DEFAULT_DEMO_USER.id,
      category: 'PAYMENT_OVERDUE',
      title: 'Payment Delay',
      description: payload.notes,
      disputed_amount: 23400,
      evidence_data_mode: 'demo',
      status: payload.status as any,
      disclaimer: 'Dispute registered.',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      events: [],
    };
    item.status = payload.status as any;
    localStorage.setItem('a2v_disputes', JSON.stringify(list));
    return item;
  }

  async getRiskAlerts(resolved?: boolean): Promise<FarmerRiskAlert[]> {
    const q = resolved !== undefined ? `?resolved=${resolved}` : '';
    try {
      const res = await fetch(`${API_BASE}/protection/risk-alerts${q}`, {
        headers: this.getHeaders(),
      });
      if (res.ok) {
        return await res.json();
      }
    } catch {}
    if (resolved !== undefined) {
      return MOCK_RISK_ALERTS.filter(a => a.is_resolved === resolved);
    }
    return MOCK_RISK_ALERTS;
  }

  async resolveRiskAlert(alertId: string, resolution_notes: string): Promise<FarmerRiskAlert> {
    try {
      const res = await fetch(`${API_BASE}/protection/risk-alerts/${alertId}/resolve`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ resolution_notes }),
      });
      if (res.ok) {
        return await res.json();
      }
    } catch {}
    const existing = MOCK_RISK_ALERTS.find(a => a.id === alertId);
    if (existing) {
      existing.is_resolved = true;
      existing.resolution_notes = resolution_notes;
      existing.resolved_at = new Date().toISOString();
      return existing;
    }
    return {
      id: alertId,
      farmer_user_id: DEFAULT_DEMO_USER.id,
      risk_type: 'PAYMENT_RISK',
      severity: 'WARNING',
      trigger_evidence: 'Overdue payment trigger',
      explanation: resolution_notes,
      recommended_action: 'Contact buyer',
      is_resolved: true,
      resolved_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
    };
  }

  async getTransactionAuditEvents(agreementId?: string): Promise<TransactionAuditEvent[]> {
    const q = agreementId ? `?agreement_id=${encodeURIComponent(agreementId)}` : '';
    try {
      const res = await fetch(`${API_BASE}/protection/audit-events${q}`, {
        headers: this.getHeaders(),
      });
      if (res.ok) {
        return await res.json();
      }
    } catch {}
    if (agreementId) {
      return MOCK_AUDIT_EVENTS.filter(e => e.agreement_id === agreementId);
    }
    return MOCK_AUDIT_EVENTS;
  }

  async askAIAdvisor(query: string, cropLotId?: string, farmId?: string, language?: string): Promise<AIAdvisorResponse> {
    try {
      const res = await fetch(`${API_BASE}/ai-advisor/chat`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          query,
          crop_lot_id: cropLotId,
          farm_id: farmId,
          language: language || 'en',
        }),
      });
      if (res.ok) {
        return await res.json();
      }
    } catch {}

    // Offline / fallback response
    return {
      answer: "APMC modal rates for your produce currently benchmark at ₹14.00/kg. Direct Buyer and Puree Processing pathways yield higher net realization (+18%).",
      provider: "deterministic_agronomy_rules",
      is_ai_generated: false,
      model_name: "AgriExpert-Deterministic-v2.0",
      confidence_score: 0.94,
      suggested_actions: [
        { label: "Evaluate 5 Pathways", route: "/app/decision" },
        { label: "Explore Mandi Live Feed", route: "/app/market" },
      ],
      disclaimer: "Agricultural advisory intelligence. Verify physical produce quality before commercial dispatch.",
    };
  }

  async getNotifications(limit: number = 25): Promise<NotificationListResponse> {
    const fallbackNotifications: NotificationListResponse = {
      items: [
        {
          id: 'notif-demo-1',
          category: 'RISK_ALERT',
          title: 'Payment Risk Alert: Payment Overdue',
          message: 'Remaining balance of ₹31,000 pending past agreed 3-day payment window for agreement AGR-2026-0001.',
          severity: 'WARNING',
          is_read: false,
          created_at: new Date().toISOString(),
          action_route: '/app/protection',
          action_label: 'Review Ledger',
        },
        {
          id: 'notif-demo-2',
          category: 'EXECUTION',
          title: 'Execution Update: CONFIRMED',
          message: 'Reefer Van MH-15-EG-4412 reservation locked for direct buyer dispatch.',
          severity: 'SUCCESS',
          is_read: false,
          created_at: new Date(Date.now() - 3600000).toISOString(),
          action_route: '/app/execution',
          action_label: 'Track Order',
        },
        {
          id: 'notif-demo-3',
          category: 'HARVEST',
          title: 'Harvest Lot: Tomato (CREATED)',
          message: 'Registered 4,000 kg Summer Tomato harvest ready for decision analysis.',
          severity: 'INFO',
          is_read: true,
          created_at: new Date(Date.now() - 86400000).toISOString(),
          action_route: '/app/lots',
          action_label: 'View Lot',
        },
      ],
      unread_count: 2,
      total: 3,
    };

    if (this.backendOnlineState === false) {
      return fallbackNotifications;
    }

    try {
      const res = await fetch(`${API_BASE}/notifications?limit=${limit}`, {
        headers: this.getHeaders(),
      });
      if (res.ok) {
        return await res.json();
      }
    } catch {}

    return fallbackNotifications;
  }

  async markNotificationRead(notificationId: string): Promise<void> {
    try {
      await fetch(`${API_BASE}/notifications/${notificationId}/read`, {
        method: 'POST',
        headers: this.getHeaders(),
      });
    } catch {}
  }

  async markAllNotificationsRead(): Promise<void> {
    try {
      await fetch(`${API_BASE}/notifications/mark-all-read`, {
        method: 'POST',
        headers: this.getHeaders(),
      });
    } catch {}
  }

  resetDemoData() {
    localStorage.removeItem('a2v_farms');
    localStorage.removeItem('a2v_crop_lots');
    localStorage.setItem('a2v_farms', JSON.stringify(DEFAULT_DEMO_FARMS));
    localStorage.setItem('a2v_crop_lots', JSON.stringify([DEFAULT_DEMO_LOT]));
  }
}

export const api = new ApiService();
