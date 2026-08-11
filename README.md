# AdMatch Insights

AdMatch Insights is the frontend dashboard for THINC Intelligence OS.

It visualizes campaign reality, Meta attribution gaps, real CPA, operational funnel quality, and THINC decisions.

---

## Connected system role

| Component | Responsibility |
|---|---|
| `admatch-insights` | React/TanStack frontend dashboard |
| `thinc-v4` | THINC core engine and API |
| `services/api` in `thinc-v4` | FastAPI bridge between frontend and engine |

---

## Development setup

```bash
npm install
npm run dev
```

Expected frontend dev URL:

```text
http://localhost:5173
```

---

## THINC API setup

Run the backend from the `thinc-v4` repository:

```bash
python -m pip install -e '.[dev]'
uvicorn services.api.main:app --reload
```

Expected backend URL:

```text
http://localhost:8000
```

Create a `.env.local` file in this frontend repository:

```text
VITE_THINC_API_URL=http://localhost:8000
```

---

## Demo mode rule

Current campaign and integration data may be illustrative.

Any UI based on mock/static data must show:

```text
Demo Mode — numbers are illustrative and not connected to live accounts.
```

Do not present Meta, WhatsApp, Shopify, or shipping integrations as live unless the THINC API confirms a live status and last sync timestamp.

---

## Product direction

The first connected MVP is:

```text
THINC Campaign Analyzer v1
```

Flow:

```text
User enters campaign data
↓
AdMatch calls THINC API
↓
THINC returns Real CPA + profit + score + decision
↓
AdMatch displays Kill / Fix / Scale recommendation
```

---

## Main frontend modules

| Module | Purpose |
|---|---|
| Overview | Campaign reality summary |
| Campaigns | Meta CPA vs Real CPA comparison |
| Funnel | Lead → confirmed → delivered flow |
| Finance | Profitability and unit economics |
| Planner | Pre-launch product economics |
| Advisor | AI-assisted commercial advisor shell |
| Integrations | Demo/live connection status |

---

## Non-negotiable guardrails

- Do not duplicate THINC scoring logic in the frontend.
- Do not claim live integrations while using static arrays.
- Do not scale campaigns based only on Meta CPA.
- Use THINC API decisions as the source of truth for `KILL`, `FIX`, and `SCALE`.
