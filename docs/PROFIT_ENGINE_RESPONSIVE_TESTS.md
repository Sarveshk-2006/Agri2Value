# AGRI2VALUE — PROFIT DECISION ENGINE RESPONSIVE DESIGN & TEST REPORT
**Module:** Profit Decision Engine (`/app/decision`)  
**Date:** November 7, 2026  
**Status:** 100% Verified Across All Breakpoints  

---

## 1. Responsive Verification Matrix

Headless Chrome visual testing and layout validations were conducted across all standard viewports:

| Viewport Category | Screen Resolution | Screenshot Reference | Horizontal Overflow | Layout Highlights & Touch Adaptation |
|---|---|---|---|---|
| **Mobile Small** | 320 × 700 px | `docs/screenshots/decision_redesign_mobile_320.png` | **0px (Clean)** | Single-column cards; vertical metric stacking; touch targets ≥44px; deduction waterfall wraps smoothly without horizontal clipping; hero profit callout scales with `break-words`. |
| **Mobile Standard** | 375 × 812 px | `docs/screenshots/decision_redesign_mobile_375.png` | **0px (Clean)** | Fluid card padding; full-width action buttons; clear rupee breakdown; tabs wrap gracefully; sensitivity sliders formatted with touch-friendly thumbs. |
| **Mobile Large** | 430 × 932 px | Verified | **0px (Clean)** | Generous padding; responsive tab bar wraps cleanly; badge labels and provenance tags fit without clipping. |
| **Tablet Portrait** | 768 × 1024 px | `docs/screenshots/decision_redesign_tablet_768.png` | **0px (Clean)** | 2-column input bar; 4-step deduction waterfall layout; side-by-side net profit and realization metrics; responsive 5-pathway comparative cards. |
| **Laptop / Small Desktop** | 1024 × 800 px | `docs/screenshots/decision_redesign_laptop_1024.png` | **0px (Clean)** | Balanced 3-column input workflow; rich horizontal deduction waterfall; prominent recommended hero card with direct dispatch call-to-action. |
| **Standard Laptop** | 1366 × 768 px | Verified | **0px (Clean)** | High visual density without clutter; seamless alignment between gross revenue, deductions, and net yield. |
| **High-Res Desktop** | 1440 × 1100 px | `docs/screenshots/decision_redesign_desktop_1440.png` | **0px (Clean)** | Zero unused blank space; full-width intelligence banner; multi-column scenario cards and provenance matrix. |

---

## 2. Component Adaptation & Breakpoint Specifications

### 2.1 Workspace Header & Simulation Bar
- **Desktop (≥1024px):** 3 distinct step cards in a 3-column grid:
  1. *Select Lot* (with variety & farm holding chips).
  2. *Active Crop Profile* (4,000 kg Grade A Hybrid, Niphad location).
  3. *Simulation Preset & Re-Evaluate* (Pilot baseline, mandi surge, diesel hike, delay).
- **Tablet (768px - 1023px):** Adapts to 2 columns with the simulation runner spanning full width.
- **Mobile (<768px):** Stacks vertically as single-column cards with large touch targets.

### 2.2 Recommended Pathway Hero Banner
- Highlights the #1 ranked optimal commercial channel (e.g. Sahyadri Food Processing Co-op).
- **Desktop:** Displays a 2-column layout:
  - Left column: Winner badge, buyer logo, location, distance, explainable rationale, and direct "Proceed with This Pathway" action.
  - Right column: Large emerald net profit card (₹68,400), effective realization (₹17.10/kg), and net gain comparison (+₹16,600 vs APMC Mandi).
- **Mobile (<768px):** Stacks into a clean, vertical card hierarchy with full-width primary CTA button.

### 2.3 Financial Deduction Waterfall
- Reconciles Gross Revenue (₹76,000) down to Estimated Net Return (₹68,400) via 5 itemized stages:
  1. Gross Crop Realization (₹19.00/kg)
  2. Logistics & Freight (-₹4,800)
  3. Processing / Handling (-₹2,800)
  4. Mandi Tax & Cess (₹0.00 waived)
  5. Net Farmer Margin (₹68,400 / 90.0% capture)
- **Desktop:** Rendered as an intuitive 5-step horizontal flow with connecting arrow chevrons and step icons.
- **Mobile (<768px):** Automatically transforms into a vertical progressive breakdown with full width rows and high contrast numerical pills.

### 2.4 All 5 Candidate Pathways Comparative Stack
- Cards rendered for all 5 channels:
  1. **Value-Added Processing Co-op** (Sahyadri Agro) — *FEASIBLE, #1 RANK*
  2. **Direct Verified Buyer** (BigBasket Wholesale) — *FEASIBLE, #2 RANK*
  3. **APMC Mandi Auction** (Pimpalgaon Baswant) — *FEASIBLE, #3 RANK*
  4. **Cold Storage Pre-Cooling** (Niphad Cold Hub) — *FEASIBLE, #4 RANK*
  5. **Farm-Gate Distress Bulk Trader** — *DISQUALIFIED (Below ₹12.50/kg production threshold)*
- Itemized cost breakdowns expand seamlessly without causing layout shifts or overlapping text.
- Disqualified cards visually dimmed with clear red badges and explicit rejection rationale.

### 2.5 Explainable AI Rationale Drawer
- Unfolds the deterministic scoring logic:
  - Higher net realization per kg.
  - Direct processing partner eliminates middleman commissions.
  - Pre-cooling shed verified on farm reduces perishable transit spoilage to <1.5%.

### 2.6 Multi-Scenario Sensitivity Analysis Workspace
- Interactive variance sliders:
  - Wholesale market price shift (-20% to +20%).
  - Diesel & freight rate shock (-10% to +30%).
  - Post-harvest handling spoilage (1% to 15%).
- 3 comparative scenarios rendered side-by-side:
  - **Conservative (Worst-case stress):** ₹54,200 (₹13.55/kg)
  - **Expected (Base case):** ₹68,400 (₹17.10/kg)
  - **Optimistic (Favorable market):** ₹81,600 (₹20.40/kg)
- Stacks into clean swipe-friendly vertical cards on mobile viewports.

---

## 3. Visual & Aesthetic Standards Verification

- **Theme Consistency:** Deep forest green (`#043320`, `#064e3b`), vibrant emerald (`#10b981`, `#059669`), warm off-white background (`#f8faf8`), and crisp white card containers (`#ffffff`).
- **Typography:** Inter & system fonts with clean tracking; all currency numbers formatted in tabular monospace for perfect visual alignment.
- **Micro-Interactions:** Subtle hover elevates, active tab indicators, animated transition states, and instant badge toggling.
- **Accessibility:** Color contrast ratios ≥ 4.5:1 across all body text and numerical badges; screen-reader accessible attributes.
