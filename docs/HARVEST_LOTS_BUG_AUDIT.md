# AGRI2VALUE — HARVEST & CROP LOTS BUG AUDIT
**Date:** November 7, 2026  
**Module:** Harvest & Crop Lots (`/app/lots`)  
**Affected Component:** `frontend/src/components/HarvestLotsView.tsx`  
**Reference Screenshot:** `media_1793993129523_684c76ff.jpg`  

---

## Executive Summary

An audit of the Harvest & Crop Lots module (`/app/lots`) was conducted across the frontend UI, client state, backend endpoints (`backend/app/crop_lots/router.py`), services (`backend/app/crop_lots/service.py`), and schemas (`backend/app/crop_lots/schemas.py`).

While the backend correctly normalizes quantities to kilograms and enforces strict farm ownership, the existing user interface presented several database-like representations, redundant conversions, raw internal strings, ambiguous date formats, and an unbalanced layout with massive blank space on desktop.

---

## Detailed Bug Matrix & Proposed Corrections

| # | Identified Issue | Severity | Root Cause | Proposed Correction |
|---|---|---|---|---|
| **1** | **Redundant Quantity Conversion Bug** (`Entered: 4,000 kg = Normalized: 4,000 kg`) | High | The UI unconditionally displayed both `ENTERED QUANTITY` and `NORMALIZED BASE = 4,000 kg` even when the entered unit was already kilograms. | Intelligently display entered quantity prominently when in `kg` with a subtle standard unit note; only show the explicit conversion breakdown when an actual unit conversion occurred (e.g., 40 quintals → 4,000 kg). |
| **2** | **Technical Database Enum Status Display** (`READY_FOR_ANALYSIS`) | High | Raw backend database enum was rendered directly without friendly presentation mapping. | Map to human-friendly labels: `READY_FOR_ANALYSIS` → "Ready for Analysis", `DRAFT` → "Draft Lot", `ANALYZED` → "Analysis Complete", `RESCUE_REQUIRED` → "Rescue Required", etc., paired with semantic colors. |
| **3** | **Ambiguous Date Format** (`11/7/2026`) | Medium | Used standard `toLocaleDateString()`, causing confusion between November 7 and July 11 depending on locale. | Implement unambiguous, internationalized date formatting: `7 November 2026` (`DD MMMM YYYY`). |
| **4** | **Desktop Layout Void (~55% blank canvas)** | High | Grid restricted cards to `grid-cols-1 md:grid-cols-2`. With 1 registered lot (the canonical Ramesh Patil scenario), 55% of the screen was an empty white void. | Add a high-level **Harvest Overview Metrics Bar** (Total Lots, Total Quantity, Ready for Analysis, Under Care), intuitive search & filters, and a balanced card layout. |
| **5** | **Raw Internal Demo Strings Leakage** (`[DEMO_SEED]`) | Medium | Raw database seed notes and badges (`DEMO SEED`, `[DEMO_SEED] ...`) leaked internal technical markers into farmer-facing text. | Clean provenance badge: `"Competition Demo Scenario"` or `"Live Farm Record"` with an informational popover/tooltip; strip internal prefix tags like `[DEMO_SEED]` from farmer-facing descriptions. |
| **6** | **Flat Audit Event Presentation** | Medium | Single raw text row `[CREATED] [DEMO_SEED] Initial demo crop lot seeded... (12:53:49 AM)` lacked timeline styling and visual hierarchy. | Transform into an activity timeline with status icons, humanized event titles ("Harvest Lot Registered"), and relative/local timestamps. |
| **7** | **Missing Summary Intelligence** | Medium | No consolidated metrics for total produce volume (kg/MT), active lots, or decision readiness. | Introduce a 4-metric summary bar calculated directly from the authenticated user's records. |
| **8** | **No Search, Filter, or Sorting Capabilities** | Medium | No way to search by crop name, filter by farm, filter by status, or sort by quantity/date. | Implement responsive search, farm filter, status filter, and sort controls with instant reset. |
| **9** | **Mobile Touch Target & Form Sizing** | Medium | Action buttons and modal inputs were cramped on small screens (320px–375px). | Ensure touch targets ≥44px, full-width actions on mobile, and scrollable modal dialogue within 90vh. |
| **10** | **Crop Variety & Quality Grade Presentation** | Low | Grade and variety were rendered in plain text without visual produce identity. | Add vibrant crop thumbnail badges, distinct Grade tags (Grade A / B / C), and structured agronomic attributes. |

---

## Architectural & Security Invariants

1. **Ownership Enforcement:**
   - Crop lots are strictly scoped to farms owned by `current_user.id`. Requests for non-owned lots return HTTP 404 (`backend/app/crop_lots/service.py:96`).
2. **Deterministic Quantity Normalization:**
   - Units (`kg`, `quintal`, `tonne`, `bag`, `maund`) are deterministically normalized using exact Decimal factors.
3. **Integration Safety:**
   - "Analyze Profit Options" routes to `/app/decision` with the specific `crop_lot_id`.
   - "Crop Rescue" routes to `/app/rescue` with the specific `crop_lot_id`.

