# AGRI2VALUE — PROFIT DECISION ENGINE VISUAL & DATA SPECIFICATION

**Module:** `/app/decision` (`frontend/src/components/DecisionEngineView.tsx`)  
**Backend:** `backend/app/decision_engine/engine.py`  
**Precision Standard:** Python `Decimal` with strict half-up quantization and INR formatting.  
**Version:** V1 Redesign (November 2026)  

---

## 1. Visual Hierarchy & Design System

The redesigned Profit Decision Engine transforms raw tabular optimization logs into an intuitive, high-confidence executive workspace for Indian farmers.

### 1.1 Color Tokens & Semantic Meanings
| Token | Hex / Class | Visual Role |
|---|---|---|
| **Forest Brand** | `#043320` / `bg-emerald-950` | Primary header text, brand anchor, dark mode contrast |
| **Agricultural Emerald** | `#059669` / `bg-emerald-600` | Recommended pathway badge, primary CTA button, active indicators |
| **Canvas Background** | `#f8faf8` / `bg-[#f8faf8]` | Soft anti-glare rural canvas |
| **Card Surface** | `#ffffff` / `bg-white` | Elevated card containers with `shadow-sm` and `border-emerald-100/60` |
| **Financial Monospace** | `font-mono tracking-tight` | Exact currency figures, kg volumes, and tariff deductions |
| **Alert / Distress** | `#ef4444` / `bg-red-50 text-red-700` | Disqualified pathway warning, negative variance callout |
| **Amber Warning** | `#f59e0b` / `bg-amber-50 text-amber-700` | Sensitivity variance alert, perishable time hazard |

---

## 2. Decision Pathways & Deterministic Mathematical Rules

The engine evaluates 5 candidate commercial pathways for each produce lot:

### 2.1 Pathway 1: Value-Added Processing Co-op
- **Formula:**
  $$\text{Gross Revenue} = \text{Volume (kg)} \times \text{Agreed Processing Price (₹/kg)}$$
  $$\text{Total Deductions} = \text{Transport} + \text{Sorting / Crate Handling Fee}$$
  $$\text{Net Profit} = \text{Gross Revenue} - \text{Total Deductions}$$
- **Canonical Values (4,000 kg Grade A Tomato):**
  - Gross: $4,000 \times 19.00 = ₹76,000$
  - Freight: ₹4,800
  - Handling: ₹2,800
  - Net Profit: $76,000 - (4,800 + 2,800) = ₹68,400$
  - Realization: ₹17.10/kg

### 2.2 Pathway 2: Direct Verified Institutional Buyer (BigBasket)
- **Formula:**
  $$\text{Gross Revenue} = \text{Volume (kg)} \times \text{Direct Purchase Offer (₹/kg)}$$
  $$\text{Total Deductions} = \text{Farm-gate aggregation transport} + \text{Quality sorting fee}$$
- **Canonical Values:**
  - Gross: $4,000 \times 18.25 = ₹73,000$
  - Freight: ₹4,000
  - Handling: ₹2,000
  - Net Profit: $73,000 - (4,000 + 2,000) = ₹67,000$
  - Realization: ₹16.75/kg

### 2.3 Pathway 3: APMC Regulated Mandi Auction (Pimpalgaon Baswant)
- **Formula:**
  $$\text{Gross Revenue} = \text{Volume (kg)} \times \text{APMC Modal Price (₹/kg)}$$
  $$\text{Total Deductions} = \text{Mandi transport} + \text{Cess / APMC user fee} + \text{Hamali loading fee} + \text{Unloading}$$
- **Canonical Values:**
  - Gross: $4,000 \times 15.20 = ₹60,800$
  - Freight: ₹5,600
  - Cess & Mandi User Fees: ₹1,800
  - Hamali & Weighment: ₹1,600
  - Net Profit: $60,800 - (5,600 + 1,800 + 1,600) = ₹51,800$
  - Realization: ₹12.95/kg

### 2.4 Pathway 4: Cold Storage Pre-Cooling & Arbitrage
- **Formula:**
  $$\text{Gross Revenue} = \text{Volume (kg)} \times \text{Forecasted Off-peak Mandi Price (₹/kg)}$$
  $$\text{Total Deductions} = \text{Inward freight} + \text{Pre-cooling & 30-day cold rent} + \text{Expected storage shrinkage}$$
- **Canonical Values:**
  - Gross: $4,000 \times 18.50 = ₹74,000$
  - Freight: ₹3,600
  - Storage & Power: ₹6,500
  - Shrinkage (2%): ₹1,480
  - Net Profit: $74,000 - (3,600 + 6,500 + 1,480) = ₹62,420$
  - Realization: ₹15.61/kg

### 2.5 Pathway 5: Farm-Gate Distress Bulk Trader
- **Feasibility Constraint Check:**
  $$\text{Offered Price} < \text{Minimum Cost of Production Threshold (₹12.50/kg)}$$
  $$\text{Status} \rightarrow \mathbf{DISQUALIFIED}$$
- **Disqualification Reason:**
  `"Net realization ₹8.00/kg is below minimum cost of production threshold (₹12.50/kg). Accepting this route would result in a severe negative farmer margin."`

---

## 3. Data Provenance & Trust Matrix

Every data point rendered on the page carries a transparent provenance classification:

| Data Element | Provenance Source | Verification Standard |
|---|---|---|
| **APMC Benchmark Price** | Agmarknet / MSAMB | Updated daily at 11:30 AM via official mandi gate receipts |
| **Direct Buyer Contract Offer** | Verified Institutional Buyer | Fixed binding contract valid for 48 hours |
| **Freight & Transport Rates** | Regional Transporters Guild | Standard ₹1.20/kg/50km bulk diesel rate table |
| **Cold Storage Rates** | APEDA / State Cold Storage Registry | ₹1.50/kg/month standard government-regulated tariff |
| **Produce Lot Volume & Grade** | Farmer Registered Holding | Calibrated on-farm weighment & visual inspection |

---

## 4. Execution Request Dispatch Flow

Clicking **"Proceed with This Pathway"** executes a seamless 4-step dispatch:
1. Validates JWT farmer session credentials.
2. Posts payload to `/api/v1/execution/requests` with `lot_id`, `option_id`, and `scenario_id`.
3. Displays an immediate success notification:
   `"Execution dispatch confirmed for Sahyadri Food Processing Co-op! Redirecting to tracker..."`
4. Updates global state and redirects the farmer to `/app/execution` to view live logistics dispatch and weighbridge tracking.
