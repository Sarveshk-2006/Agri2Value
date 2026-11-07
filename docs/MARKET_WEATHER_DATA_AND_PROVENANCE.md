# AGRI2VALUE — MARKET & WEATHER DATA PROVENANCE & FRESHNESS SPECIFICATION

**Module:** `/app/market` (`frontend/src/components/MarketWeatherView.tsx`)  
**Backend Services:**  
- `backend/app/services/weather_service.py`  
- `backend/app/services/mandi_service.py`  
**Date:** November 7, 2026  
**Status:** Approved & Production Verified  

---

## 1. Upstream Data Sources & Attributions

Agri2Value integrates multiple authoritative external data feeds, enforcing strict attribution, server-side caching, and data hygiene:

| Domain | Source Provider | Legal Attribution Requirement | Agri2Value Implementation |
|---|---|---|---|
| **Microclimate Weather** | Open-Meteo REST API (`https://api.open-meteo.com`) | CC BY 4.0 Attribution mandatory | Rendered on all weather cards: *"Weather data by Open-Meteo.com under CC BY 4.0"* |
| **APMC Mandi Rates** | Data.gov.in (Agmarknet Daily APMC Yard Bulletin) | Open Government Data License (OGDL India) | Stamped with observation date, raw arrival volume, and APMC yard identity |
| **Benchmark Archive** | Curated Maharashtra APMC Bulletins | Maharashtra State Agricultural Marketing Board (MSAMB) | Verified benchmark records for Pimpalgaon, Nashik, Lasalgaon, Pune, and Jalgaon |

---

## 2. Server-Side Caching & Rate Limiting

To avoid redundant upstream API requests, minimize network latency, and prevent client IP exposure, all third-party calls are routed through the FastAPI backend proxy with in-memory caching:

```
[Browser Client] 
       │ 
       ▼ (Internal JWT API)
[FastAPI Backend: /api/v1/weather & /api/v1/mandi/prices]
       │
   ┌───┴────────────────────────┐
   │ Check In-Memory Cache      │
   │ (Weather: 15 min TTL)      │
   │ (Mandi: 30 min TTL)        │
   └───┬────────────────────────┘
       │ Cache Miss
       ▼
[External API: Open-Meteo / Data.gov.in]
```

- **Weather Cache TTL:** 900 seconds (15 minutes).
- **Mandi Cache TTL:** 1,800 seconds (30 minutes).
- **Force Refresh:** When the farmer clicks **"Refresh Feeds"**, `force_refresh=true` bypasses the in-memory cache and triggers an upstream fetch.

---

## 3. Freshness Status & Provenance Badges

Agri2Value enforces total transparency regarding data origin. Fallback or simulated data is **never** disguised as live data:

| Status Badge | Semantic Style | Data Provenance Meaning |
|---|---|---|
| **`LIVE OPEN-METEO`** | Emerald Badge (`bg-emerald-50 text-emerald-700`) | Fresh meteorological readings retrieved directly from Open-Meteo within the last 15 minutes. |
| **`LIVE AGMARKNET`** | Emerald Badge (`bg-emerald-50 text-emerald-700`) | Fresh mandi price records fetched from Data.gov.in APMC arrivals within the last 30 minutes. |
| **`CACHED BENCHMARK`** | Slate Badge (`bg-slate-100 text-slate-700`) | Verified APMC yard archive records served during off-peak auction hours or when upstream feeds are paused. |
| **`OFFLINE REFERENCE`** | Amber Badge (`bg-amber-50 text-amber-800`) | Deterministic reference snapshot served when live network connection is severed. |
| **`STALE (>7D)`** | Amber Warning (`bg-amber-100 text-amber-900`) | Stamped on records where observation date is older than 7 calendar days. |

---

## 4. Date & Timezone Standards

1. **Separation of Observation Date vs Ingestion Timestamp:**
   - `observation_date`: The physical date when produce was auctioned at the APMC yard (e.g. `2026-11-01`).
   - `retrieved_timestamp`: The exact UTC ISO-8601 timestamp when Agri2Value ingested the record (e.g. `2026-11-07T17:12:57Z`).
2. **Zero UTC Drift in Forecast Dates:**
   - Date-only ISO strings (`YYYY-MM-DD`) are instantiated at local noon (`12:00:00`) before calling locale formatters, preventing timezone shifts from moving dates backward.

---

## 5. Unit Normalization Standard

- Raw APMC mandi prices are reported in **Rs per Quintal** (100 kilograms).
- The Agri2Value backend computes normalized rates with Python `Decimal`:
  $$\text{Normalized Rate (INR/kg)} = \frac{\text{Modal Price (Rs/Quintal)}}{100}$$
- The frontend renders both figures:
  - Prominent normalized rate: **₹14.50 / kg**
  - Raw auction rate: **₹1,450 / Qtl modal (Range: ₹1,100 – ₹1,850)**
