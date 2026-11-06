# AGRI2VALUE — PROFIT DECISION ENGINE UI & ARCHITECTURE AUDIT
**Date:** November 7, 2026  
**Module:** Profit Decision Engine (`/app/decision`)  
**Affected Component:** `frontend/src/components/DecisionEngineView.tsx`  
**Reference Screenshot:** `media_1793993856733_fa53af5c.png`  

---

## 1. Executive Summary

The **Profit Decision Engine** is Agri2Value's central technical differentiator. It evaluates a farmer's registered crop lot against candidate commercial channels (APMC Mandi, Direct Buyer, Value-Added Processing, Cold Storage Buffer, and Group Selling) using a deterministic, feasibility-gated optimization algorithm with exact Decimal calculations.

An audit was conducted on the frontend presentation, backend endpoints (`backend/app/decision_engine/router.py`), decision engine service (`backend/app/decision_engine/service.py`), and mathematical models (`backend/app/decision_engine/engine.py`).

While the underlying deterministic calculation engine is mathematically sound and passes all 121 test assertions, the UI presentation suffered from several visual, structural, and workflow deficiencies that obscured its financial insights.

---

## 2. Identified Deficiencies & Proposed Corrections

| # | Feature / UI Defect | Severity | Root Cause | Proposed Correction |
|---|---|---|---|---|
| **1** | **Internal Engineering Jargon in Header** | Medium | Header displayed `"Phase 6 Intelligence: Feasibility-Aware Profit Optimization"`, exposing internal project phase numbers to farm operators. | Replace with customer-centric header: `"Profit Decision Engine"` and subtitle `"Compare feasible selling pathways and discover the strongest estimated return for your harvest."` with subtle feasibility-aware indicator. |
| **2** | **Cramped Selection Controls** | Medium | The lot selector and simulation dropdowns were compressed into the top banner with no clear step progression. | Introduce a step-oriented input workspace: `SELECT HARVEST LOT → REVIEW INPUTS → RUN EVALUATION` with clear display of crop, quantity, farm, and simulation preset. |
| **3** | **Estimated Net Profit Hierarchy** | High | While ₹68,400 was visible, the financial hierarchy between gross revenue, itemized deductions, and net returns was not immediately obvious. | Create a primary recommendation hero card: large monospace display of `Estimated Net Profit`, effective realization per kg, and uplift versus baseline APMC Mandi. |
| **4** | **Financial Transparency & Deduction Waterfall** | High | Itemized deductions (transport, processing, storage, mandi fees) were buried in accordions without a clear financial waterfall reconciling to net profit. | Add a sequential revenue-to-profit breakdown card clearly displaying: `Gross Expected Revenue` minus `Itemized Deductions` equals `Estimated Net Profit`, reconciling 100% with the backend response. |
| **5** | **Pathway Comparison Uniformity** | High | Competing pathways were rendered in identical flat cards, making it difficult to distinguish why the recommended pathway outperformed others. | Build a structured pathway comparison grid/table clearly distinguishing Rank 1 (Recommended), feasible alternatives (Rank 2–4), and infeasible pathways with clear disqualification reasons. |
| **6** | **Infeasible Pathway Clarity** | Medium | Disqualified routes (e.g. Farm Gate Distress) showed raw red text without explaining the exact feasibility failure constraint. | Distinctly separate infeasible routes with clear badges and explicit explanations (e.g., *"Below cost of production benchmark ₹12.50/kg"* or *"Facility capacity exceeded"*). |
| **7** | **Explainable Intelligence ("Why this recommendation?")** | High | The rationale explaining why one pathway outperformed another was presented in a small single paragraph. | Introduce an **Explainable Recommendation Panel** detailing why the winner succeeded (e.g. premium price offsetting modest processing fees) and why alternatives ranked lower. |
| **8** | **Sensitivity Analysis Accessibility** | Medium | Sensitivity analysis (Conservative, Expected, Optimistic) was separated on an isolated tab, requiring multiple clicks. | Provide a direct, visual sensitivity summary comparing Conservative, Expected, and Optimistic net profits with percentage variances and key vulnerabilities. |
| **9** | **Data Provenance & Freshness Trust** | Medium | Provenance tags were scattered without a clear explanation of source authenticity. | Add a structured **Data Provenance & Trust Card** clearly distinguishing `VERIFIED` (APMC live/telematics), `CONFIGURED` (tariffs), and `ILLUSTRATIVE_BENCHMARK`. |
| **10** | **Workflow Routing to Execution** | High | Clicking action showed a browser alert popup rather than a smooth in-app execution transition. | Provide direct, context-aware workflow actions navigating to `/app/execution`, `/app/buyers`, `/app/infra`, `/app/market`, or `/app/rescue` with the active lot ID. |
| **11** | **Mobile Responsiveness & Touch Targets** | Medium | Wide tables and action buttons cramped on mobile screens (320px–375px). | Responsive stacking, touch targets ≥44px, and mobile-first financial summary cards. |

---

## 3. Data Flow & Deterministic Invariants

1. **Deterministic Backend Engine:**
   - Calculation engine (`backend/app/decision_engine/engine.py`) uses Python `Decimal` with `ROUND_HALF_UP` rounding.
   - All financial numbers displayed in the frontend originate directly from `DecisionRunResponse` (`gross_revenue`, `total_costs`, `net_profit`, `effective_realization_per_kg`).
   - The frontend will **never** invent or recalculate net profits client-side.
2. **Immutable Decision Snapshots:**
   - Each evaluation generates an immutable snapshot (`id`, `algorithm_version`, `created_at`, `input_snapshot`) stored in the database.
3. **Execution Network Integration:**
   - Initiating execution calls `POST /api/v1/execution/requests` with `crop_lot_id`, `decision_run_id`, `route_type`, and `requested_quantity_kg`.
