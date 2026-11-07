# AGRI2VALUE — MARKET & WEATHER INTELLIGENCE UI/UX AUDIT

**Target Route:** `/app/market`  
**Components Evaluated:**  
- `frontend/src/components/MarketWeatherView.tsx`  
- `frontend/src/mockData.ts` (`MOCK_WEATHER`, `MOCK_MANDI_PRICES`, `MOCK_MANDI_QUOTE`)  
- `backend/app/weather/router.py` & `backend/app/services/weather_service.py`  
- `backend/app/mandi/router.py` & `backend/app/services/mandi_service.py`  
**Date:** November 7, 2026  
**Status:** Audit Completed • Release-Blocking Defects Identified  

---

## 1. Executive Summary

A comprehensive pre-implementation audit of the **Market & Weather Intelligence** module (`/app/market`) was conducted across desktop, tablet, and mobile breakpoints. While the underlying backend services successfully integrate with **Open-Meteo REST API** and **Maharashtra APMC Mandi Bulletins (Agmarknet)** with caching and fallback safeguards, the frontend user interface presents significant visual defects, a critical date rendering bug, limited operational guidance, and poor responsiveness on mobile devices.

---

## 2. Release-Blocking Date Bug: Root Cause & Architectural Trace

### 2.1 The Symptom
In the baseline application and reference screenshots, the 7-Day Horticultural Forecast renders invalid calendar dates:
```
Card 1: "Invalid Date"
Card 2: "Thu, Mar 1"
Card 3: "Sun, Apr 1"
Card 4: "Tue, May 1"
Card 5: "Fri, Jun 1"
Card 6: "Sun, Jul 1"
Card 7: "Sun, Jul 1"
```

### 2.2 Root Cause Analysis
A full end-to-end trace from backend ingestion to frontend rendering revealed the exact defect chain:

1. **Mock Data Contamination in Fallback Mode (`frontend/src/mockData.ts` lines 394–402):**
   When `api.getWeather()` encounters a transient network delay, offline simulation, or unauthenticated fetch, it falls back to `MOCK_WEATHER`.
   In `frontend/src/mockData.ts`, `daily_forecast` was populated with non-ISO human strings:
   ```typescript
   daily_forecast: [
     { date: 'Today', ... },
     { date: 'Tomorrow', ... },
     { date: 'Day 3', ... },
     { date: 'Day 4', ... },
     { date: 'Day 5', ... },
     { date: 'Day 6', ... },
     { date: 'Day 7', ... },
   ]
   ```
2. **V8 Engine Date Parsing Glitch:**
   The frontend component attempted to parse each item via standard JavaScript:
   ```typescript
   new Date(day.date).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })
   ```
   In the Chromium / V8 JavaScript engine:
   - `new Date('Today')` parses as `NaN` $\rightarrow$ outputs **`"Invalid Date"`**.
   - `new Date('Day 3')` is parsed by V8's legacy parser as month 3 (March), day 1 $\rightarrow$ outputs **`"Thu, Mar 1"`**!
   - `new Date('Day 4')` is parsed as month 4 (April), day 1 $\rightarrow$ outputs **`"Sun, Apr 1"`**!
   - `new Date('Day 5')` is parsed as month 5 (May), day 1 $\rightarrow$ outputs **`"Tue, May 1"`**!
   - `new Date('Day 6')` is parsed as month 6 (June), day 1 $\rightarrow$ outputs **`"Fri, Jun 1"`**!
   - `new Date('Day 7')` is parsed as month 7 (July), day 1 $\rightarrow$ outputs **`"Sun, Jul 1"`**!

3. **Backend Static Reference Date Staleness (`backend/app/services/weather_service.py`):**
   In `_get_offline_reference_weather()`, the backend returned static hardcoded date strings (`"2026-11-01"` through `"2026-11-07"`). When live upstream Open-Meteo is temporarily unreachable, stale dates in the past were returned rather than dynamic relative forecast days.

4. **Timezone Boundary Shift with `YYYY-MM-DD`:**
   JavaScript `new Date("YYYY-MM-DD")` parses ISO date-only strings as UTC midnight (`00:00:00.000Z`). In timezones behind UTC (such as US Pacific UTC-8 or Western Europe during parts of the year), formatting with `.toLocaleDateString()` shifts the calendar date backward by 1 full day!

### 2.3 Permanent Resolution Architecture
- **Step 1:** Correct `frontend/src/mockData.ts` to compute dynamic, valid ISO dates (`YYYY-MM-DD`).
- **Step 2:** Refactor `backend/app/services/weather_service.py` `_get_offline_reference_weather()` to dynamically generate `(today + timedelta(days=i)).isoformat()`.
- **Step 3:** Implement a bulletproof date formatter in the frontend:
  - If date matches `^\d{4}-\d{2}-\d{2}$`, extract `[year, month, day]` and instantiate local noon `new Date(year, month - 1, day, 12, 0, 0)` to guarantee zero UTC drift.
  - Handle `'Today'` and `'Tomorrow'` explicitly.
  - Detect invalid strings and gracefully fallback to `currentDate + offset`.
  - Never allow `"Invalid Date"` to reach the DOM.

---

## 3. Comprehensive Baseline UI/UX Defect Catalog

| ID | Category | Baseline Observation | Proposed Redesign Solution |
|---|---|---|---|
| **DEF-01** | **Data Integrity** | Forecast labels display `"Invalid Date"`, `"Thu, Mar 1"`, `"Sun, Apr 1"`. | Robust timezone-safe parser with zero UTC drift; proper weekday and calendar formatting; dynamic backend dates. |
| **DEF-02** | **Visual Hierarchy** | Weather cards are flat and lack semantic contrast; 28°C is bare without visual microclimate indicators. | Premium weather cockpit featuring dynamic atmospheric badges, feels-like indicator, high/low range, and animated condition hero. |
| **DEF-03** | **Field Advisory** | Guidance headline is static ("Optimal Harvesting Conditions...") with limited actionability and buried disclaimer. | Interactive Field Operations Centre featuring 4 practical operational modules: (1) Harvesting Window, (2) Spray & Chemical Drift Risk, (3) Post-Harvest Curing & Drying, and (4) Perishable Transit Safety, each with explicit weather triggers and statutory disclaimers. |
| **DEF-04** | **Forecast Layout** | Horizontal forecast strip is cramped and overflows awkwardly on mobile without scroll cues. | Responsive card stack / horizontal carousel with clear active "Today" focal card, high/low visual temp bar, precipitation probability, and wind metrics. |
| **DEF-05** | **Market Intelligence** | APMC table has a single commodity dropdown and basic search; no district filter, sorting, or price spread indicators. | High-performance APMC terminal with multi-filter toolbar (Commodity, District, Variety), sortable columns (Modal Rate, Arrival Volume, Distance), and visual min-max price spread bar. |
| **DEF-06** | **Decision Engine Link** | Mandi table has no direct pathway to evaluate prices against farm holdings. | Context-aware "Evaluate in Profit Engine" action button on relevant commodity rows that passes the lot and mandi context to `/app/decision`. |
| **DEF-07** | **Provenance & Trust** | Provenance tags are generic green pills ("LIVE OPEN-METEO", "LIVE AGMARKNET") even when serving cached or fallback data. | Transparent Provenance Badges: `LIVE AGMARKNET`, `CACHED BENCHMARK`, `OFFLINE REFERENCE`, with explicit observation date vs retrieval date callout and staleness alerts (>7 days). |
| **DEF-08** | **Location & Coordinates** | Station coordinates are hardcoded text (`20.08°N, 74.04°E`) without context of user's registered farm. | Farm-aware location header displaying active holding (Patil Krishi Farm, Niphad), GPS coordinates, and data retrieval health. |
| **DEF-09** | **Refresh Experience** | Refresh button spins globally without communicating whether weather or mandi failed if one is offline. | Independent status feedback with micro-spinner, last synced timestamp, and resilient error handling for partial service availability. |
| **DEF-10** | **Mobile Responsiveness** | On mobile (375px/320px), table columns squish, text truncates, and forecast strip causes awkward horizontal page overflow. | Fluid mobile-first card transformation: converts desktop table into readable produce market cards on small viewports with 0px horizontal overflow. |
| **DEF-11** | **Accessibility** | Low contrast text on light gray badges, missing ARIA live regions, and unstyled focus rings. | WCAG 2.1 AA compliant color tokens, semantic buttons, keyboard-navigable filter chips, and `prefers-reduced-motion` CSS transitions. |

---

## 4. API Contracts & Data Flow Verification

### 4.1 Weather API (`/api/v1/weather`)
- **Upstream:** Open-Meteo REST API (`https://api.open-meteo.com/v1/forecast`)
- **Backend Cache:** 15-minute in-memory TTL (`CACHE_TTL_SECONDS = 900`)
- **Key Fields Consumed:**
  - `current.temperature_c`, `apparent_temperature_c`, `relative_humidity_pct`, `precipitation_mm`, `rain_mm`, `wind_speed_kmh`, `weather_code`, `weather_description`, `weather_icon`, `observed_at`
  - `daily_forecast[].date`, `weather_code`, `weather_description`, `weather_icon`, `temp_max_c`, `temp_min_c`, `precipitation_sum_mm`, `max_wind_speed_kmh`, `sunrise`, `sunset`
  - `advisory.status` (`FAVORABLE` | `CAUTION` | `UNFAVORABLE`), `headline`, `reasons`, `disclaimer`
  - `attribution`: `"Weather data by Open-Meteo.com under CC BY 4.0"`

### 4.2 Mandi API (`/api/v1/mandi/prices` & `/api/v1/market-prices`)
- **Upstream:** Data.gov.in (Agmarknet Daily APMC Bulletin) + Curated Maharashtra APMC Benchmark Archive
- **Backend Cache:** 30-minute in-memory TTL (`CACHE_TTL_SECONDS = 1800`)
- **Key Fields Consumed:**
  - `market_name`, `district`, `state`, `commodity`, `variety`, `min_price`, `max_price`, `modal_price`, `price_unit` (`Rs/Quintal`), `normalized_price_per_kg`, `arrival_quantity`, `arrival_unit`, `observation_date`, `retrieved_timestamp`, `freshness_status` (`LIVE` | `CACHED` | `DEMO`), `is_stale`, `staleness_warning`

### 4.3 Mandi Quote API (`/api/v1/mandi/quote`)
- **Endpoint:** `GET /api/v1/mandi/quote?crop_name=Tomato&district=Nashik`
- Returns verified decision-grade quote used by the Profit Decision Engine with strict anti-substitution safeguards.
