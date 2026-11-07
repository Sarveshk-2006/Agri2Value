# AGRI2VALUE — CROP RESCUE MODE UI/UX AUDIT

**Target Route:** `/app/rescue`  
**Lead Component:** [`frontend/src/components/CropRescueView.tsx`](file:///d:/Agri2Value/frontend/src/components/CropRescueView.tsx)  
**Data Layer:** [`frontend/src/mockData.ts`](file:///d:/Agri2Value/frontend/src/mockData.ts) (`MOCK_CROP_RESCUE`), [`backend/app/execution/crop_rescue_service.py`](file:///d:/Agri2Value/backend/app/execution/crop_rescue_service.py)  
**Backend Endpoints:** `GET /api/v1/crop-rescue/lot/{id}`, `POST /api/v1/crop-rescue/lot/{id}`, `POST /api/v1/execution/requests`  
**Date:** November 7, 2026  
**Status:** Pre-Implementation Baseline Audit Complete

---

## 1. Executive Summary

A thorough pre-implementation audit of the **Crop Rescue Mode** module (`/app/rescue`) was conducted across desktop (1440px), tablet (768px), and mobile (375px/320px) viewports.

Crop Rescue Mode serves as an emergency decision-support command center when perishable crops face sudden threats (pre-monsoon rainfall, canopy humidity rot, market price crashes, cold chain delays, or ticking ambient shelf-life).

While the backend logic in `crop_rescue_service.py` provides grounded rules for perishability and weather alerts, the existing user interface suffers from notable limitations:
- **Hero Banner:** Generic gradient card with a faint icon, lacking strong value positioning ("Protect Your Harvest. Recover Your Value.") and active situation awareness.
- **Zero Overview KPIs:** Absence of a 4-card emergency summary (Harvest At Risk, Urgency Index, Time to Safety, Potential Value at Risk).
- **Basic Urgency Score Gauge:** Simple horizontal bar without circular/radial progress visuals or explainable factor breakdowns (Weather exposure, Market volatility, Shelf-life decay, Storage availability).
- **Limited Salvage Pathways:** Only 2 options rendered; lacks cold storage buffer, alternative corporate buyer offtake, and solar dehydration pathways.
- **Missing Financial Recovery Comparison:** No side-by-side comparison of baseline expected payout vs current market liquidation vs emergency processing vs cold storage recovery.
- **Missing "What-If" Scenario Simulator:** No interactive tool allowing farmers to test price slumps (-5% to -20%), rainfall intensification, or transport cost hikes.
- **Direct Submissions Without Confirmation Modal:** Clicking a pathway immediately lodges a background request without a tailored confirmation modal or reference dispatch code (`RSC-2026-XXXX`).
- **Missing Risk Progression Timeline:** No visual trajectory showing risk escalation from NOW through +6h, +12h, +24h, and +36h.
- **No Regional Salvage Facility Network:** Lacks spatial visibility into nearest processing plants, cold hubs, and mandis.

---

## 2. Baseline UI & Functional Defects Catalog

| ID | Section / Feature | Baseline Observation | Proposed Redesign Solution |
|---|---|---|---|
| **AUD-RSC-01** | **Hero Banner** | Red/orange card with simple text; lacks urgency authority and live timestamping. | Premium command-center hero: *"Crop Rescue Intelligence"*, subhead *"Protect Your Harvest. Recover Your Value."*, live emergency status indicator, Phase 6 Grounded Rules badge, and 1-click re-evaluation. |
| **AUD-RSC-02** | **Emergency Overview KPIs** | None. Zero aggregate metrics. | **4 Elevated Emergency Cards**: (1) Harvest At Risk (4,000 kg), (2) Urgency Index (85/100 CRITICAL), (3) Time to Safety (24 Hours Safe Window), (4) Potential Value at Risk (₹72,000 Gross / ₹24,000 Loss Threat). |
| **AUD-RSC-03** | **Harvest Lot Selector** | Basic select element with minimal metadata. | Rich selection toolbar displaying lot quantity, quality grade, variety, harvest date, location, and remaining safe ambient days. |
| **AUD-RSC-04** | **Urgency Gauge** | Basic linear bar with text score; lacks factor explainability. | **Circular Semicircular Urgency Cockpit** (0–100) with color-coded severity tiers (Low, Moderate, High, Critical) and weighted factor decomposition (Weather 35%, Shelf-life 30%, Market 20%, Logistics 15%). |
| **AUD-RSC-05** | **Risk Signals Panel** | Flat list of un-categorized text strings. | Categorized risk panels across 4 distinct dimensions: (A) Weather Risks, (B) Market Risks, (C) Crop Condition Risks, and (D) Logistics Constraints. |
| **AUD-RSC-06** | **Emergency Risk Timeline** | Completely absent. | **Visual Risk Progression Timeline**: NOW (Rain Alert Detected) → +6h (Moisture Exposure) → +12h (Quality Degradation) → +24h (Rot Spoilage Threat) → +36h (Distress Liquidation). |
| **AUD-RSC-07** | **Ranked Salvage Pathways** | Only 2 basic options (Processing & Mandi). | **Comprehensive 5-Pathway Evaluation Engine**: (1) Emergency Food Processing, (2) Flash Mandi Liquidation, (3) Cold Storage Buffer, (4) Alternative Corporate Offtake, (5) Solar Dehydration with explicit ranking rationale ("Why Recommended"). |
| **AUD-RSC-08** | **Financial Recovery Comparison** | None. | **Visual Financial Recovery Matrix & Chart**: Normal Expected Payout vs Market Sale vs Processing vs Cold Storage vs Loss Avoided, calculating net salvaged payouts ($\text{Revenue} - \text{Deductions}$) and recovery %. |
| **AUD-RSC-09** | **"What-If" Scenario Simulator** | Completely absent. | **Interactive Scenario Simulator**: Dynamic sliders for Mandi Price Slump (-5% to -20%), Rain Intensity, Shelf-Life Reduction, and Freight Costs with live re-calculation of net returns and time-to-safety. |
| **AUD-RSC-10** | **Emergency Dispatch Modal** | Raw background dispatch without terms confirmation. | **Guided Pathway Dispatch Workflow Modal**: Route-specific confirmation (Intake gate, agreed price lock, transport allocation, itemized fee breakdown) with unique reference code (`RSC-2026-XXXX`) and direct routing to Execution Tracker. |
| **AUD-RSC-11** | **Regional Salvage Grid** | None. | **Regional Salvage Facility Grid**: Proximity markers for Sahyadri Food Park (42 km), Pimpalgaon Mandi (18 km), Niphad Pre-Cooling Hub (12 km), and Reliance Sourcing (195 km). |
| **AUD-RSC-12** | **Configurable Assumptions Drawer** | Simple inline box. | **Slide-Over Assumptions Drawer**: Biological shelf-life, rainfall sensitivity thresholds, puree recovery yield %, and cold storage monthly tariffs with reset to defaults. |

---

## 3. Baseline Screenshots Record

- Desktop Baseline (1440px): `docs/screenshots/rescue_baseline_desktop.png` (193,601 bytes)
- Tablet Baseline (768px): `docs/screenshots/rescue_baseline_tablet.png` (169,706 bytes)
- Mobile Baseline (375px): `docs/screenshots/rescue_baseline_mobile.png` (63,640 bytes)
