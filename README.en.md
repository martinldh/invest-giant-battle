# Invest Giant Battle — AI Investment Master Debate

<p>
  <img src="https://img.shields.io/badge/status-active-brightgreen" alt="Status">
  <img src="https://img.shields.io/badge/python-3.11+-blue" alt="Python">
  <img src="https://img.shields.io/badge/frontend-vanilla%20JS-orange" alt="Frontend">
  <img src="https://img.shields.io/badge/license-MIT-lightgrey" alt="License">
</p>

Let **12 legendary investment masters** hold real-time AI debates on any stock or ETF, generating bullish, bearish, and hold perspectives in a single view.

---

## What's New (v2.0.1)

| Feature | Description |
|---------|-------------|
| 🇭🇰 **HKEX Support** | Hong Kong stock codes (`0700.HK` / `09992`) and Chinese name lookup (e.g. `拼多多` → `PDD`) |
| 💾 **Debate Cache** | Auto-caches daily debate results after market close to reduce redundant API calls |
| 🔁 **Auto Retry** | Per-card timeout auto-retry with manual retry button for individual master opinions |
| 🛡️ **JSON Leak Protection** | Multi-layer frontend + backend filters preventing raw JSON payloads from reaching the UI |
| ❄️ **Cold Start Resilience** | Graceful degradation during Render cold starts without blocking page load |
| ⏱ **Performance Monitors** | Playwright-based perf checks & debate stream timing analysis scripts |

---

## Quick Start

```bash
# 1. Install dependencies
cd "Invest Giant Battle"
pip install -r requirements.txt

# 2. Configure environment
cp .env.example .env
# Edit .env with your API keys

# 3. Start backend (FastAPI)
python server.py    # http://localhost:8000

# 4. Start frontend (static file server)
python -m http.server 8080    # http://localhost:8080
```

---

## Usage

### Backend Status

The page header shows the live backend connection status:
- ✅ **Connected (AI Dynamic Mode)** — any stock/ETF code supported
- ⚠️ **Offline (Static Demo Mode)** — only 6 preset tickers available

### Start a Debate

1. Enter a ticker (`AAPL`, `TSLA`, `0700.HK`, or a Chinese name like `拼多多`)
2. Click **「Start Master Debate」**
3. Watch live price data load → 12 masters appear one by one
4. View the **Bullish / Bearish / Hold** three-row layout

### Per-Card Retry

If a master opinion times out, the card shows a **「Retry」** button. Click it to retry only that master without restarting the entire debate.

---

## Configuration

### Price Data Providers

Auto-fallback in priority order:

| Provider | Free Tier | API Key | Notes |
|---|---|---|---|
| `twelvedata` | 800 req/day | [Get key](https://twelvedata.com/pricing) | **Recommended**, most accurate |
| `alphavantage` | 25 req/day | [Get key](https://www.alphavantage.co/support/#api-key) | Global market coverage |
| `finnhub` | 60 req/min | [Get key](https://finnhub.io/register) | Fast response |
| `yahoo` | Unlimited | Not required | Fallback, rate-limited often |

Default provider is `twelvedata`; the `demo` key works for testing.

### Environment Variables

```env
# LLM API
OPENAI_API_KEY=sk-...
DEEPSEEK_API_KEY=sk-...

# Price data provider API keys
TWELVEDATA_API_KEY=demo
ALPHAVANTAGE_API_KEY=
FINNHUB_API_KEY=

# CORS (use * for development)
CORS_ORIGINS=*

# LLM retry (exponential backoff)
LLM_MAX_RETRIES=3
LLM_RETRY_BASE_DELAY=1.0

# Stock data cache TTL (seconds)
STOCK_CACHE_TTL_SECONDS=300
```

### HKEX Symbols

Hong Kong stocks accept two formats:
- **Suffix style**: `0700.HK`, `0005.HK`
- **Numeric only**: `09992` (auto-detected as HKEX)

Chinese names are mapped to their US tickers automatically (e.g. `拼多多` → `PDD`).

---

## Project Structure

```
Invest Giant Battle/
├── .env / .env.example       # Environment config
├── requirements.txt          # Python dependencies
│
├── server.py                 # FastAPI backend (debate cache, HKEX, health check)
├── masters.json              # Shared 12-master config (frontend + backend)
│
├── index.html                # Frontend entry
├── style.css                 # Styles
├── app.js                    # Frontend logic (retry, provider fallback, cache detection)
│
├── images/                   # Master avatars
│
├── perf_check_online.js      # [QA] Playwright perf check (DOM / API / debate stream)
├── perf_debate_breakdown.js  # [QA] Debate stream timing breakdown & event counts
└── verify_online_after_kimi.js # [QA] End-to-end functional verification script
```

---

## Performance QA Tools

Three Node.js scripts for production monitoring:

| Script | Purpose | Run |
|--------|---------|-----|
| `perf_check_online.js` | Playwright: page load time, health probe latency, debate stream TTFB & completion | `node perf_check_online.js` |
| `perf_debate_breakdown.js` | Raw SSE debate stream: event type counts & timing marks | `node perf_debate_breakdown.js` |
| `verify_online_after_kimi.js` | Playwright E2E: enter ticker → click debate → verify full flow | `node verify_online_after_kimi.js` |

> Requires: `npm install playwright`

---

## Tech Stack

- **Frontend**: HTML5 + CSS3 + Vanilla JavaScript
- **Backend**: FastAPI (Python 3.11+)
- **Price Data**: Twelve Data / Alpha Vantage / Finnhub / Yahoo Finance
- **AI Models**: OpenAI API / DeepSeek API (OpenAI-compatible)
- **Streaming**: Server-Sent Events (SSE)
- **QA**: Playwright

---

## Credits & Disclaimer

- Architecture reference: [virattt/ai-hedge-fund](https://github.com/virattt/ai-hedge-fund)
- Price data: [Twelve Data](https://twelvedata.com/) / [Alpha Vantage](https://www.alphavantage.co/) / [Finnhub](https://finnhub.io/) / [Yahoo Finance](https://finance.yahoo.com/)

**This tool is for educational and reference purposes only. It does not constitute investment advice.**
