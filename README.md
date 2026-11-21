# 🌿 BreatheWise AI — Urban Air Quality & Winter Smog Assistant

> **Hackathon Submission Version (Production Ready)**  
> Next-generation urban air intelligence, clinical diurnal inversion mitigation, and hyper-local environmental resilience powered by Google Gemini and real Copernicus CAMS atmospheric grid modeling.

[![Next.js 16](https://img.shields.io/badge/Next.js-16.4.6-black?logo=next.js)](https://nextjs.org/)
[![React 19](https://img.shields.io/badge/React-19.3.0-61DAFB?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9.3-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Google Gemini](https://img.shields.io/badge/Google%20GenAI-gemini--3.5--flash--lite-4285F4?logo=google)](https://aistudio.google.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS%204.x-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)
[![Playwright](https://img.shields.io/badge/Playwright-10%2F10%20Tests%20Passed-2EAD33?logo=playwright)](https://playwright.dev/)

---

## 📌 Executive Summary

Urban air pollution—particularly northern Indian winter smog trapped under nocturnal thermal inversions—is a public health emergency. Standard weather apps only display raw numbers without actionable clinical directives, unvented indoor risks, or personalized routines.

**BreatheWise AI** bridges the gap between atmospheric science and daily human habit. It ingests numerical atmospheric assimilation from the **Copernicus Atmosphere Monitoring Service (CAMS)** and Open-Meteo, computes dual air quality standards (**India CPCB NAQI** and **US EPA NowCast**), and pairs them with **Google Gemini (`gemini-3.5-flash-lite`)** to generate timed respiratory schedules, budget-based indoor air mitigations, multimodal transit carbon calculations, and crowd-verified hazard reporting.

---

## 🏛️ Project Architecture

```mermaid
flowchart TD
    subgraph Client ["Client Layer (VisionOS Minimalist Glassmorphism)"]
        UI_Home["Overview Dashboard\n(Above-fold AQI, Directives, Weather)"]
        UI_Planner["AI Daily Planner\n(Family Profiles, Timed Routines)"]
        UI_Indoor["Indoor Assessment\n(Source Attribution, CADR, Budget Tiers)"]
        UI_Impact["Green Impact\n(IPCC Modal Shift, Fuel & CO2 Math)"]
        UI_Community["Community Watch\n(GPS Citizen Reports, Radar Map, Challenges)"]
        UI_Chat["AI Studio\n(Bilingual Gemini Streaming Chat)"]
    end

    subgraph Server ["Server-Side API Routes (Next.js 16 App Router)"]
        API_AQI["/api/air-quality\n(5-Min Cache, Geo Coords, Dual NAQI/NowCast)"]
        API_Assistant["/api/assistant\n(Token Capping, Rate Limiting, Prompt Injection Guard)"]
        API_Geo["/api/geocoding\n(Global & Indian City Resolvers)"]
    end

    subgraph Intelligence ["Scientific & AI Backends"]
        OpenMeteo["Open-Meteo API\n(Copernicus CAMS European Grid & Meteorological Reanalysis)"]
        GeminiSDK["@google/genai SDK\n(gemini-3.5-flash-lite Serverless Stream)"]
        Engines["Local Intelligence Engines\n• routine-generator.ts\n• indoor-assessment.ts\n• impact-formulas.ts"]
    end

    UI_Home --> API_AQI
    UI_Planner --> API_AQI & Engines
    UI_Indoor --> API_AQI & Engines
    UI_Impact --> Engines
    UI_Community --> API_AQI
    UI_Chat --> API_Assistant

    API_AQI --> OpenMeteo
    API_Assistant --> GeminiSDK
    API_Assistant -.-> API_AQI
```

---

## 🚀 Key Functional Modules

### 1. Urban Air Intelligence Dashboard (`/` & `/air-quality`)
- **Single-Screen Above-The-Fold Architecture**: AQI Radial Meter, AI Health Directive Banner, and 5 Core Particulate & Meteorological Metrics (PM2.5, PM10, Surface Temperature, Humidity, Wind Stagnation) render synchronously without requiring an initial scroll.
- **Dual Regulatory Standard Switcher**: Seamlessly toggle between:
  - **India National AQI (CPCB 2014 Standard)**: 6 clinical sub-indices with 24-hour concentration thresholds.
  - **US EPA NowCast Algorithm**: Dynamic 12-hour decaying weight function sensitive to rapid wildfire and smog spikes.
- **Historical & Forecast Trends**: 24-hour hourly particulate trend and forward 24-hour forecast tabs.
- **Source Transparency**: Unambiguous data attribution disclosing Copernicus CAMS assimilation vs. hardware stations.

### 2. AI Daily Air Hygiene Planner (`/planner`)
- **Household Vulnerability Cohorts**: Customizable family profiles (Infants, Asthmatic, Elderly 65+, Working Commuter, School Children).
- **Diurnal Time-Segmented Routines**:
  - **Morning Window (06:00 – 11:30)**: Stagnant inversion mitigation, school commute precautions, and HEPA priming.
  - **Afternoon Window (12:00 – 16:30)**: Solar thermal boundary layer expansion window, permitted ventilation intervals.
  - **Evening & Night Window (17:00 – 22:00+)**: Atmospheric boundary cooling, sealing door sweeps, and nocturnal sleep filtration.
- **Interactive Action Tracking**: Checkboxes with state persistence and **Clean Air Protection Score** calculation.
- **Bilingual Clinical Rationales**: Toggle instant Hindi (हिंदी) and English explanations for every protocol.

### 3. Indoor Air & Household Assessment (`/indoor`)
- **Interactive Household Assessment Drawer**: Captures apartment square footage, draftiness, window latches, cooking fuel (chimney vs. unvented LPG vs. induction vs. chulha), floor dusting method, and incense/dhoop burning.
- **Internal Source Matrix**: Identifies internal emissions with estimated $\mu\text{g}/\text{m}^3$ contributions (cooking fumes $+45\text{ to }+90\ \mu\text{g}/\text{m}^3$, agarbatti smoke $+35\text{ to }+85\ \mu\text{g}/\text{m}^3$, dry broom resuspension $+25\ \mu\text{g}/\text{m}^3$).
- **Budget-Tiered Interventions**: Filterable mitigations across 4 realistic price tiers:
  - **Free (₹0)**: Diurnal solar convection airing, wet-microfiber mopping, lid-covered simmering.
  - **Under ₹500**: Silicone under-door draft sweeps, activated bamboo charcoal pouches.
  - **₹500 – ₹3,000**: Pre-filter window mesh, DIY high-flow box fans, dual-stage kitchen exhaust.
  - **Above ₹3,000**: High-CADR True-HEPA air purifiers with laser particle sensors.
- **Ventilation Verdict & CADR Engine**: Live recommendation on natural airing vs. latching windows with room Air Changes per Hour (ACH) simulation.

### 4. Green Impact & Commute Analysis (`/impact`)
- **Multimodal Transportation Comparison**: Mathematical modeling of transit modes against private solo cars:
  - **Electric Metro Rail** ($45\text{ g CO}_2/\text{km}$)
  - **Carpool (3 Passengers)** ($64\text{ g CO}_2/\text{km}$)
  - **Electric Vehicle (EV)** ($51\text{ g CO}_2/\text{km}$)
  - **Bicycle / Foot Walking** ($0\text{ g CO}_2/\text{km}$)
  - **Solo Petrol Car Baseline** ($192\text{ g CO}_2/\text{km}$ @ $13.5\text{ km/L}$)
- **Real-Time Financial & Fuel Savings**: Calculates daily/monthly liters saved and INR ($\text{₹}$) conserved using prevailing metro fuel prices ($\text{₹}96.72/\text{L}$).
- **Mature Tree Absorption & Inhaled Particulate Math**: Converts avoided carbon to annual tree absorption ($21.8\text{ kg CO}_2/\text{tree}$) and calculates avoided respiratory inhalation ($\text{mg}$).
- **Scientific Disclosure Card**: Complete transparency of IPCC 2023 and CEA India carbon coefficients.

### 5. Community Smoke Watch & Clean Refuges (`/community`)
- **Citizen Mesh Incident Reporting**: Geo-tagged reporting modal with one-click **Detect GPS** coordinates, category picker (Biomass burning, Construction dust, Industrial emissions, Traffic gridlock), severity tiers, description, and photo attachment simulation.
- **Live Verification Feed**: Citizen upvoting system with instant counter increments and storage persistence.
- **Micro-Climate Radar Hotspot Canvas**: Spatial radar view displaying concentric range rings, crosshairs, sector coordinates, and clickable incident pins with popups.
- **Community Challenges**: Collective citizen goals (Zero-Idling School Zones, 5-Day Metro Commuters, Smoke Sentinels) with milestone tracking.
- **Verified Clean Air Refuges**: Municipal safe indoor public refuges (Libraries, Underground Metro Concourses, Health Wellness Centres) with indoor AQI telemetry and one-click address copying.

### 6. AI Atmospheric Conversational Studio (`/assistant`)
- **Official `@google/genai` Integration**: Powered by `gemini-3.5-flash-lite` running server-side with sub-second streaming.
- **Strict Data Grounding**: AI is grounded in real atmospheric data and strictly instructed never to hallucinate unobserved sensor values.
- **Token Capping & 20-Min Cache**: Efficient resource footprint with responses capped at $\le 350$ tokens.

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Framework** | Next.js 16.4.6 (Turbopack, App Router, Serverless API Routes) |
| **Language & Runtime** | React 19.3.0, TypeScript 5.9.3 (Strict Mode), Node.js 20+ |
| **Styling & Design** | Tailwind CSS 4.x, VisionOS Glassmorphism, CSS Backdrop Blur |
| **Animation & UX** | Motion (`motion/react` v12), Lucide React Icons |
| **AI / GenAI** | `@google/genai` (v3.6.1 official SDK), Google Gemini `gemini-3.5-flash-lite` |
| **Environmental APIs**| Open-Meteo Air Quality & Weather API, Copernicus CAMS Reanalysis |
| **Testing & QA** | Playwright 1.65.1 (Chromium Desktop & Mobile), ESLint 9.x |

---

## 🧪 Senior QA Test Verification Matrix

All 10 test suites have been verified with Playwright automated tests.

| # | Test Scenario | Device / Environment | Status | Verification Detail |
| :---: | :--- | :--- | :---: | :--- |
| **1** | Desktop Overview Above-the-Fold | Desktop Chrome (1440×900) | ✅ **PASSED** | AQI meter, directives & 5 metric cards fit above fold with zero scroll. |
| **2** | Mobile Responsiveness | iPhone 14 (390×844) | ✅ **PASSED** | Fluid typography, wrapped metric cards, responsive navigation. |
| **3** | Route Navigation | Desktop Chrome | ✅ **PASSED** | Zero-lag transitions across `/`, `/planner`, `/indoor`, `/impact`, `/community`, `/assistant`. |
| **4** | Daily Planner & Family Profiles | Desktop Chrome | ✅ **PASSED** | Cohort selection, checkbox completion tracking, points computation. |
| **5** | Indoor Assessment & Budget Tiers | Desktop Chrome | ✅ **PASSED** | Assessment drawer, 4 budget filter tabs, room purifier power toggles. |
| **6** | Transport Comparison Calculator | Desktop Chrome | ✅ **PASSED** | Distance/days sliders, fuel & INR savings, IPCC assumptions card. |
| **7** | Community Report & Hotspot Radar | Desktop Chrome | ✅ **PASSED** | GPS detect, incident submission, live upvote counter, radar pins. |
| **8** | Environmental API Live Telemetry | Serverless Route (`/api/air-quality`)| ✅ **PASSED** | Fetches live Copernicus CAMS PM2.5, PM10, Temp, Humidity, Wind. |
| **9** | Gemini GenAI Streaming Flow | Serverless Route (`/api/assistant`)  | ✅ **PASSED** | Streaming clinical advice in English and Hindi in < 1.5 seconds. |
| **10**| Zero Client Key Leakage | DOM & Bundle Inspection | ✅ **PASSED** | `GEMINI_API_KEY` never emitted to client bundles, HTML, or logs. |

---

## 🎬 Step-by-Step Demo Scenarios (For Evaluators)

### Scenario A: Winter Smog Morning Routine
1. Visit the home page `http://localhost:3000/`. Notice the current AQI (e.g., 252 - Very Unhealthy in New Delhi) with the AI Health Recommendation prominently warning about winter atmospheric stagnation.
2. Toggle the AQI switcher between **India NAQI** and **US EPA** in the top bar to inspect differences between the two standards.
3. Click **AI Daily Planner** in the sidebar.
4. Click **Family Profile** and choose **Elderly Relatives (65+)** or **Asthma / Respiratory**. Notice the routine recalibrates to advise staying indoors during the 06:00–09:00 AM nocturnal inversion trap.
5. Check off the morning action items to observe your **Clean Air Protection Score** update in real time.

### Scenario B: Household Indoor Assessment & Budget Interventions
1. Click **Indoor Air** in the sidebar.
2. Observe the **Ventilation Verdict** banner: because outdoor AQI is high, it flags "Smog Infiltration Hazard — Keep Windows Latched".
3. Click **Household Assessment** and configure your apartment: adjust size, toggle unvented cooking or incense burning.
4. Review the **Identified Household Pollution Sources** showing estimated particulate additions ($+45\text{ to }+85\ \mu\text{g}/\text{m}^3$).
5. Switch between budget filter tabs: **Free (₹0)**, **Under ₹500**, and **₹500 – ₹3,000**.
6. Click **Read Step-by-Step DIY Guide** on any recommendation to open the actionable DIY modal.

### Scenario C: Commute Carbon & Money Savings Calculator
1. Click **Green Impact** in the sidebar.
2. Select **Metro Rail** as your transit choice.
3. Slide **Daily One-Way Commute Distance** to $20\text{ km}$ and **Monthly Working Days** to $22\text{ days}$.
4. Watch the counters update immediately: monthly $\text{CO}_2$ avoided, fuel saved in liters, and money saved in $\text{₹}$ (INR).
5. Click **Share Impact Summary** to copy a formatted report to your clipboard.

### Scenario D: Community Hazard Reporting & Hotspot Radar
1. Click **Community Watch** in the sidebar.
2. Click **Report Pollution**. Click **Detect GPS** to auto-populate coordinates. Select **Biomass / Garbage Burning**, attach simulated photo evidence, and hit **Submit Incident Report**.
3. See your incident appear at the top of the citizen feed.
4. Click the **Upvote / Verify** button on any community report to see the verification count update live.
5. Switch to the **Radar Hotspot Map** tab to inspect the interactive radar showing hazard pins surrounding your coordinates.

### Scenario E: AI Atmospheric Assistant Chat
1. Click **AI Assistant** in the sidebar.
2. Type: *"Should I go for an early morning run in Delhi today?"*
3. Watch Gemini stream a clinical response analyzing current atmospheric stagnation, recommending afternoon indoor cardio instead.
4. Switch language toggle to **हिंदी** to test bilingual Hindi air hygiene intelligence.

---

## 🔒 Security & Privacy Architecture

- **Server-Side API Key Isolation**: The `GEMINI_API_KEY` is read strictly within Next.js Node.js serverless runtimes. No `NEXT_PUBLIC_` prefix is ever used.
- **Prompt Injection Defense**: User queries in `/api/assistant` are sanitized and bounded within clinical system instructions.
- **In-Memory Rate Limiting**: The assistant endpoint enforces IP-based rate limiting (40 queries/window) with HTTP 429 backoff headers.
- **Strict Privacy**: Citizen smoke observations do not collect personal identifiers; user settings are persisted in local browser storage (`localStorage`).

---

## ⚠️ Known Limitations & Future Roadmap

1. **Physical Station Latency in Rural India**: While Open-Meteo Copernicus CAMS assimilation covers every square kilometer globally via satellite reanalysis, ground-level physical CPCB station hardware coverage is concentrated in tier-1 metropolitan cities. Future releases will integrate hyper-local low-cost IoT sensor meshes (e.g., PurpleAir / AirGradient).
2. **Offline Mode**: The application caches the last known atmospheric state in memory and browser storage; however, active chat with Gemini requires internet connectivity.
3. **Automated Municipal Dispatch**: Currently, community reports are verified through citizen consensus; future versions can interface with municipal CPCB grievance portals via webhooks.

---

## 💻 Local Setup & Development

```bash
# 1. Clone repository
git clone https://github.com/techyuser/breathewise-ai.git
cd breathewise-ai

# 2. Install dependencies
pnpm install

# 3. Configure environment variables
cp .env.example .env.local
# Add your Google Gemini API key into .env.local:
# GEMINI_API_KEY=your_gemini_api_key_here

# 4. Run development server
pnpm dev

# 5. Run Playwright E2E Test Suite
npx playwright test

# 6. Build for production
pnpm build
pnpm start
```

---

## 📄 License
This project is open-source under the MIT License. Developed for the 2026 AI for Environmental Resilience Hackathon.
