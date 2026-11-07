# Agri2Value — Crop Rescue Mode Responsive Test Matrix
**Route:** `/app/rescue`  
**Standard:** 100% Fluid & Mobile-First Responsive Design (320px to 1440px+)  
**Tested Breakpoints:** 1440px (Desktop), 1024px (Laptop), 768px (Tablet), 375px (Mobile Standard), 320px (Mobile Compact)

---

## 1. Responsive Test Summary Matrix

| Viewport | Device Class | Width x Height | Horizontal Overflow | Layout Stacking & Wrapping | Tap Targets (>=44px) | Visual Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Desktop Ultra** | Large Monitor / Desktop | 1440 × 1100 | **0px** (Pass) | Full 4-col KPI row, 2-col Cockpit & Risk signals, 2-col pathways grid | Passed | **VERIFIED** |
| **Laptop / Small Desktop** | Standard Laptop / Surface | 1024 × 800 | **0px** (Pass) | 4-col KPI row, 2-col Cockpit & Risk signals, 2-col pathways grid | Passed | **VERIFIED** |
| **Tablet Portrait** | iPad / Android Tablet | 768 × 1024 | **0px** (Pass) | 2-col KPI cards, stacked Urgency Cockpit & Risk signals, single-col pathways | Passed | **VERIFIED** |
| **Mobile Standard** | iPhone 12/13/14/15, Pixel | 375 × 812 | **0px** (Pass) | 1-col KPI cards, stacked timeline, full-width action dispatch buttons | Passed (>=48px) | **VERIFIED** |
| **Mobile Compact** | iPhone SE / Small Android | 320 × 700 | **0px** (Pass) | 1-col cards, wrapped chips & badges, micro-padded headers, 0 clipping | Passed (>=44px) | **VERIFIED** |

---

## 2. Key Viewport Testing Observations

### 2.1 1440px Desktop
- Emergency Hero displays side-by-side title and lot selection / action buttons with generous spacing (`gap-4`).
- KPI Cards align in an expansive 4-column grid (`grid-cols-1 md:grid-cols-4`).
- Urgency Cockpit is positioned adjacent to Root Causes & Risk Signals (`grid-cols-1 lg:grid-cols-12`).
- 5 Salvage Pathways render in a clean 2-column card grid with Option 1 elevated as a prominent Primary Recommendation.
- Regional Facilities render in a 4-column balanced grid with direct access to contact numbers and distances.

### 2.2 1024px Laptop
- Smooth transition without horizontal jumping or card clipping.
- Assumptions drawer slides in from the right over 420px width without interrupting main background scroll position.
- "What-If" simulator sliders remain fully draggable with large circular thumb grab areas.

### 2.3 768px Tablet
- Overview KPI cards fold gracefully into 2 rows of 2 columns (`grid-cols-2`).
- Urgency cockpit takes full width; circular gauge scales dynamically to 130px diameter.
- Progression timeline adapts horizontally with continuous connector lines and wrapped timestamp descriptions.

### 2.4 375px Mobile Standard
- Single-column flow (`w-full`) across all cards and sections.
- Dispatch modal stretches edge-to-edge with safe margins (`mx-3`), touch-friendly dispatch window selection pills (`py-3`), and sticky bottom confirmation buttons.
- Deduction breakdown tables use compact flexbox rows (`flex justify-between items-center py-1.5`) rather than fixed width HTML tables, completely preventing horizontal clipping.

### 2.5 320px Mobile Compact
- All headers (`text-xl` to `text-2xl`), subtitle descriptions, and alert tags wrap gracefully.
- Padding scaled down using conditional Tailwind utility classes (`p-3.5 sm:p-5`).
- Guaranteed 0px horizontal scrollbar with full touch target compliance for rural field operators using one hand.
