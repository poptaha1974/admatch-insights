# AdMatch ↔ THINC Integration Plan

This plan connects `admatch-insights` to `thinc-v4`.

---

## 1. Target flow

```text
AdMatch UI
  ↓
src/lib/thincApi.ts
  ↓
THINC FastAPI service
  ↓
thinc_v4.framework
  ↓
Decision-support response
```

---

## 2. Environment variable

```text
VITE_THINC_API_URL=http://localhost:8000
```

Fallback value in development:

```text
http://localhost:8000
```

---

## 3. First API client methods

```ts
getHealth()
getTheorySummary()
analyzeCampaign(payload)
getIntegrationStatus()
getFounderReadiness(payload)
```

---

## 4. Demo data separation

Move static campaign numbers into:

```text
src/data/demoCampaigns.ts
```

Routes should import demo data from that module instead of embedding arrays directly inside page components.

---

## 5. UI badges

Each page should render one of:

```text
Demo Mode
Manual CSV
Live API
Error
```

---

## 6. Source of truth rule

Frontend may calculate temporary preview numbers, but the final decision must come from THINC API.

Allowed frontend preview:

- visual charts.
- local table sorting.
- formatting.
- temporary empty states.

Not allowed as final truth:

- Kill/Fix/Scale decision.
- THINC score.
- risk level.
- theory-based recommendations.

---

## 7. Next UI task

Add a Campaign Analyzer page or panel:

1. Select a demo campaign.
2. Send it to `/api/campaign/analyze`.
3. Display:
   - Real CPA.
   - attribution gap.
   - profit.
   - THINC score.
   - decision.
   - blind spots.
   - recommendations.

---

## 8. Production warning

The current integration cards are UI placeholders unless connected to the backend integration status endpoint.

Do not show `connected: true` from hardcoded local arrays in production mode.
