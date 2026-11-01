# Reference Project Technical Audit Report
**Agri2Value (कृषि-मूल्य) — Phase 2.5 Architecture & Source Code Audit**
**Date:** 2026-11-01  
**Auditor:** Senior Software Architect, Full-Stack Engineer, and IoT Integration Specialist  
**Main Project:** `d:\Agri2Value`  
**Reference Repositories:**
1. `d:\Agri2Value\reference-projects\jspmnarhewinners` (AgroShare / CropShield / Plant-Disease)
2. `d:\Agri2Value\reference-projects\FarmMonitor` (AgriSense Farm ESP32 IoT System)

---

## Executive Summary

Both reference repositories were cloned and audited under strict **read-only** conditions. No code in `Agri2Value` was modified during the audit. The purpose of this audit is to identify high-value engineering patterns, hardware interfaces, algorithms, and UI components that can accelerate Agri2Value's execution (Phase 3+), while rigorously filtering out mockups, security vulnerabilities, and brittle dependencies.

### Primary Audit Findings:
1. **`jspmnarhewinners` (AgroShare)** is a broad multi-functional agricultural platform originally built for hackathon competition. It contains four distinct sub-projects embedded within it:
   - **AgroShare Core (React 19 + Tailwind + Firebase):** Equipment sharing, labour discovery, mandi price tracking, and pesticide exchange.
   - **`CropShield/` (FastAPI + SQLAlchemy + Alembic):** An enterprise-grade crop insurance auditing and damage analysis engine featuring Google Earth Engine satellite analysis, NDVI/NDWI indexing, and Mahabhunakasha parcel boundary automation.
   - **`Plant-Disease-Detection-Keras-main/` (FastAPI + TensorFlow/Keras):** A standalone deep learning service for leaf disease classification (`plant_classifier.h5`).
   - **`FarmMonitor-main/`:** Identical copy of the standalone `FarmMonitor` repository.
2. **`FarmMonitor` (AgriSense Farm)** is an end-to-end IoT soil monitoring and automated valve actuation system based on the **ESP32 DevKit V1**, DHT11, analog soil moisture probe, IR sensor, and servo motor. It demonstrates direct microcontroller-to-cloud telemetry, but contains severe security and reliability gaps (hardcoded credentials, unauthenticated Firestore calls, blocking 1-second HTTP polling) that must be refactored before adoption into Agri2Value.

---

# SECTION A: JSPM NARHE WINNERS (AGROSHARE) DETAILED AUDIT

### 1. Frontend Framework and Design System
- **Framework:** React `19.2.4`, Vite `8.0.1`, React Router DOM `7.13.2`.
- **Language:** JavaScript (JSX). No TypeScript typing or interfaces are used in the client code.
- **Styling & Design System:** TailwindCSS `3.4.19` with PostCSS. Uses custom fonts (`font-display`, `font-poppins`), green/emerald agricultural themes (`from-green-900 to-emerald-800`), glassmorphic panels, and Lucide React `1.8.0` / React Icons (`react-icons/md`, `react-icons/fa`).
- **Animation:** Extensive use of `framer-motion` (`12.38.0`) and GSAP (`3.14.2`) for card hover transitions, micro-interactions, and step wizards.
- **Source Files:**
  - Configuration: [`package.json`](file:///d:/Agri2Value/reference-projects/jspmnarhewinners/package.json), [`tailwind.config.js`](file:///d:/Agri2Value/reference-projects/jspmnarhewinners/tailwind.config.js), [`vite.config.js`](file:///d:/Agri2Value/reference-projects/jspmnarhewinners/vite.config.js)
  - Layout & Entry: [`src/App.jsx`](file:///d:/Agri2Value/reference-projects/jspmnarhewinners/src/App.jsx), [`src/index.css`](file:///d:/Agri2Value/reference-projects/jspmnarhewinners/src/index.css)
- **Status:** **Functional.** Clean visual design; however, the lack of TypeScript creates type safety risks compared to Agri2Value's strict TypeScript codebase.

### 2. Dashboard and Navigation
- **Architecture:** Role-based dual layout:
  - Desktop: Collapsible sidebar navigation ([`src/components/Sidebar.jsx`](file:///d:/Agri2Value/reference-projects/jspmnarhewinners/src/components/Sidebar.jsx)) and top navbar ([`src/components/Navbar.jsx`](file:///d:/Agri2Value/reference-projects/jspmnarhewinners/src/components/Navbar.jsx)).
  - Mobile: Specialized bottom navigation bar ([`src/components/MobileNav.jsx`](file:///d:/Agri2Value/reference-projects/jspmnarhewinners/src/components/MobileNav.jsx)) and farmer-specific mobile home view ([`src/pages/MobileHome.jsx`](file:///d:/Agri2Value/reference-projects/jspmnarhewinners/src/pages/MobileHome.jsx)).
- **Role Routing:** Distinct dashboards for `farmer` (`/dashboard`), `admin` (`/admin`), `labour` (`/labour`), and `audit` (`/audit`).
- **Source Files:** [`src/App.jsx:L85-L120`](file:///d:/Agri2Value/reference-projects/jspmnarhewinners/src/App.jsx#L85-L120), [`src/pages/Dashboard.jsx`](file:///d:/Agri2Value/reference-projects/jspmnarhewinners/src/pages/Dashboard.jsx) (136 KB).
- **Status:** **Functional.** High-density UI with real-time Firebase state binding.

### 3. Farmer Registration and Authentication
- **Implementation:** Firebase Authentication (Email/Password + Google OAuth2 popup).
- **Session Management:** Zustand store ([`src/store/useAuthStore.js`](file:///d:/Agri2Value/reference-projects/jspmnarhewinners/src/store/useAuthStore.js)) bound to `onAuthStateChanged` and Realtime Database listener at `users/${uid}`.
- **Roles:** `farmer`, `owner` (equipment owner), `labour`, `admin`, `audit`.
- **Source Files:** [`src/pages/AuthPage.jsx`](file:///d:/Agri2Value/reference-projects/jspmnarhewinners/src/pages/AuthPage.jsx), [`src/firebase.js`](file:///d:/Agri2Value/reference-projects/jspmnarhewinners/src/firebase.js).
- **Status:** **Functional with Firebase.** However, it relies entirely on Google Firebase SaaS. It is **incompatible** with Agri2Value's self-hosted, sovereign JWT and phone/OTP authentication architecture.

### 4. Farm and Crop Management
- **Implementation:** Dual approach:
  - In frontend: Basic user profile storage in Firebase RTDB (`users/${uid}/crops`).
  - In `CropShield/backend`: Full relational relational models for `FarmProfile` ([`CropShield/backend/app/db/models/farm_profile.py`](file:///d:/Agri2Value/reference-projects/jspmnarhewinners/CropShield/backend/app/db/models/farm_profile.py)) with polygon boundaries, district, taluka, village indices, and crop types.
- **Status:** **Partially Functional.** The frontend UI primarily treats farm details as static metadata, while the CropShield backend contains real geographic polygon structures.

### 5. Market and Buyer Features
- **Implementation:**
  1. **Live Mandi Prices ([`src/pages/LiveMandiPrices.jsx`](file:///d:/Agri2Value/reference-projects/jspmnarhewinners/src/pages/LiveMandiPrices.jsx)):** Real integration with the Government of India Open Data platform API:
     `https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070`
     Displays modal prices, min/max prices, commodity search, state filters, and fallback mock data when rate-limited.
  2. **Mandi Advisor ([`src/pages/MandiAdvisor.jsx`](file:///d:/Agri2Value/reference-projects/jspmnarhewinners/src/pages/MandiAdvisor.jsx)):** Historical price chart and moving-average price direction predictor ("SELL TODAY" vs "WAIT").
  3. **Pesticide / Agrochemical Exchange ([`src/pages/PesticideExchange.jsx`](file:///d:/Agri2Value/reference-projects/jspmnarhewinners/src/pages/PesticideExchange.jsx)):** Peer-to-peer marketplace for surplus fertilizers, bio-stimulants, and chemicals with distance radius, expiry dates, and PDF GST invoice generation.
- **Status:** **Functional.** The Data.gov.in integration is real and directly useful for Agri2Value mandi price validation.

### 6. Backend Architecture and APIs
`jspmnarhewinners` actually has **three** different backend paradigms:
1. **Firebase Serverless (Primary Frontend):** Direct client SDK calls to Firebase RTDB (`https://agroshare-17977-default-rtdb.firebaseio.com`) and Cloud Firestore.
2. **CropShield Backend ([`CropShield/backend/`](file:///d:/Agri2Value/reference-projects/jspmnarhewinners/CropShield/backend)):** FastAPI async backend running on port 8000. Features SQLAlchemy 2.0, Alembic, Redis caching, job worker queues (`inline_runner.py`), and REST endpoints under `/api/v1/`.
3. **Plant Disease API ([`Plant-Disease-Detection-Keras-main/app.py`](file:///d:/Agri2Value/reference-projects/jspmnarhewinners/Plant-Disease-Detection-Keras-main/app.py)):** Lightweight FastAPI microservice exposing `POST /predict` on uploaded leaf images.
- **Status:** **Functional.** The CropShield FastAPI architecture is remarkably clean and 100% compatible with Agri2Value's FastAPI backend.

### 7. Database Schemas
- **Firebase Realtime Database:** Defined by rules in [`database.rules.json`](file:///d:/Agri2Value/reference-projects/jspmnarhewinners/database.rules.json):
  - `/users/{uid}`: Profiles, roles, ratings.
  - `/equipment/{eqId}`: Rental listings, rates, status.
  - `/bookings/{bookId}`: Transactions, dates, escrow status.
  - `/labour_campaigns/{campaignId}`: On-demand labour requests.
- **CropShield Relational DB (PostgreSQL / SQLite):**
  - `FarmProfile`: `id`, `farmer_name`, `district`, `taluka`, `village`, `polygon_geojson`, `survey_numbers`.
  - `Claim`: `id`, `farm_profile_id`, `damage_date`, `crop_type`, `status`, `loss_percentage`.
  - `AnalysisRun`: `id`, `claim_id`, `pre_damage_date`, `post_damage_date`, `mean_ndvi_drop`, `evidence_summary`.
  - `ClaimAuditLog`: Immutable audit trail of reviewer decisions.
- **Status:** **Functional.**

### 8. AI and Machine Learning Capabilities
1. **Crop & Equipment Recommendation ([`src/services/aiRecommendationService.js`](file:///d:/Agri2Value/reference-projects/jspmnarhewinners/src/services/aiRecommendationService.js)):** **SIMULATION.** Hardcoded JavaScript rule table (`map['wheat']['harvesting'] = 'Combine Harvester'`) with a fake `setTimeout(1500)` delay.
2. **Vision Disease Scanner ([`src/pages/CropDiseaseScanner.jsx`](file:///d:/Agri2Value/reference-projects/jspmnarhewinners/src/pages/CropDiseaseScanner.jsx)):** **FUNCTIONAL VIA API.** Uploads image to ImgBB and prompts Groq Cloud Vision (`meta-llama/llama-4-scout-17b-16e-instruct`) for disease classification, pathogen identification, and organic remedies.
3. **Offline Keras Plant Disease Model ([`Plant-Disease-Detection-Keras-main/`](file:///d:/Agri2Value/reference-projects/jspmnarhewinners/Plant-Disease-Detection-Keras-main)):** **FUNCTIONAL LOCAL MODEL.** Pre-trained Convolutional Neural Network (`plant_classifier.h5`) predicting `Healthy`, `Powdery`, and `Rust` at $80\times80$ resolution.
4. **Satellite Vegetation Index Damage Model ([`CropShield/backend/app/services/indices.py`](file:///d:/Agri2Value/reference-projects/jspmnarhewinners/CropShield/backend/app/services/indices.py)):** **REAL SCIENTIFIC FORMULAS.** Calculates NDVI:
   $$\text{NDVI} = \frac{\text{NIR} - \text{Red}}{\text{NIR} + \text{Red}}$$
   $$\text{NDWI} = \frac{\text{NIR} - \text{SWIR}}{\text{NIR} + \text{SWIR}}$$
   Quantifies crop vigour drop between pre-hazard and post-hazard scenes.

### 9. Weather, Irrigation and Crop Monitoring
- **Weather Service ([`src/services/weatherService.js`](file:///d:/Agri2Value/reference-projects/jspmnarhewinners/src/services/weatherService.js)):** Real integration with **Open-Meteo API**. Completely free, no API key required. Maps WMO meteorological codes to agricultural severity. Computes `isGoodForFieldWork()` (wind $< 40\text{ km/h}$, rain $< 2\text{ mm}$, temp $< 42^\circ\text{C}$).
- **Farm Monitoring UI ([`src/pages/FarmMonitoring.jsx`](file:///d:/Agri2Value/reference-projects/jspmnarhewinners/src/pages/FarmMonitoring.jsx)):** Connects via Firebase Firestore to listen to live telemetry from device `esp32_01`. Features Recharts telemetry charts, automated vs manual pump control, and soil moisture gauge.

### 10. Notifications and Alerts
- Toast alerts via `react-hot-toast` (`2.6.0`).
- Audible speech synthesis via Web Speech API (`window.speechSynthesis`) in Scheme Discovery and Legal Advisor.
- SMS Demo module ([`smsdemo/`](file:///d:/Agri2Value/reference-projects/jspmnarhewinners/smsdemo)): Node.js script using Twilio API for offline farmer SMS dispatch.

### 11. Admin and Audit Features
- **[`src/pages/AdminDashboard.jsx`](file:///d:/Agri2Value/reference-projects/jspmnarhewinners/src/pages/AdminDashboard.jsx):** Financial overview (5% platform fee collection, 18% GST calculation, damage escrow fund tracking, dispute resolution).
- **[`src/pages/CropClaimAudit.jsx`](file:///d:/Agri2Value/reference-projects/jspmnarhewinners/src/pages/CropClaimAudit.jsx):** Insurance assessor review panel inspecting satellite NDVI diffs, baseline comparison, and one-click claim approval/rejection.

### 12. Maps, Charts and Visualizations
- **Mapping:** Leaflet `1.9.4` + `react-leaflet` `5.0.0` with OpenStreetMap tiles. Used in:
  - `ColdChainLocator.jsx`: Cold storage facility markers with distance calculation.
  - `FarmBoundaryMap.jsx`: Polygon rendering of agricultural parcels.
- **Charts:** Recharts `3.8.1`: Line charts for soil moisture trends, Area charts for temperature/humidity, Bar charts for NPK nutrient levels.

### 13. External Services and Cloud Integrations
| Service | Purpose | Implementation Location | Operational Status |
|---|---|---|---|
| **Data.gov.in** | Indian Mandi daily benchmark rates | `LiveMandiPrices.jsx` | Functional (requires API key) |
| **Open-Meteo** | Free global weather & 7-day forecast | `weatherService.js` | **Fully Functional (No key required)** |
| **Firebase** | Auth, RTDB, Firestore | `firebase.js` | Functional (demo instance configured) |
| **Groq Cloud** | Vision LLM crop disease analysis | `CropDiseaseScanner.jsx` | Functional (requires Groq key) |
| **Cloudinary** | Equipment & damage photo upload | `cloudinary.js` | Functional |
| **ImgBB** | Temporary leaf photo hosting | `CropDiseaseScanner.jsx` | Functional (public key used) |
| **Sentinel / GEE** | Pre/Post damage satellite pairs | CropShield `satellite.py` | Functional with Earth Engine credentials |
| **Mahabhunakasha**| Cadastral survey parcel boundary extraction | CropShield `mahabhunakasha.py` | Script automation |

### 14. Deployment Configuration
- Vercel configuration: [`vercel.json`](file:///d:/Agri2Value/reference-projects/jspmnarhewinners/vercel.json) (SPA rewrite rule to `/index.html`).
- Firebase Hosting: Documented in [`DEPLOYMENT.md`](file:///d:/Agri2Value/reference-projects/jspmnarhewinners/DEPLOYMENT.md).
- Docker: [`CropShield/backend/Dockerfile`](file:///d:/Agri2Value/reference-projects/jspmnarhewinners/CropShield/backend/Dockerfile) (Python 3.11 slim).

### 15. Dependencies and License Status
- **Root Repository License:** **NO LICENSE FILE FOUND.** All rights reserved by original authors under default copyright laws. Code cannot be copied wholesale without explicit attribution/permission.
- **`Plant-Disease-Detection-Keras-main` License:** Explicit **MIT License** (Copyright 2022 Ifeanyi Nneji). Code and pre-trained weights can be freely reused with standard MIT attribution.
- **Credentials Security Warning:** The repository contains hardcoded Firebase API keys in `src/firebase.js` and an ImgBB key in `CropDiseaseScanner.jsx`.

---

# SECTION B: FARMMONITOR (AGRISENSE FARM) DETAILED AUDIT

### 1. Hardware Components
- **Microcontroller:** ESP32 DevKit V1 (DOIT 30-pin board, dual-core Tensilica Xtensa 32-bit LX6 @ 240 MHz).
- **Sensors:**
  1. **DHT11:** Temperature ($0\text{--}50^\circ\text{C} \pm 2^\circ\text{C}$) and Relative Humidity ($20\text{--}80\% \pm 5\%$).
  2. **Analog Soil Moisture Sensor (Capacitive/Resistive Probe):** Subsurface dielectric permittivity measurement.
  3. **IR Obstacle / Motion Sensor:** Digital infrared obstacle sensor for perimeter intruder detection.
  4. **Neo-6M GPS Module:** UART NMEA receiver for farm location tagging.
- **Actuators & Indicators:**
  1. **Micro Servo (SG90 / MG995):** Physical 0°–180° rotary arm actuating a water pipe restriction clamp or ball-valve handle.
  2. **Status LED:** Digital alert indicator.
- **Source File:** [`reference-projects/FarmMonitor/firmware/firmware.ino`](file:///d:/Agri2Value/reference-projects/FarmMonitor/firmware/firmware.ino).

### 2. Microcontroller Code Analysis
- **Language / Environment:** Arduino C++ (`.ino`). Compiled via Arduino IDE / PlatformIO.
- **Libraries Required:**
  - `<WiFi.h>` & `<HTTPClient.h>` (ESP32 core)
  - `<ArduinoJson.h>` (by Benoit Blanchon, v6)
  - `<DHT.h>` (by Adafruit)
  - `<ESP32Servo.h>` (ESP32 hardware timer PWM servo library)
  - `<TinyGPS++.h>` (NMEA sentence parser by Mikal Hart)
  - `<time.h>` (POSIX NTP time client)

### 3. Pin Mappings and Wiring Architecture
```
========================================================================
ESP32 DevKit V1 (30-Pin) Hardware Interfacing Matrix
========================================================================
Component            ESP32 Pin    Function            Power Rail
------------------------------------------------------------------------
DHT11 Temp/Hum       GPIO 4       Digital I/O         3.3V / GND
Soil Moisture Probe  GPIO 34      Analog Input (ADC1) 3.3V / GND
IR Intruder Sensor   GPIO 19      Digital Input       3.3V / GND
Status Alert LED     GPIO 18      Digital Output      GND (330Ω resistor)
Water Valve Servo    GPIO 25      PWM Output (50 Hz)  VIN (5.0V) / GND
Neo-6M GPS Module    GPIO 16 (RX) UART2 Serial        3.3V / GND
                     GPIO 17 (TX) UART2 Serial        
========================================================================
```

### 4. Wiring and Power Requirements
- **Sensors:** Powered from ESP32 on-board $3.3\text{V}$ LDO regulator.
- **Servo Motor:** Must be powered from **$5.0\text{V}$ VIN** or an external $5\text{V}$ 2A adapter. Operating high-torque servos directly from the $3.3\text{V}$ pin causes brownout resets on the ESP32.
- **Common Ground:** All GND lines (sensor, servo, ESP32) must be tied together.

### 5. Sensor Calibration
- Soil moisture raw reading from 12-bit ADC (`analogRead` on GPIO 34 returns $0\text{--}4095$):
  ```cpp
  int rawMoisture = analogRead(SOIL_MOISTURE_PIN);
  int moisturePercent = map(rawMoisture, 4095, 1500, 0, 100);
  moisturePercent = constrain(moisturePercent, 0, 100);
  ```
- **Calibration Curve:** 
  - $4095$ raw ADC = Completely Dry Air ($0\%$).
  - $1500$ raw ADC = Saturated Wet Soil / Water immersion ($100\%$).
  - Inverted mapping correctly handles resistive pull-up behavior.

### 6. Communication Protocol & Telemetry Payload
- **Protocol:** HTTP/1.1 REST over WiFi ($802.11\text{ b/g/n}$).
- **Target:** Google Cloud Firestore REST API v1:
  `https://firestore.googleapis.com/v1/projects/{PROJECT_ID}/databases/(default)/documents/farm_devices/{DEVICE_ID}`
- **Telemetry Payload (HTTP PATCH):**
  ```json
  {
    "fields": {
      "moisture": { "integerValue": 42 },
      "temperature": { "doubleValue": 28.5 },
      "humidity": { "doubleValue": 65.0 },
      "motorStatus": { "booleanValue": false },
      "securityAlert": { "booleanValue": false },
      "latitude": { "doubleValue": 20.0768 },
      "longitude": { "doubleValue": 74.0375 }
    }
  }
  ```
- **Event History Payload (HTTP POST to `/history`):**
  Records `"Irrigation ON"` or `"Irrigation OFF"` with mode and local IST timestamp from NTP (`pool.ntp.org`).

### 7. Automation, Irrigation Control & Hysteresis Logic
- **Safety Hysteresis Loop:**
  ```cpp
  if (currentMode == "MANUAL") {
    motorShouldRun = motorOverride;
  } else {
    if (moisturePercent < 22) {
      motorShouldRun = true;  // Trigger irrigation
    } else if (moisturePercent > 28) {
      motorShouldRun = false; // Stop irrigation
    } else {
      motorShouldRun = motorStatus; // Preserve current state in deadband
    }
  }
  ```
  The $22\%\text{--}28\%$ moisture hysteresis deadband prevents valve oscillation and relay chattering.
- **Safe Boot:** Firmware explicitly sets `waterValveServo.write(0)` (valve closed) during `setup()` to prevent uncontrolled flooding upon power restoration.

### 8. Critical Defects & Security Vulnerabilities in FarmMonitor Firmware
1. **Hardcoded Credentials:** WiFi SSID (`noname`) and password (`passwordnahiaahe`) are plain text in source code.
2. **Zero Device Authentication:** The firmware transmits unauthenticated HTTP requests directly to Google Firestore REST endpoints. This requires Firestore security rules to be in open "Test Mode" (`allow read, write: if true;`), exposing the entire database to public manipulation.
3. **Blocking Synchronous Polling:** The firmware executes blocking `http.GET()`, `http.PATCH()`, and `delay(1000)` inside `void loop()`. If the WiFi network drops or latency spikes, loop execution halts, dropping GPS serial interrupts and delaying intruder detection.
4. **Lack of Actuator Timeout (Runaway Flooding Risk):** If the pump is turned ON and connection is subsequently lost, the valve remains open indefinitely because there is no firmware-side safety watchdog timer.

---

### Audit Summary: Strengths and Weaknesses

| Project | Key Strengths | Key Weaknesses |
|---|---|---|
| **`jspmnarhewinners`** | Rich React 19 UI; live Mandi pricing from Data.gov.in; free Open-Meteo weather rules; Leaflet cold chain map; PDF invoice generation; CropShield satellite NDVI analysis. | Lack of TypeScript; hardcoded Firebase keys; simulation mocks mixed with real code; unauthenticated Cloudinary uploads. |
| **`FarmMonitor`** | Clear ESP32 hardware pinout; calibrated soil moisture mapping; valve servo actuation; hysteresis irrigation loop; NTP event timestamps. | Completely unauthenticated HTTP telemetry; blocking network calls; hardcoded WiFi credentials; open Firestore test rules; missing safety shutoff timer. |
