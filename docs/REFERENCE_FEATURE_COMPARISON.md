# AGRI2VALUE — REFERENCE FEATURE COMPARISON & ARCHITECTURE MATRIX
**Document Version:** 1.0.0  
**Phase:** 2.5 (Reference Project Audit & Compatibility Analysis)  
**Evaluator:** Principal Software Architect, Full-Stack Engineer, and IoT Integration Specialist  
**Evaluation Date:** November 2026  

---

## 1. Executive Summary

This document presents a structured, technical feature-by-feature comparison and architecture compatibility matrix between **Agri2Value (कृषि-मूल्य)** and the two audited reference repositories:
1. **JSPM NARHE Winners** (`reference-projects/jspmnarhewinners`): A multi-module codebase containing **AgroShare** (React 19 farmer portal + Firebase), **CropShield** (FastAPI satellite disaster assessment & Maharashtra land records), and **Plant-Disease-Detection-Keras** (FastAPI CNN image classifier).
2. **FarmMonitor** (`reference-projects/FarmMonitor`): An ESP32-based agricultural telemetry station measuring soil moisture, microclimate, IR intrusion, and valve actuation communicating via Firebase REST.

### Guiding Principles for Agri2Value
- **Primary Product Architecture:** React 19 + TypeScript frontend, FastAPI async backend, SQLite/PostgreSQL with SQLAlchemy 2.0 relational database, and deterministic **Profit Decision Engine**.
- **Financial Integrity:** Agri2Value's decision science, net payout calculations, feasibility validation, and escrow protection must never be compromised or replaced by probabilistic mocks.
- **Security & Reliability:** No hardcoded credentials, unauthenticated IoT telemetry, or client-side mock delays will be tolerated. All integrations must conform to strict typed schemas and server-side validation.

---

## 2. Feature Comparison Matrix

### Classification Legend
- **`REUSE DIRECTLY`**: Production-ready code, standalone models, or public datasets that can be integrated with minimal translation.
- **`ADAPT`**: High-value algorithms, domain logic, UI patterns, or hardware pinouts that must be refactored to TypeScript / FastAPI / clean architecture.
- **`REBUILD`**: Conceptually necessary features that are implemented as brittle mocks, unauthenticated client-side scripts, or obsolete patterns in the reference projects.
- **`DO NOT USE`**: Features that violate Agri2Value core architecture, leak secrets, provide mock AI delays, or present extreme security vulnerabilities.
- **`NEEDS VERIFICATION`**: External APIs, government endpoints, or hardware integrations whose live availability or licensing requires dynamic validation.

---

| # | Capability / Domain | JSPM Project (`jspmnarhewinners`) | FarmMonitor (`FarmMonitor`) | Agri2Value (`Agri2Value`) | Classification | Technical Rationale & Source References |
|---|---|---|---|---|---|---|
| **1** | **User Authentication & Farmer KYC** | Phone OTP via Firebase Auth (`src/firebase.js`). Hardcoded API keys in client bundle. Role routing in `src/App.jsx`. | None. Public open access to Firebase Realtime Database. | JWT tokens via FastAPI (`/api/v1/auth/demo-login`), bcrypt passwords, role-based isolation (Farmer vs Buyer), SQLite DB. | **DO NOT USE (Ref)** / **PRESERVE (Native)** | Agri2Value's auth is secure, typed, and database-backed. Reference project hardcodes Firebase keys and lacks session revocation. *Ref: `src/firebase.js`, `Agri2Value/backend/app/auth/`*. |
| **2** | **Profit Decision Engine (Selling Options)** | Hardcoded mock advice in `src/services/aiRecommendationService.js` using `setTimeout(1500)`. Static rule table. | None. | Deterministic decision engine (`backend/app/decision_engine/`) evaluating Mandi, Direct Buyer, Cold Storage, and Puree Processing with real logistics costs, spoilage decay, and price-crash thresholds. | **PRESERVE (Native)** / **DO NOT USE (Ref)** | Agri2Value's engine is mathematically verified with 28 automated tests. Reference AI is a fake delay returning canned text. *Ref: `src/services/aiRecommendationService.js:L50-L100`*. |
| **3** | **Weather & Field Work Advisory** | Open-Meteo REST integration in `src/services/weatherService.js`. Free API, no API key required. Maps WMO codes to rain/sun and checks `isGoodForFieldWork()`. | DHT11 ambient temperature & humidity on GPIO 4. No forecast. | Mock weather card on farmer dashboard. | **ADAPT** | Port `weatherService.js` logic to Python FastAPI service (`backend/app/services/weather.py`) and bind to farm GPS coordinates. Free, reliable, and zero API costs. *Ref: `src/services/weatherService.js:L1-L105`*. |
| **4** | **Live APMC Mandi Prices** | Data.gov.in integration in `src/pages/LiveMandiPrices.jsx`. XML/JSON fetch from Indian Government Agmarknet feed. Filters by state & commodity. | None. | Hardcoded mandi price assumptions in `sample_data.py` (e.g. ₹28/kg Nashik APMC). | **ADAPT** | Implement a backend cron task or cached FastAPI service fetching daily mandi prices for Maharashtra APMCs (Nashik, Pimpalgaon, Lasalgaon). Keep fallback benchmarks for resilience. *Ref: `src/pages/LiveMandiPrices.jsx:L15-L85`*. |
| **5** | **Cold Chain & Storage Locator** | Leaflet map in `src/pages/ColdChainLocator.jsx` with coordinates for Maharashtra warehouses, capacity metrics, and call button. | None. | Cold storage evaluated in Decision Engine, but UI lacks visual map locator. | **ADAPT** | Adapt React-Leaflet component into Agri2Value TypeScript frontend (`src/pages/StorageLocatorPage.tsx`). Store facilities in SQLite/PostgreSQL with latitude/longitude. *Ref: `src/pages/ColdChainLocator.jsx:L1-L150`*. |
| **6** | **Equipment Sharing & Resource Hub** | `src/pages/EquipmentRental.jsx`. Tractor, rotavator, harvester listings with daily rates and mock booking modal. | None. | Blueprint Phase 3 specifies shared resource hubs (processing units, reefer trucks). | **ADAPT** | Transform into Agri2Value "Processing & Logistics Booking Hub" with backend transaction models and wallet integration. *Ref: `src/pages/EquipmentRental.jsx:L1-L120`*. |
| **7** | **Crop Disease Diagnosis (Vision AI)** | 1. `Plant-Disease-Detection-Keras`: FastAPI + Keras CNN (`plant_classifier.h5`, 224x224 RGB, Healthy/Powdery/Rust).<br>2. `CropDiseaseScanner.jsx`: Uploads to ImgBB and returns mock text. | None. | Blueprint Phase 3 specifies Crop Rescue triage based on harvest defect rate and disease status. | **REUSE DIRECTLY (Model)** / **ADAPT (Service)** | The Keras `.h5` model is genuine and trained (MIT License). Package into an optional microservice or ONNX runtime inside Agri2Value for tomato early blight/rust grading. Avoid ImgBB upload. *Ref: `Plant-Disease-Detection-Keras-main/main.py:L1-L60`*. |
| **8** | **Cadastral GIS & Land Records (7/12)** | `CropShield/backend/app/services/mahabhunakasha.py`. Automates WMS/WFS land parcel boundary extraction for Maharashtra districts (Nashik, Pune, etc.). | None. | Blueprint specifies farm plot geofencing. Currently stores single point lat/long. | **ADAPT** | Adapt cadastral boundary fetching to enrich Agri2Value `Farm` entity with true polygon boundaries for harvest estimation and risk indexing. *Ref: `mahabhunakasha.py:L1-L130`*. |
| **9** | **Satellite Disaster & Damage Auditing** | `CropShield/backend/app/services/satellite.py` and `indices.py`. Fetches Sentinel-2 L2A STAC imagery, computes pre/post disaster NDVI and NDWI drop. | None. | Crop Rescue module needs damage assessment for hail/pest damage. | **ADAPT** | Incorporate NDVI calculation utility into Agri2Value to provide objective crop health verification before triggering distress liquidation or insurance claims. *Ref: `satellite.py:L1-L180`, `indices.py:L1-L65`*. |
| **10** | **Government Scheme Discovery** | `src/pages/SchemesHub.jsx`. Curated database of 12+ central & state farmer schemes (PM-KISAN, PMFBY, Rythu Bandhu) with eligibility filters. | None. | Blueprint mentions state subsidies for processing hubs and cold storage. | **ADAPT** | Migrate curated JSON scheme catalog into Agri2Value database (`schemes` table) with eligibility matcher based on farm size and crop type. *Ref: `src/pages/SchemesHub.jsx:L1-L210`*. |
| **11** | **Legal Aid & Dispute Resolution** | `src/pages/LegalAid.jsx`. Contract farming agreement generator, dispute filing workflow, and pro-bono advisor listing. | None. | Direct buyer contract enforcement and escrow dispute handling required in Phase 3. | **ADAPT** | Adapt contract agreement template generator for Agri2Value Direct Buyer Commitments. *Ref: `src/pages/LegalAid.jsx:L1-L180`*. |
| **12** | **IoT Sensor Telemetry (Hardware)** | None. | ESP32 DevKit V1 with DHT11, Soil Moisture (ADC GPIO 34), IR Intrusion (GPIO 19), Neo-6M GPS (UART2 GPIO 16/17). | Telemetry schema defined in Phase 0 blueprint, but no physical ingestion route active. | **ADAPT** | Adopt the ESP32 pinout and circuit schematic. Rewrite telemetry ingestion to post directly to Agri2Value FastAPI backend (`POST /api/v1/iot/telemetry`). *Ref: `FarmMonitor/firmware.ino:L1-L180`*. |
| **13** | **IoT Actuation & Irrigation Valve** | None. | SG90 / MG995 servo on GPIO 25. Hysteresis loop (ON when moisture $<22\%$, OFF when $>28\%$). Manual override via Firebase. | Blueprint specifies automated cold storage monitoring and field irrigation alerts. | **REBUILD (Firmware)** | The FarmMonitor hysteresis logic is useful, but the firmware lacks a watchdog timer (risk of continuous flooding if sensor disconnects). Rebuild firmware with safety fail-safe. *Ref: `FarmMonitor/firmware.ino:L140-L175`*. |
| **14** | **IoT Data Visualization** | None. | Chart.js time-series charts in `FarmMonitor/dashboard.js` polling Firebase Realtime Database. | Agri2Value frontend dashboard. | **ADAPT** | Implement interactive Recharts/Chart.js telemetry visualizer in Agri2Value React/TypeScript frontend (`src/pages/IoTMonitorPage.tsx`) consuming FastAPI endpoints. *Ref: `FarmMonitor/dashboard.js:L50-L150`*. |
| **15** | **Device Authentication & Security** | Hardcoded Firebase config (`apiKey`, `authDomain`). | No authentication. Open Firebase test rules allow anyone on the internet to overwrite actuator states. | None yet. Requires secure token/API key header for hardware devices. | **REBUILD** | Create `Device` model in Agri2Value with `device_id` and hashed `api_key`. Microcontroller sends `X-Device-Key` header with payload. *Critical security enhancement*. |

---

## 3. Architecture Compatibility Analysis

```
AGRI2VALUE (Target)                 JSPM / AGROSHARE                   FARMMONITOR
====================                ================                   ===========
Frontend: React 19 + TS             Frontend: React 19 (JS/JSX)         Frontend: Vanilla HTML/JS
Styling: Tailwind v4 Tokens         Styling: Tailwind v3 + DaisyUI     Styling: Plain CSS
Backend: FastAPI (Python 3.11)      Backend: Firebase + FastAPI        Backend: Firebase RTDB (REST)
Database: SQLite / PostgreSQL       Database: Firestore / PostGIS      Database: Firebase JSON Tree
Auth: JWT / SQLite Sessions         Auth: Firebase Client Auth         Auth: None (Open Public)
Hardware: REST/MQTT Gateway         Hardware: None                     Hardware: ESP32 C++ (Arduino)
Decision Engine: Deterministic      Decision: Mock Rules (setTimeout)  Decision: Moisture Threshold
```

### 3.1 Frontend Framework Compatibility
- **Agri2Value:** React 19, TypeScript, Tailwind CSS v4, Lucide React, Vite. Strict type safety and component modularity.
- **JSPM AgroShare:** React 19, JavaScript (JSX), Tailwind CSS v3, Framer Motion, Lucide React, Vite.
- **FarmMonitor:** Vanilla HTML5, Vanilla JavaScript, Chart.js, Firebase Web SDK v8.
- **Compatibility Verdict:** **HIGH COMPATIBILITY WITH AGROSHARE**.
  - Since AgroShare also runs on modern React 19 and Vite, its UI components (cards, badges, modals, tab switchers) can be converted into TypeScript `.tsx` components and styled with Agri2Value's CSS token system within minutes.
  - FarmMonitor's dashboard logic is legacy vanilla JS; its Chart.js configuration will be ported to Recharts (standard for modern React) or integrated via a typed React wrapper.

### 3.2 Backend Framework Compatibility
- **Agri2Value:** FastAPI (Python), Async SQLAlchemy 2.0, Pydantic v2 schemas, Alembic migrations.
- **JSPM CropShield:** FastAPI (Python), SQLAlchemy 2.0, Alembic, PostgreSQL + PostGIS, Redis.
- **FarmMonitor:** Serverless Google Firebase Realtime Database (no backend server).
- **Compatibility Verdict:** **EXCELLENT COMPATIBILITY WITH CROPSHIELD**.
  - CropShield's backend is architecturally identical to Agri2Value (both use modern async FastAPI and SQLAlchemy 2.0).
  - Its services (`satellite.py`, `indices.py`, `mahabhunakasha.py`) can be imported into Agri2Value's backend directory structure (`backend/app/services/`) with minimal import path refactoring.

### 3.3 Database and Data Models
- **Agri2Value:** Relational schema (`users`, `farms`, `crops`, `harvest_lots`, `decision_runs`, `decision_options`).
- **JSPM AgroShare:** NoSQL document structure in Cloud Firestore (`users/{uid}`, `crops/{id}`, `rentals/{id}`).
- **JSPM CropShield:** Relational models (`claim.py`, `disaster.py`, `field.py`, `satellite.py`) in SQLAlchemy.
- **FarmMonitor:** Flat JSON key-value tree in Firebase Realtime Database (`/sensorData`, `/irrigationControl`).
- **Compatibility Verdict:** **CLEAN RELATIONAL INTEGRATION**.
  - Agri2Value will **NOT** adopt NoSQL or Firebase.
  - The telemetry payload from FarmMonitor (`moisture`, `temperature`, `humidity`, `latitude`, `longitude`, `timestamp`) maps cleanly to a new relational table: `iot_telemetry_readings` and `iot_devices`.
  - CropShield's cadastral field models map cleanly to extend Agri2Value's existing `farms` and `harvest_lots` tables.

### 3.4 Hardware and Communication Protocol
- **FarmMonitor Protocol:** HTTP client making REST `PUT` and `GET` requests to Firebase.
- **Agri2Value Proposed Protocol:** REST `POST /api/v1/iot/telemetry` over HTTPS/HTTP with API Key authentication.
- **Evaluation:**
  - The HTTP REST approach used in `FarmMonitor/firmware.ino` is immediately compatible with our existing FastAPI backend without requiring an external MQTT broker daemon (Mosquitto) for local pilot demonstrations.
  - However, for real-world deployments with intermittent rural GSM/GPRS connectivity, MQTT with QoS 1 is superior. For Phase 2.5 / Phase 3 pilot demonstration, the REST endpoint is recommended for rapid stabilization, with MQTT support added as a lightweight background listener.

---

## 4. Integration Conflicts and Security Risks

### Critical Security Vulnerabilities Identified in Reference Projects

> [!CAUTION]
> **Vulnerability 1: Hardcoded Firebase API Keys and Credentials**
> - *Location:* `reference-projects/jspmnarhewinners/src/firebase.js:L5-L13`
> - *Risk:* Publicly exposed project API keys, messaging sender IDs, and app IDs committed to version control.
> - *Agri2Value Rule:* Never commit secrets. All API keys (Open-Meteo, Copernicus STAC, Data.gov.in) must reside in `.env` and be managed through `backend/app/core/config.py`.

> [!CAUTION]
> **Vulnerability 2: Completely Unauthenticated IoT Actuator Control**
> - *Location:* `reference-projects/FarmMonitor/firmware.ino:L160-L175`
> - *Risk:* The ESP32 reads `/irrigationControl.json` from public Firebase RTDB without any authorization. Any third party knowing the Firebase project name can trigger continuous irrigation, causing pump burnout or field flooding.
> - *Agri2Value Rule:* All IoT read/write endpoints require a pre-shared cryptographic device token (`X-Device-Token`) validated by FastAPI middleware.

> [!WARNING]
> **Vulnerability 3: Blocking Loops in Firmware Without Watchdog Timer**
> - *Location:* `reference-projects/FarmMonitor/firmware.ino:L178`
> - *Risk:* Firmware uses `delay(1000)` blocking execution. If WiFi drops during an HTTP transaction, the microcontroller hangs with the valve servo potentially left in the open position (flood disaster).
> - *Agri2Value Rule:* Firmware must use non-blocking `millis()` timers, hardware watchdog timer (ESP-IDF `esp_task_wdt`), and fail-safe valve shutdown on connection loss.

> [!WARNING]
> **Vulnerability 4: Unauthenticated Third-Party Image Uploads**
> - *Location:* `reference-projects/jspmnarhewinners/src/pages/CropDiseaseScanner.jsx:L45`
> - *Risk:* Uploads farmer crop photos directly to free image host ImgBB using a hardcoded client key. Exposes farmer privacy and creates external downtime dependencies.
> - *Agri2Value Rule:* Process all images on the local backend or dedicated inference microservice without third-party storage exposure.

---

## 5. Reuse Opportunities Summary

### 5.1 Best UI Components to Adapt
1. **Weather Widget & Spray Advisory:** Adapted from `weatherService.js` and AgroShare dashboard. Shows temperature, humidity, rain probability, and a green/red badge for field work suitability.
2. **Cold Chain & Storage Facilities Map:** Adapted from `ColdChainLocator.jsx`. Leaflet-based map with markers for cold storages around Nashik/Niphad, showing capacity, rate/month, and direct contact numbers.
3. **Mandi Price Ticker & Comparison Table:** Adapted from `LiveMandiPrices.jsx`. Interactive tabular view showing modal prices across Maharashtra APMC mandis.
4. **Government Schemes Catalog:** Adapted from `SchemesHub.jsx`. Tabbed filter (Central vs State, Smallholder vs Commercial) with benefit summaries and application links.

### 5.2 Best Backend Capabilities to Adapt
1. **Open-Meteo Weather Service (`weather.py`):** Clean Python async service consuming `https://api.open-meteo.com/v1/forecast`. Zero cost, high reliability.
2. **Maharashtra Cadastral GIS Service (`mahabhunakasha.py`):** Automated extraction of survey number boundary coordinates from government WFS servers for Maharashtra districts.
3. **Sentinel-2 NDVI Disaster Drop Computation (`satellite.py` + `indices.py`):** Quantitative spectral index difference before and after hail or pest events for objective damage validation.
4. **Agmarknet Live Mandi Parser:** Backend service fetching daily commodity prices from Data.gov.in API to keep mandi benchmarks fresh.

### 5.3 Reusable AI / ML Logic
1. **Keras CNN Plant Classifier (`plant_classifier.h5`):** Genuine Keras model classifying plant leaf diseases (Healthy, Powdery Mildew, Rust). Can be loaded into Agri2Value backend to support harvest defect classification.

### 5.4 Hardware & IoT Modules
1. **ESP32 Sensor Pinout & Calibration:**
   - Soil moisture ADC mapping on GPIO 34.
   - DHT11 microclimate sensing on GPIO 4.
   - Servo valve actuation on GPIO 25.
   - Neo-6M GPS NMEA stream parsing on HardwareSerial 2 (GPIO 16/17).

### 5.5 Features That Must Remain Native to Agri2Value
- **The Profit Decision Engine (`backend/app/decision_engine/`):** Pure deterministic optimization of Net Payout, Spoilage Decay, Logistics Feasibility, and Risk Scoring.
- **Relational Domain Models:** Strict ownership hierarchy (`Farmer` $\rightarrow$ `Farm` $\rightarrow$ `Crop` $\rightarrow$ `HarvestLot` $\rightarrow$ `DecisionRun` $\rightarrow$ `DecisionOption`).
- **Escrow & Financial Ledger:** Phase 3 commitment booking, advance deposit locking, and payout calculation.

---

## 6. Recommendations Table

| Component | Recommendation | Target Agri2Value Path | Priority |
|---|---|---|---|
| **Weather Service** | **ADAPT** to Python FastAPI service | `backend/app/services/weather_service.py` | High |
| **Mandi Price Fetcher** | **ADAPT** to FastAPI cached client | `backend/app/services/mandi_service.py` | High |
| **Cold Storage Map UI** | **ADAPT** to React 19 + TypeScript | `frontend/src/pages/StorageLocatorPage.tsx` | High |
| **IoT Telemetry Endpoint** | **REBUILD** as authenticated REST route | `backend/app/api/v1/endpoints/iot.py` | High |
| **IoT Data Model** | **REBUILD** as SQLAlchemy relational model | `backend/app/db/models/iot.py` | High |
| **ESP32 Firmware** | **ADAPT** with non-blocking loops & auth | `firmware/esp32_farm_monitor/esp32_farm_monitor.ino` | High |
| **Disease Detection AI** | **REUSE DIRECTLY** model, **ADAPT** service | `backend/app/services/disease_classifier.py` | Medium |
| **Cadastral GIS (7/12)** | **ADAPT** into Farm plot boundary tool | `backend/app/services/cadastral_service.py` | Medium |
| **Sentinel NDVI Analytics** | **ADAPT** into Crop Rescue risk assessor | `backend/app/services/satellite_service.py` | Medium |
| **Schemes Catalog** | **ADAPT** into static JSON / SQLite model | `backend/app/services/schemes_catalog.py` | Low |
| **Firebase Services** | **DO NOT USE** | N/A | Defect |
| **Mock AI Rules** | **DO NOT USE** | N/A | Defect |

---
*End of Reference Feature Comparison Report.*
