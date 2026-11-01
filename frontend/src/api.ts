import type {
  AuthTokens,
  CropLot,
  Farm,
  User,
  DecisionRun,
  WeatherResponse,
  MandiPricesResponse,
  MandiQuoteResponse,
} from './types';

const API_BASE = '/api/v1';

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
  id: '1a30d9c6-3e7f-409e-8a5b-ea4a7065c4a9',
  owner_user_id: '07db312f-99dc-4d16-a176-bbaf2a33ca94',
  farm_name: 'Patil Krishi Farm',
  state: 'Maharashtra',
  district: 'Nashik',
  village: 'Niphad',
  latitude: 20.0768,
  longitude: 74.0375,
  land_area: 3.5,
  land_area_unit: 'acre',
  is_active: true,
  resources: [
    {
      id: 'res-1',
      resource_type: 'storage',
      name: 'Shaded On-farm Shed (2 MT capacity)',
      quantity: 2000,
      unit: 'kg',
      availability_status: 'available',
    },
    {
      id: 'res-2',
      resource_type: 'equipment',
      name: 'Plastic Harvesting Crates (20 kg each)',
      quantity: 80,
      unit: 'crates',
      availability_status: 'available',
    },
    {
      id: 'res-3',
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

export const DEFAULT_DEMO_LOT: CropLot = {
  id: '862b8403-0889-43f4-9402-a2e1da4c0032',
  farm_id: '1a30d9c6-3e7f-409e-8a5b-ea4a7065c4a9',
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
      id: 'evt-1',
      crop_lot_id: '862b8403-0889-43f4-9402-a2e1da4c0032',
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

  private getHeaders(): HeadersInit {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    return headers;
  }

  async checkHealth(): Promise<{ status: string; backendOnline: boolean }> {
    try {
      const res = await fetch(`${API_BASE}/health`);
      if (res.ok) {
        const data = await res.json();
        return { status: data.status, backendOnline: true };
      }
      return { status: 'offline', backendOnline: false };
    } catch {
      return { status: 'offline', backendOnline: false };
    }
  }

  async demoLogin(phone: string, demoCode: string = '123456', fullName: string = 'Ramesh Patil'): Promise<AuthTokens> {
    try {
      const res = await fetch(`${API_BASE}/auth/demo-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, demo_code: demoCode, full_name: fullName }),
      });
      if (!res.ok) {
        const err = await res.json();
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

  async getMe(): Promise<User> {
    try {
      const res = await fetch(`${API_BASE}/auth/me`, {
        headers: this.getHeaders(),
      });
      if (res.ok) {
        return await res.json();
      }
    } catch {
      // Fallback
    }
    return DEFAULT_DEMO_USER;
  }

  async getFarms(): Promise<Farm[]> {
    try {
      const res = await fetch(`${API_BASE}/farms`, {
        headers: this.getHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.farms && data.farms.length > 0) {
          return data.farms;
        }
      }
    } catch {
      // Fallback
    }
    // Return stored or default
    const saved = localStorage.getItem('a2v_farms');
    return saved ? JSON.parse(saved) : [DEFAULT_DEMO_FARM];
  }

  async createFarm(farmData: Partial<Farm>): Promise<Farm> {
    try {
      const res = await fetch(`${API_BASE}/farms`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(farmData),
      });
      if (res.ok) {
        return await res.json();
      }
    } catch {
      // Fallback
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

  async getCropLots(farmId?: string): Promise<CropLot[]> {
    try {
      const url = farmId ? `${API_BASE}/crop-lots?farm_id=${farmId}` : `${API_BASE}/crop-lots`;
      const res = await fetch(url, { headers: this.getHeaders() });
      if (res.ok) {
        const data = await res.json();
        if (data.crop_lots && data.crop_lots.length > 0) {
          return data.crop_lots;
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
        return await res.json();
      }
    } catch {
      // Fallback
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
      status: 'READY_FOR_ANALYSIS',
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

  // ---- Phase 2: Profit Decision Engine Endpoints ------------------

  async evaluateDecision(
    cropLotId: string,
    scenarioPreset?: string,
    customParams?: Record<string, any>
  ): Promise<DecisionRun> {
    const payload: Record<string, any> = { crop_lot_id: cropLotId };
    if (scenarioPreset) payload.scenario_preset = scenarioPreset;
    if (customParams) payload.custom_parameters = customParams;

    const res = await fetch(`${API_BASE}/decision-engine/evaluate`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: 'Decision evaluation failed' }));
      throw new Error(err.message || 'Decision evaluation failed');
    }

    return await res.json();
  }

  async getDecision(decisionId: string): Promise<DecisionRun> {
    const res = await fetch(`${API_BASE}/decision-engine/decisions/${decisionId}`, {
      headers: this.getHeaders(),
    });

    if (!res.ok) {
      throw new Error('Failed to retrieve decision snapshot');
    }

    return await res.json();
  }

  async getLotDecisions(lotId: string): Promise<DecisionRun[]> {
    const res = await fetch(`${API_BASE}/decision-engine/lots/${lotId}/decisions`, {
      headers: this.getHeaders(),
    });

    if (!res.ok) {
      return [];
    }

    return await res.json();
  }

  // ---- Weather API (Phase 2.6) ----

  async getWeather(lat = 20.0760, lon = 74.0534): Promise<WeatherResponse> {
    const res = await fetch(`${API_BASE}/weather?latitude=${lat}&longitude=${lon}`, {
      headers: this.getHeaders(),
    });
    if (!res.ok) {
      throw new Error('Failed to retrieve weather data');
    }
    return await res.json();
  }

  // ---- Mandi API (Phase 2.6) ----

  async getMandiPrices(state = 'Maharashtra', commodity?: string): Promise<MandiPricesResponse> {
    const url = commodity
      ? `${API_BASE}/mandi/prices?state=${encodeURIComponent(state)}&commodity=${encodeURIComponent(commodity)}`
      : `${API_BASE}/mandi/prices?state=${encodeURIComponent(state)}`;
    const res = await fetch(url, {
      headers: this.getHeaders(),
    });
    if (!res.ok) {
      throw new Error('Failed to retrieve mandi prices');
    }
    return await res.json();
  }

  async getMandiQuote(cropName: string, district = 'Nashik', market?: string): Promise<MandiQuoteResponse> {
    const url = market
      ? `${API_BASE}/mandi/quote?crop_name=${encodeURIComponent(cropName)}&district=${encodeURIComponent(district)}&market=${encodeURIComponent(market)}`
      : `${API_BASE}/mandi/quote?crop_name=${encodeURIComponent(cropName)}&district=${encodeURIComponent(district)}`;
    const res = await fetch(url, {
      headers: this.getHeaders(),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to retrieve mandi quote');
    }
    return await res.json();
  }

  resetDemoData() {
    localStorage.removeItem('a2v_farms');
    localStorage.removeItem('a2v_crop_lots');
    localStorage.setItem('a2v_farms', JSON.stringify([DEFAULT_DEMO_FARM]));
    localStorage.setItem('a2v_crop_lots', JSON.stringify([DEFAULT_DEMO_LOT]));
  }
}

export const api = new ApiService();
