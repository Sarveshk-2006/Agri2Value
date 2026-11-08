# Agri2Value — IoT Monitoring Multi-Viewport Responsive Tests
**Route:** `/app/iot`  
**Test Date:** November 2026  
**Test Suite:** Headless Chrome Viewport Verification & Layout Boundary Audit  

---

## 1. Viewport Test Matrix & Artifact Record

| Viewport Category | Resolution (W × H) | Captured Screenshot Artifact | Horizontal Overflow | Layout Grid State | Status |
| :--- | :--- | :--- | :---: | :--- | :---: |
| **Desktop Ultra/Wide** | 1440 × 1100 px | `docs/screenshots/iot_redesign_desktop_1440.png` | **0 px** | 3-col devices, 3-col gauges, 2-col diagnostics | **PASSED** |
| **Laptop Standard** | 1024 × 900 px | `docs/screenshots/iot_redesign_laptop_1024.png` | **0 px** | 2-col devices, 3-col gauges, 2-col diagnostics | **PASSED** |
| **Tablet Portrait** | 768 × 1024 px | `docs/screenshots/iot_redesign_tablet_768.png` | **0 px** | 2-col devices, 2-col gauges, stacked diagnostics | **PASSED** |
| **Mobile Standard** | 375 × 812 px | `docs/screenshots/iot_redesign_mobile_375.png` | **0 px** | 1-col devices, 1-col gauges, horizontally scrollable table | **PASSED** |
| **Compact Mobile** | 320 × 600 px | `docs/screenshots/iot_redesign_mobile_320.png` | **0 px** | 1-col cards, micro-paddings, zero clipping | **PASSED** |

---

## 2. Responsive Design Highlights & Fixes

1. **Elimination of Artificial Column Compression:**
   - The baseline view suffered from narrow layout constraints.
   - The redesigned interface utilizes `max-w-7xl mx-auto w-full px-3 sm:px-6 lg:px-8` matching the primary Agri2Value shell, delivering an expansive, professional command center appearance.

2. **Adaptive Grid Transformations:**
   - **Command Header Ribbon:** 5 items scale from 5 columns on desktop (`lg:grid-cols-5`), to 3 columns on tablet (`sm:grid-cols-3`), to 2 columns on mobile.
   - **Scenario Presets:** 6 buttons scale from 6 columns on large displays (`lg:grid-cols-6`), to 3 columns on medium displays (`sm:grid-cols-3`), to 2 columns on mobile.
   - **Sensor Gauges:** 6 cards dynamically adapt:
     - Desktop: 3 columns (`lg:grid-cols-3`)
     - Tablet: 2 columns (`sm:grid-cols-2`)
     - Mobile: 1 column (`grid-cols-1`)
   - **Time-Series Chart:** SVG canvas uses responsive `viewBox="0 0 700 200"` with vector scaling and proportional height (`h-64`).

3. **Compact Mobile (320px) Verification:**
   - Table wrapped in `overflow-x-auto` to prevent root window expansion.
   - Action buttons and filter bars flex-wrap cleanly without text overlap.
   - All slider labels and numeric values wrap gracefully with zero horizontal scrollbar on `document.body`.

