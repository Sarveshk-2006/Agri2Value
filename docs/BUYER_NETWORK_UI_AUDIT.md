# AGRI2VALUE — COMMERCIAL BUYER NETWORK UI/UX AUDIT

**Target Route:** `/app/buyers`  
**Components Evaluated:**  
- `frontend/src/components/BuyersView.tsx`  
- `frontend/src/mockData.ts` (`MOCK_BUYERS`, `MOCK_BUYER_OFFERS`)  
- `backend/app/execution/router.py` & `backend/app/execution/service.py`  
**Date:** November 7, 2026  
**Status:** Pre-Implementation Audit Complete  

---

## 1. Executive Summary

A comprehensive pre-implementation audit of the **Commercial Buyer Network** module (`/app/buyers`) was conducted across desktop (1440px), tablet (768px), and mobile (375px/320px) viewports.

The current implementation provides core data models for buyers and procurement offers, but suffers from:
- A rudimentary, low-density card layout that lacks the visual authority of a modern B2B procurement marketplace.
- Total absence of top-level marketplace statistics (Verified Buyers, Active Demands, Top Offered Price, Escrow volume).
- Rigid, limited filtering with no category filters, sort controls, or quick-filter chips.
- Missing Buyer Details drawer/modal to inspect corporate compliance, procurement radius, and historical trade records.
- Complete absence of a multi-offer comparison matrix with dynamic gross revenue calculation.
- A basic, single-step deal submission form rather than a guided, multi-step commercial agreement workflow.

---

## 2. Baseline UI & Functional Defects Catalog

| ID | Section | Baseline Observation | Proposed Redesign Solution |
|---|---|---|---|
| **AUD-01** | **Hero Header** | Plain flat card with small icon and yellow simulation pill; lacks visual gravitas. | Premium enterprise hero section: "Commercial Buyer Network • Connect. Compare. Sell Better.", live marketplace health indicator, simulation badge, and "Explore Buyers" quick scroll. |
| **AUD-02** | **Marketplace Statistics** | Zero aggregate metrics. Farmers cannot gauge market liquidity or top prices. | 4 elevated statistics cards: (1) Verified Buyers, (2) Active Offtake Offers, (3) Best Available Offered Rate (₹18.00/kg), (4) Escrow / Trust Indicator (₹2.4M+ settled). |
| **AUD-03** | **Search & Filters** | Bulky container with only basic text search and 2 static dropdowns (Crop, District). | Compact, responsive discovery toolbar with multi-field search (company, category, crop), 5 Quick Filter Chips (`All`, `Verified`, `Best Rates`, `Fast Payment`, `Nearby`), District & Category dropdowns, and Sort By controls. |
| **AUD-04** | **Buyer Identity & Branding** | Generic text heading; raw uppercase badges (`VERIFIED_COOPERATIVE`, `PROCESSOR`). | Professional brand cards with initials-based colored company avatars, verified shield badges, buyer category pills (Food Processor, Retail Chain, Wholesaler, Exporter), distance indicators, and star ratings. |
| **AUD-05** | **Procurement Offers Display** | Bare price text; offer details squashed horizontally on smaller screens. | High-contrast procurement offer cards with emerald monospace pricing (`₹18.00 / kg`), volume progress/requirements, delivery terms (Farmgate Pickup vs Warehouse Delivery), and payment timeline. |
| **AUD-06** | **Buyer Details Experience** | Non-existent; clicking a buyer provides no extended profile or contact details. | Interactive Slide-over Drawer / Modal displaying full corporate profile, verification credentials, procurement radius map/coordinates, active demand portfolio, payment escrow terms, and direct "Initiate Deal" trigger. |
| **AUD-07** | **Offer Comparison** | Completely missing; farmers cannot compare competing offers side-by-side. | Smart Multi-Offer Comparison Matrix: allows selecting 2 or 3 offers to compare price, grade, payment terms, distance, and net revenue with an interactive quantity slider. |
| **AUD-08** | **Initiate Deal Workflow** | Rudimentary 1-step form in a generic popup; abrupt submit without confirmation. | Premium 4-Step Deal Initiation Modal: (1) Buyer & Offer Review, (2) Crop Lot Allocation from farmer's actual harvest lots, (3) Commercial Terms & Delivery Scheduling with real-time gross revenue calculation, (4) Agreement Confirmation with unique reference ID (`AGR-2026-XXXX`) and direct routing to live Execution Tracker. |
| **AUD-09** | **Mobile Responsiveness** | On mobile (<768px), cards squish action buttons, modal overflows the screen, and filter inputs wrap awkwardly. | Mobile-first single-column responsive transformation with 0px horizontal overflow, touch targets $\ge 44\text{px}$, and sticky modal actions. |
| **AUD-10** | **Feedback & State Transitions** | Submitting an offer displays an inline green text before closing; no persistent record or clear link to Execution Tracker. | Polished feedback banner with deal reference ID generation, instant state synchronization, and direct "View in Execution Tracker" button. |

---

## 3. Data Structure & API Contract Inspection

### 3.1 Backend Endpoints (`backend/app/execution/router.py`)
- `GET /api/v1/execution/buyers`: Retrieves buyers filtered by `commodity`, `district`, `buyer_type`, `verified_only`.
- `GET /api/v1/execution/buyer-offers`: Retrieves open buyer demands filtered by `commodity`, `district`, `grade`, `status`.
- `POST /api/v1/execution/requests`: Creates an execution order with `crop_lot_id`, `route_type: "DIRECT_BUYER"`, `requested_quantity_kg`, `buyer_id`, `buyer_offer_id`, `notes`.
- `GET /api/v1/execution/requests`: Returns farmer's active orders with lifecycle transitions (`SUBMITTED` $\rightarrow$ `CONFIRMED` $\rightarrow$ `DISPATCHED` $\rightarrow$ `DELIVERED` $\rightarrow$ `COMPLETED`).

### 3.2 Frontend Client API (`frontend/src/api.ts`)
- `api.getBuyers()`: Calls `/api/v1/execution/buyers`, gracefully falls back to `MOCK_BUYERS` in offline/unauthenticated mode.
- `api.getBuyerOffers()`: Calls `/api/v1/execution/buyer-offers`, falls back to `MOCK_BUYER_OFFERS`.
- `api.createExecutionRequest()`: Posts payload to backend, returning `ExecutionRequest` with confirmed order ID.
