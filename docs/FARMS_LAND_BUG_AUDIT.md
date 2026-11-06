# AGRI2VALUE — FARMS & LAND BUG AUDIT
**Date:** November 7, 2026  
**Module:** Farms & Land (`/app/farms`)  
**Affected Component:** `frontend/src/components/FarmsView.tsx`  
**Reference Screenshot:** `media_1793991089393_b5894bff.jpg`  

---

## Executive Summary

An in-depth audit of the existing Farms & Land module (`/app/farms`) was conducted across the frontend UI, state orchestration, API interfaces (`frontend/src/api.ts`), backend FastAPI routers (`backend/app/farms/router.py`), and SQLAlchemy/Pydantic schemas (`backend/app/farms/schemas.py`).

While the underlying data models and CRUD endpoints are sound, the user interface suffered from several visual defects, layout imbalances, typography issues, and lacked the interactive spatial visualization necessary for a high-tier agri-tech platform.

---

## Detailed Bug Matrix & Proposed Corrections

| # | Identified Issue | Severity | Root Cause | Proposed Correction |
|---|---|---|---|---|
| **1** | **Resource heading and count running together (`ASSOCIATED FARM RESOURCES3 REGISTERED`)** | High | In `FarmsView.tsx`, the flex container label lacked whitespace and explicit pill/badge isolation between the title text and the dynamic count. | Separate the heading into a prominent section title `"Associated Farm Resources"` accompanied by a distinct, styled status badge `[N registered]`. |
| **2** | **Massive empty white canvas void on desktop** | High | The card grid (`grid-cols-1 md:grid-cols-2`) left ~60% of the screen completely empty when viewing a single farm (canonical Ramesh Patil pilot), wasting desktop space. | Introduce the **Interactive 3D Digital Farm View** as the visual anchor alongside a structured farm information and metric sidebar. |
| **3** | **Unfinished & raw status badge (`ACTIVE HOLDING`)** | Medium | A simple green text border with uppercase text looked placeholder-like and lacked an active status pulse indicator. | Replace with an agricultural status badge: emerald pulse dot, dignified typography, and truthful holding status. |
| **4** | **Inconsistent resource hierarchy & raw rows** | Medium | All resources (storage, equipment, labour) were displayed in generic gray rows with minimal metadata and inconsistent badge styling. | Implement typed resource cards with categorized icons (storage, equipment, labour, irrigation), formatted quantities (`2,000 kg`, `80 crates`), and availability badges. |
| **5** | **Brittle GPS formatting & missing utilities** | Medium | Template string `${farm.latitude.toFixed(4)}, ${farm.longitude?.toFixed(4)}` risks throwing `TypeError` if latitude is set but longitude is null, and lacked copy/map actions. | Safe coordinate parsing with fallback, one-click coordinate copy with feedback, and valid coordinates verification. |
| **6** | **Lack of interactive spatial farm visualization** | High | Farmers had no spatial comprehension of their cultivated land area (e.g., 3.5 acres), plot layouts, crop parcels, or physical on-farm resources. | Implement an interactive 3D Digital Farm Twin with Three.js, featuring terrain plots, crop rows, storage sheds, crate pallets, interactive orbit/pan/zoom, top-down vs. isometric camera toggle, and resource selection inspection. |
| **7** | **Add Farm modal validation gaps** | Medium | Land area accepted negative numbers; latitude/longitude accepted out-of-range degrees; no duplicate submission guard. | Add explicit client validation: `land_area > 0`, `latitude` [-90, 90], `longitude` [-180, 180], and disable submission button while `loading`. |
| **8** | **Multi-farm switching & selection missing** | Medium | Multiple farms rendered as repeating cards with no dedicated active selection to drive visualization or harvest-lot correlation. | Add a farm selector bar/tab list when multiple farms exist, allowing seamless switching and updating the 3D twin dynamically. |
| **9** | **Illustrative vs. surveyed boundary disclosure missing** | High | Conceptual visualizations risked misleading users as legal survey maps without proper legal and technical disclaimers. | Prominently display the label: *"Illustrative Digital Farm Model — not a surveyed land boundary"* and explain conceptual parcel generation. |
| **10** | **Mobile responsiveness & touch target sizing** | Medium | Modal forms and canvas controls cramped on 320px–375px viewports. | Ensure minimum touch targets (≥44px), responsive canvas height (h-64 sm:h-80 lg:h-96), and scrollable modal containers. |

---

## Data Model & Authorization Invariants

1. **FastAPI Schema Compatibility:**
   - `FarmCreate`: `farm_name`, `state`, `district`, `village`, `latitude`, `longitude`, `land_area`, `land_area_unit`, `resources: List[FarmResourceCreate]`.
   - `FarmUpdate`: Optional subset of above fields.
2. **Server-Side Ownership Verification:**
   - All farm endpoints strictly query by `owner_user_id == current_user.id` (`backend/app/farms/service.py:89`). Non-owned farm requests return HTTP 404 to avoid leaking tenant existence.
3. **Read-Only / Illustrative Boundary Notice:**
   - Because farm polygon boundaries (GeoJSON) are not yet stored in the SQLModel schema, 3D land surfaces are procedurally calculated from registered `land_area` and disclosed as conceptual models.

