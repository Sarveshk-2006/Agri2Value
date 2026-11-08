# Agri2Value — Engine Specs Responsive Test Matrix
**Route:** `/app/specs`  
**Standard:** 100% Fluid & Mobile-First Responsive Design (320px to 1440px+)  
**Tested Breakpoints:** 1440px (Desktop), 1024px (Laptop), 768px (Tablet), 375px (Mobile Standard), 320px (Mobile Compact)

---

## 1. Responsive Test Summary Matrix

| Viewport | Device Class | Width x Height | Horizontal Overflow | Layout Stacking & Wrapping | Tap Targets (>=44px) | Visual Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Desktop Ultra** | Large Monitor / Desktop | 1440 × 1100 | **0px** (Pass) | 6-col Health Ribbon, 3-col Stack cards, 12-col DB explorer, 7-col Decision Pipeline | Passed | **VERIFIED** |
| **Laptop / Small Desktop** | Standard Laptop / Surface | 1024 × 800 | **0px** (Pass) | 6-col Health Ribbon, 3-col Stack cards, 12-col DB explorer, 4-col Decision Pipeline | Passed | **VERIFIED** |
| **Tablet Portrait** | iPad / Android Tablet | 768 × 1024 | **0px** (Pass) | 3-col x 2-row Health Ribbon, 2-col Stack cards, stacked DB explorer, 4-col Pipeline | Passed | **VERIFIED** |
| **Mobile Standard** | iPhone 12/13/14/15, Pixel | 375 × 812 | **0px** (Pass) | 2-col Health Ribbon, 1-col Stack cards, 1-col DB explorer, 2-col Pipeline | Passed (>=48px) | **VERIFIED** |
| **Mobile Compact** | iPhone SE / Small Android | 320 × 700 | **0px** (Pass) | 2-col mini Health cards, 1-col cards, wrapped chips, 0 text clipping | Passed (>=44px) | **VERIFIED** |

---

## 2. Key Viewport Testing Observations

### 2.1 1440px Desktop
- Hero section displays full title, bilingual Marathi subtitle, Grand Challenge badge, and live latency health stats.
- 6-Layer Architecture displays full interactive layer cards with pill-shaped subsystem badges.
- Database Schema Explorer displays side-by-side model selector and column definitions drawer (`lg:grid-cols-12`).
- Decision Engine visual calculation pipeline spans across 7 horizontal columns (`lg:grid-cols-7`).

### 2.2 1024px Laptop
- Smooth transitions between sections with zero layout jumping.
- Sticky quick-jump pills remain accessible and scroll smoothly.
- API Explorer list allows scrolling within its container without breaking page scroll.

### 2.3 768px Tablet
- 6-col Health Ribbon adapts into a 3-column by 2-row grid (`sm:grid-cols-3`).
- Technology Stack cards fold into 2 columns (`md:grid-cols-2`).
- Grand Challenge Evaluation criteria cards display 2 columns with clear proof paths.

### 2.4 375px Mobile Standard
- Health Ribbon folds into a clean 2-column grid (`grid-cols-2`).
- Technology Stack, Database Models, and API cards stack into full-width cards (`w-full`).
- End-to-end data pipeline maintains vertical connector line with compact padding.
- API endpoint cards stack method badges, copy buttons, and paths gracefully without overflowing.

### 2.5 320px Mobile Compact
- Micro-padding applied to cards (`p-4` to `p-3.5`).
- Guaranteed 0px horizontal scrollbar on root window.
- All code spans and table names wrap safely.
