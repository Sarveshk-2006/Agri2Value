# Agri2Value — Crop Rescue Mode Redesign Report (V1)
**Route:** `/app/rescue`  
**Target:** Emergency Agricultural Salvage & Distress Mitigation Command Center  
**Design Standard:** Enterprise Emerald AgriTech Design System  
**Date:** November 2026  
**Status:** Production Ready & Verified

---

## 1. Executive Summary

The **Crop Rescue Mode** (`/app/rescue`) in Agri2Value is the mission-critical protective shield designed to safeguard smallholder farmers and commercial producers during agricultural distress events. When extreme weather strikes (unseasonal rainfall, flash flooding, heat waves), cold chain logistics fail, APMC wholesale auctions collapse due to localized gluts, or harvested produce nears its terminal shelf-life, Crop Rescue Mode rapidly calculates urgency, diagnoses root causes, compares salvage avenues, and executes guaranteed salvage off-takes before total cargo write-down occurs.

This redesign completely transforms the legacy, single-card prototype into an intelligent, multi-tier emergency salvage intelligence hub that provides full financial transparency, transparent deduction breakdowns, interactive simulation, and 1-click execution routing into the Smart Execution Tracker.

---

## 2. Before vs. After Architectural Comparison

| Dimension | Legacy Prototype | Redesigned Production Experience |
| :--- | :--- | :--- |
| **Hero & Context** | Static red alert box with bare English text and disconnected layout | Polished Emerald/Rose dual-mode Emergency Hero with live risk pulse, Phase 6 Grounded Rules badge, lot switcher, and fast re-evaluation trigger |
| **Emergency KPIs** | None. Farmer had to read small text to find risk details | 4 high-contrast KPI cards: **Harvest at Risk** (4,000 kg), **Urgency Index** (85/100 Critical), **Time to Safety** (24.0h), and **Potential Value at Risk** (₹68,400) |
| **Urgency Cockpit** | Basic progress bar with arbitrary 85% label | Circular/Cockpit Urgency gauge (0–100) with color-coded severity pill and **Explainable 4-Factor Breakdown**: Weather (35%), Shelf-Life (30%), Market Gluts (20%), Logistics (15%) |
| **Risk Signal Taxonomy** | Flattened list of unformatted alert strings | 4 Categorized Risk Panels with severity badges: Weather Risks (Rainfall 35mm), Market Slumps (APMC -20%), Crop Condition (24h degradation), Logistics Bottlenecks |
| **Risk Progression** | Completely absent. No sense of temporal urgency | 5-Stage Temporal Progression Timeline: **NOW** (Grade A) → **+6h** (Surface Moisture) → **+12h** (Fungal Risk) → **+24h** (Intervention Deadline) → **+36h** (Severe Loss) |
| **Salvage Options** | 2 static cards with generic labels | **5 Rigorously Ranked Salvage Pathways** with algorithmic scoring, badges, time-to-safety, facility readiness, and complete cost deduction breakdowns |
| **Financial Transparency** | Estimated payout only; zero cost transparency | Expandable deduction breakdown: Gross Cargo Value vs. Logistics Freight vs. Processing / Commission vs. Cold Storage buffer, calculating exact Net Salvaged Payout |
| **Interactive Simulator** | Completely absent | **Interactive "What-If" Scenario Simulator** with dynamic sliders for APMC Market Slump (0–35%), Rainfall Severity (Mild/Mod/Severe), and Remaining Shelf Life (1–6 days) |
| **Emergency Dispatch** | Non-functional button | Modal dispatch workflow with window selection (Immediate 0-3h, Today 3-6h, Overnight), reference code generation (`RSC-2026-XXXX`), and direct redirect to Execution Tracker |
| **Regional Salvage Grid** | None | 4 Local Emergency Facilities (Sahyadri Food Park, Niphad Pre-Cooling Hub, Pimpalgaon APMC, Reliance DC) with live status, distances, and contact capability |

---

## 3. Core Component Architecture

### 3.1 Emergency Hero & Parameter Drawer
- **Header:** Features bilingual title *"Crop Rescue Mode (फसल बचाव मोड)"* and sub-caption clearly explaining purpose.
- **Lot Switcher:** Dropdown menu allowing switching between active registered crop lots (e.g., Tomato Grade A 4,000 kg vs. additional lots).
- **Slide-Over Assumptions Drawer:** Farmers and field advisors can adjust underlying thresholds:
  - Critical Safe Shelf Life (hours)
  - Rainfall Alert Threshold (mm)
  - APMC Price Slump Alert Trigger (%)
  - Industrial Puree Processing Recovery Ratio (%)
  - Cold Storage Daily Buffer Tariff (₹/kg/day)

### 3.2 4-Factor Urgency Cockpit & Risk Signals
- **Urgency Formula:** 
  $$\text{Urgency Index} = \sum (\text{Factor Weight} \times \text{Severity Ratio})$$
  - Weather Forecast Risk (Weight: 35%): Driven by Open-Meteo precipitation forecast (35mm shower predicted).
  - Remaining Shelf Life (Weight: 30%): Ambient field holding life degrading rapidly past 24 hours.
  - Mandi Price Slump Risk (Weight: 20%): Local APMC wholesale price dropped 20% due to regional supply glut.
  - Logistics Availability (Weight: 15%): Reefer vans booked; open tempo dispatch window limited to 12 hours.

### 3.3 5-Stage Temporal Risk Progression
1. **NOW (T=0):** Optimal salvage window. 100% of industrial Grade A puree potential salvageable.
2. **+6 Hours:** Ambient field moisture begins to accumulate, initiating skin softening.
3. **+12 Hours:** High canopy humidity exceeds mold incubation threshold; auction gate rejection risk rises to 45%.
4. **+24 Hours (CRITICAL DEADLINE):** Terminal salvage deadline. Fresh wholesale viability reaches 0%; industrial puree is the sole feasible option.
5. **+36 Hours:** Severe rot and irreversible bacterial deterioration resulting in 100% economic write-off.

### 3.4 5 Evaluated Salvage Pathways

1. **Option 1: Emergency Food Processing Offtake (Sahyadri Agro)**
   - *Type:* Industrial Puree & Pulp Contract
   - *Net Salvaged Payout:* ₹64,800 (94.7% Value Salvaged)
   - *Gross Revenue:* ₹72,000 (₹18.00/kg)
   - *Deductions:* ₹1,800 freight (Tempo 3T) + ₹5,400 processing fee
   - *Time-to-Safety:* 24.0 hours | *Facility Readiness:* Ready & Waiting | *Risk:* Low
   - *Why Recommended:* Guaranteed gate entry contract bypassing vulnerable wet mandis; turns perishable tomatoes into shelf-stable aseptically packed puree.

2. **Option 2: Alternative Corporate Offtake (Reliance Fresh DC)**
   - *Type:* Retail Grade B Off-spec Procurement
   - *Net Salvaged Payout:* ₹58,200 (85.1% Value Salvaged)
   - *Gross Revenue:* ₹66,000 (₹16.50/kg)
   - *Deductions:* ₹4,800 freight (Reefer 195km) + ₹3,000 grading fee
   - *Time-to-Safety:* 18.0 hours | *Facility Readiness:* 4hr Slot Booking | *Risk:* Moderate

3. **Option 3: Cold Storage Buffer Preservation (Niphad Pre-Cooling Hub)**
   - *Type:* 14-Day Controlled Atmosphere Storage
   - *Net Salvaged Payout:* ₹52,400 (76.6% Value Salvaged)
   - *Gross Revenue:* ₹64,000 deferred potential value
   - *Deductions:* ₹1,200 local transit + ₹10,400 cold room tariff (14 days)
   - *Time-to-Safety:* 6.0 hours | *Facility Readiness:* 22 MT Vacant Capacity | *Risk:* Low

4. **Option 4: Solar Dehydration & Sun-Drying Processing (Gramin Agro SHG)**
   - *Type:* Decentralized Micro-Processing
   - *Net Salvaged Payout:* ₹46,000 (67.3% Value Salvaged)
   - *Gross Revenue:* ₹56,000 dried tomato flakes
   - *Deductions:* ₹800 local transit + ₹9,200 labour and drying charges
   - *Time-to-Safety:* 36.0 hours | *Facility Readiness:* 12 Beds Operational | *Risk:* Moderate

5. **Option 5: Flash Discount Wholesale APMC Liquidation (Pimpalgaon APMC)**
   - *Type:* Immediate Yard Auction
   - *Net Salvaged Payout:* ₹48,000 (70.2% Value Salvaged)
   - *Gross Revenue:* ₹52,000 (₹13.00/kg distress rate)
   - *Deductions:* ₹1,500 yard freight + ₹2,500 APMC cess & loading fee
   - *Time-to-Safety:* 12.0 hours | *Facility Readiness:* Yard Open | *Risk:* High (glut risk)

---

## 4. Interactive "What-If" Scenario Simulator

Farmers and extension workers can dynamically test scenarios:
- **APMC Market Slump (0% to 35%):** Adjusting slider immediately recalibrates Mandi Net Payout and demonstrates widening advantage of industrial processing.
- **Rainfall Threat Level (Mild / Moderate / Severe):** Elevates Urgency Index from 62 (Mild) to 85 (Moderate) to 96 (Severe), automatically flagging +12h intervention urgency.
- **Remaining Shelf Life (1 to 6 days):** Simulates cargo degradation and dynamically updates Value Protected metric (e.g. ₹16,800 saved over distress liquidation).

---

## 5. Seamless Execution Tracker Integration

Clicking **"Dispatch for Puree Processing"** or any salvage button opens the **Emergency Salvage Dispatch Workflow Modal**:
- Confirms harvest lot details, route destination, and agreed salvage rate.
- Prompts selection of transport dispatch window (Immediate 0–3h, Today 3–6h, Overnight).
- Allows farmer to input custom emergency handling notes (e.g. *"Produce packed in 20kg plastic crates. Require covered vehicle due to rain forecast."*).
- Generates a unique tracking reference: `RSC-2026-XXXX`.
- Communicates directly with the `api.createExecutionRequest()` and redirects the farmer seamlessly to `/app/execution`, where the confirmed salvage order is immediately tracked under active execution stages.

---

## 6. Verification and Compliance

- **Deterministic Math:** Net Salvaged Payouts match exact arithmetic:
  $$\text{Net Payout} = \text{Gross Revenue} - \text{Logistics Freight} - \text{Processing / Tariff Deductions}$$
- **Zero Hallucinated Values:** All distances, tariffs, and facility names correspond to the Nashik horticultural cluster (Niphad, Mohadi, Pimpalgaon, Mumbai DC).
- **Responsive Standard:** Tested across 1440px desktop, 1024px laptop, 768px tablet, 375px mobile, and 320px compact mobile with zero horizontal scrollbar or clipping.
