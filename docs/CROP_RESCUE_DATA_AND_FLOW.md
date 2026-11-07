# Agri2Value — Crop Rescue Mode Data Models & Architectural Flow
**Route:** `/app/rescue`  
**Integration:** FastAPI Crop Rescue Router & Execution Service  
**Date:** November 2026

---

## 1. End-to-End Emergency Salvage Flow

```
[Farmer Harvest Lot (4,000 kg Grade A)]
               │
               ▼
   [Crop Rescue Mode Trigger]
       - Weather Alert (Open-Meteo 35mm rain)
       - Market Alert (APMC -20% glut)
       - Shelf-Life Degradation (24h limit)
               │
               ▼
   [Urgency Index Calculation Engine]
   - Weather Weight: 35%
   - Shelf Life Weight: 30%
   - Mandi Price Slump Weight: 20%
   - Logistics Weight: 15%
   ==> Urgency Score: 85/100 (CRITICAL)
               │
               ▼
   [5 Salvage Pathways Evaluated]
   1. Food Processing (Sahyadri Agro): Net ₹64,800 [RECOMMENDED]
   2. Corporate Offtake (Reliance Fresh): Net ₹58,200
   3. Cold Storage Buffer (Niphad Pre-Cooling): Net ₹52,400
   4. Solar Dehydration (Gramin SHG): Net ₹46,000
   5. Flash Mandi Auction (Pimpalgaon APMC): Net ₹48,000
               │
               ▼
   ["What-If" Scenario Simulation]
   (Adjust APMC slump %, Rain threat, Remaining shelf life)
               │
               ▼
   [Emergency Dispatch Modal Selection]
   - Window: Immediate (0-3 hrs)
   - Farmer Handling Notes
   - Reference Generated: RSC-2026-XXXX
               │
               ▼
   [POST /api/v1/execution/request]
   - crop_lot_id: "demo-crop-lot-001"
   - route_type: "PROCESSING" / "COLD_STORAGE" / "COMMERCIAL_BUYER"
   - target_entity_id: "proc-sahyadri-01"
               │
               ▼
   [Redirect to /app/execution (Smart Execution Tracker)]
```

---

## 2. Pydantic Schemas & Data Structures

### 2.1 Salvage Pathway Schema (`frontend/src/mockData.ts` & Backend Pydantic)
```typescript
export interface SalvagePathway {
  id: string;
  title: string;
  facility_name: string;
  destination: string;
  route_type: 'PROCESSING' | 'COLD_STORAGE' | 'COMMERCIAL_BUYER' | 'MANDI_DIRECT';
  estimated_salvaged_payout: number;
  value_salvaged_percentage: number;
  time_to_safety_hours: number;
  facility_readiness: string;
  risk_level: 'LOW' | 'MODERATE' | 'HIGH';
  is_primary: boolean;
  why_recommended?: string;
  gross_value: number;
  logistics_cost: number;
  processing_fee: number;
  tariff_deductions: number;
}
```

### 2.2 Crop Rescue Assessment Model
```typescript
export interface CropRescueAssessment {
  crop_lot_id: string;
  crop_name: string;
  variety: string;
  quantity_kg: number;
  urgency_index: number;
  urgency_severity: 'LOW' | 'ELEVATED' | 'HIGH' | 'CRITICAL';
  status_headline: string;
  root_causes: string[];
  weather_alert: string;
  mandi_alert: string;
  time_to_safety_hours: number;
  value_at_risk: number;
  urgency_factors: {
    weather_risk: number;
    shelf_life_urgency: number;
    mandi_price_slump: number;
    logistics_bottleneck: number;
  };
  assumptions: {
    safe_shelf_life_hours: number;
    rainfall_threshold_mm: number;
    apmc_slump_trigger_pct: number;
    puree_recovery_rate_pct: number;
    cold_storage_daily_rate_per_kg: number;
  };
  salvage_pathways: SalvagePathway[];
}
```

---

## 3. Financial Deduction Formulas

1. **Industrial Puree Offtake:**
   $$\text{Gross Value} = 4,000\,\text{kg} \times ₹18.00/\text{kg} = ₹72,000$$
   $$\text{Logistics Freight} = ₹1,800 \quad (\text{Tempo 3T, 42km})$$
   $$\text{Industrial Processing Service Fee} = ₹5,400$$
   $$\mathbf{\text{Net Realized Salvage}} = ₹72,000 - ₹1,800 - ₹5,400 = \mathbf{₹64,800}$$

2. **Cold Storage Buffer (14 Days Preservation):**
   $$\text{Gross Future Value} = 4,000\,\text{kg} \times ₹16.00/\text{kg} = ₹64,000$$
   $$\text{Local Transfer Transit} = ₹1,200 \quad (\text{12km to Niphad Hub})$$
   $$\text{Cold Room Tariff} = 4,000\,\text{kg} \times ₹0.185/\text{kg/day} \times 14\,\text{days} = ₹10,360 \approx ₹10,400$$
   $$\mathbf{\text{Net Realized Salvage}} = ₹64,000 - ₹1,200 - ₹10,400 = \mathbf{₹52,400}$$

3. **Distress APMC Flash Liquidation:**
   $$\text{Distress Gross Auction} = 4,000\,\text{kg} \times ₹13.00/\text{kg} = ₹52,000$$
   $$\text{Yard Transit Freight} = ₹1,500$$
   $$\text{Market Yard Cess \& Labour Fee} = ₹2,500$$
   $$\mathbf{\text{Net Realized Salvage}} = ₹52,000 - ₹1,500 - ₹2,500 = \mathbf{₹48,000}$$

$$\mathbf{\text{Value Saved by Choosing Processing Over Distress Auction}} = ₹64,800 - ₹48,000 = \mathbf{+₹16,800}$$
