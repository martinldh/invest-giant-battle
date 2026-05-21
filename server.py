# ============================================
# 大师擂台 - 后端服务
# AI Investment Master Debate Backend
# ============================================

import os
import json
import ast
import asyncio
import httpx
import logging
import time
import html
import re
from pathlib import Path
from datetime import datetime
from zoneinfo import ZoneInfo
from dotenv import load_dotenv

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

load_dotenv()

# 配置日志
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="大师擂台 API", version="1.0.0")

# CORS - 可通过环境变量配置，默认允许所有来源
CORS_ORIGINS = os.getenv("CORS_ORIGINS", "*")
if CORS_ORIGINS == "*":
    allow_origins = ["*"]
else:
    allow_origins = [origin.strip() for origin in CORS_ORIGINS.split(",")]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allow_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================
# Configuration
# ============================================
LLM_PROVIDER = os.getenv("LLM_PROVIDER", "openai")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
OPENAI_BASE_URL = os.getenv("OPENAI_BASE_URL", "https://api.openai.com/v1")
LLM_MODEL = os.getenv("LLM_MODEL", "gpt-4o-mini")

# Stock data provider configuration
# Priority: twelvedata > alphavantage > finnhub > yahoo (fallback)
STOCK_DATA_PROVIDER = os.getenv("STOCK_DATA_PROVIDER", "twelvedata")
TWELVE_DATA_API_KEY = os.getenv("TWELVE_DATA_API_KEY", "demo")
ALPHA_VANTAGE_API_KEY = os.getenv("ALPHA_VANTAGE_API_KEY", "")
FINNHUB_API_KEY = os.getenv("FINNHUB_API_KEY", "")

# LLM retry configuration
LLM_MAX_RETRIES = int(os.getenv("LLM_MAX_RETRIES", "3"))
LLM_RETRY_BASE_DELAY = float(os.getenv("LLM_RETRY_BASE_DELAY", "1.0"))

# Stock cache configuration
STOCK_CACHE_TTL_SECONDS = int(os.getenv("STOCK_CACHE_TTL_SECONDS", "300"))
STOCK_CACHE: dict[str, tuple[float, dict]] = {}

# Debate cache configuration (post-close daily cache for selected symbols)
DEBATE_CACHE_PATH = Path(__file__).with_name("debate_cache.json")
DEBATE_CACHE_SYMBOLS = {
    "AAPL", "MSFT", "NVDA", "GOOGL", "TSLA", "AMZN",
    "ACWI", "FTEC", "QQQ", "UVXY",
}
MARKET_TZ = ZoneInfo("America/New_York")
MARKET_CLOSE_HOUR = int(os.getenv("MARKET_CLOSE_HOUR", "16"))
MARKET_CLOSE_MINUTE = int(os.getenv("MARKET_CLOSE_MINUTE", "10"))
DEBATE_CACHE_LOCK = asyncio.Lock()

# ============================================
# Master Agent Definitions
# ============================================
MASTER_CONFIG_PATH = Path(__file__).with_name("masters.json")


def load_masters() -> list[dict]:
    """Load shared master configuration used by both backend and frontend."""
    with MASTER_CONFIG_PATH.open("r", encoding="utf-8") as f:
        masters = json.load(f)

    required = {"id", "name", "title", "school", "school_label", "system_prompt"}
    for master in masters:
        missing = required - set(master)
        if missing:
            raise RuntimeError(f"Master config {master.get('id', '<unknown>')} missing fields: {sorted(missing)}")
    return masters


MASTERS = load_masters()


def load_debate_cache() -> dict:
    """Load persisted debate cache from disk."""
    if not DEBATE_CACHE_PATH.exists():
        return {}
    try:
        with DEBATE_CACHE_PATH.open("r", encoding="utf-8") as f:
            data = json.load(f)
            return data if isinstance(data, dict) else {}
    except Exception as e:
        logger.warning(f"Failed to load debate cache: {e}")
        return {}


DEBATE_CACHE = load_debate_cache()


def save_debate_cache() -> None:
    """Persist debate cache to disk."""
    try:
        with DEBATE_CACHE_PATH.open("w", encoding="utf-8") as f:
            json.dump(DEBATE_CACHE, f, ensure_ascii=False, indent=2)
    except Exception as e:
        logger.warning(f"Failed to save debate cache: {e}")


def is_post_close_market_snapshot(stock_data: dict) -> bool:
    """
    Decide whether the current market snapshot is at/after close in US market time.
    - If data date is before NY today, it's a closed day snapshot.
    - If data date is NY today, only cache after MARKET_CLOSE_HOUR:MARKET_CLOSE_MINUTE.
    """
    last_updated = str(stock_data.get("last_updated", "")).strip()
    if not last_updated:
        return False
    try:
        data_date = datetime.strptime(last_updated, "%Y-%m-%d").date()
    except ValueError:
        return False

    now_ny = datetime.now(MARKET_TZ)
    today_ny = now_ny.date()
    if data_date < today_ny:
        return True
    if data_date > today_ny:
        return False

    close_reached = (now_ny.hour, now_ny.minute) >= (MARKET_CLOSE_HOUR, MARKET_CLOSE_MINUTE)
    return close_reached


def build_debate_cache_key(ticker: str, stock_data: dict) -> str | None:
    """Build per-symbol, per-trading-day cache key for debate output."""
    symbol = ticker.strip().upper()
    if symbol not in DEBATE_CACHE_SYMBOLS:
        return None
    trade_day = str(stock_data.get("last_updated", "")).strip()
    if not trade_day:
        return None
    if not is_post_close_market_snapshot(stock_data):
        return None
    return f"{symbol}:{trade_day}"


# ============================================
# Stock Data Providers
# ============================================
async def fetch_stock_data(ticker: str) -> dict:
    """Fetch stock data with a short in-memory cache to protect free API quotas."""
    normalized = ticker.strip().upper()
    now = time.monotonic()
    cached = STOCK_CACHE.get(normalized)
    if cached and now - cached[0] < STOCK_CACHE_TTL_SECONDS:
        data = dict(cached[1])
        data["cache_status"] = "hit"
        return data

    data = await fetch_stock_data_uncached(normalized)
    data["cache_status"] = "miss"
    STOCK_CACHE[normalized] = (now, dict(data))
    return data


async def fetch_stock_data_uncached(ticker: str) -> dict:
    """Fetch real-time stock data with multi-provider fallback support."""
    provider = STOCK_DATA_PROVIDER.lower()
    last_error = None

    provider_chain: list[tuple[str, callable, bool]] = [
        ("twelvedata", fetch_twelve_data, True),
        ("alphavantage", fetch_alphavantage, bool(ALPHA_VANTAGE_API_KEY)),
        ("finnhub", fetch_finnhub, bool(FINNHUB_API_KEY)),
        ("yahoo", fetch_yahoo_finance, True),
    ]

    preferred_index = next((i for i, (name, _, _) in enumerate(provider_chain) if name == provider), 0)
    ordered_chain = provider_chain[preferred_index:] + provider_chain[:preferred_index]

    for name, fn, enabled in ordered_chain:
        if not enabled:
            logger.info(f"Skip provider {name} for {ticker}: missing API key")
            continue
        try:
            provider_symbol = to_provider_symbol(ticker, name)
            return await fn(ticker, provider_symbol)
        except Exception as e:
            last_error = e
            logger.warning(f"{name} failed for {ticker}: {e}, trying next provider")

    logger.warning(f"All providers failed for {ticker}: {last_error}, using fallback data")
    return get_fallback_stock_data(ticker)


def to_provider_symbol(ticker: str, provider: str) -> str:
    """Convert internal ticker format to provider-specific symbol format."""
    normalized = ticker.strip().upper()
    hk_match = re.fullmatch(r"(\d{4,5}):(HKEX|XHKG)", normalized)
    if not hk_match:
        return normalized

    hk_code = hk_match.group(1)
    if provider in {"twelvedata", "yahoo", "alphavantage", "finnhub"}:
        return f"{hk_code}.HK"
    return normalized


def get_company_name_fallback(ticker: str) -> str:
    hk_name_map = {
        "0700:HKEX": "Tencent Holdings Ltd",
        "9988:HKEX": "Alibaba Group Holding Ltd",
        "09992:HKEX": "Pop Mart International Group Ltd",
    }
    normalized = ticker.strip().upper()
    return hk_name_map.get(normalized, f"{normalized} Corporation")


async def fetch_twelve_data(ticker: str, provider_symbol: str) -> dict:
    """Fetch stock data from Twelve Data API (free tier: 800 requests/day)."""
    async with httpx.AsyncClient(timeout=15.0) as client:
        # Get current quote
        quote_url = f"https://api.twelvedata.com/quote?symbol={provider_symbol}&apikey={TWELVE_DATA_API_KEY}"
        resp = await client.get(quote_url)
        resp.raise_for_status()
        quote = resp.json()
        
        if "code" in quote and quote["code"] != 200:
            raise Exception(f"Twelve Data error: {quote.get('message', 'Unknown error')}")
        
        if not quote.get("close"):
            raise Exception(f"Twelve Data: No data for {provider_symbol}")
        
        current_price = float(quote["close"])
        prev_close = float(quote.get("previous_close", current_price))
        day_high = float(quote.get("high", current_price))
        day_low = float(quote.get("low", current_price))
        volume = int(quote.get("volume", 0))
        
        # Get time series for historical data
        ts_url = f"https://api.twelvedata.com/time_series?symbol={provider_symbol}&interval=1day&outputsize=260&apikey={TWELVE_DATA_API_KEY}"
        resp = await client.get(ts_url)
        resp.raise_for_status()
        ts_data = resp.json()
        
        values = ts_data.get("values", [])
        closes = [float(v["close"]) for v in values if v.get("close")]
        
        month_ago_price = closes[21] if len(closes) > 21 else (closes[0] if closes else current_price)
        three_month_price = closes[62] if len(closes) > 62 else (closes[0] if closes else current_price)
        year_ago_price = closes[-1] if len(closes) > 1 else (closes[0] if closes else current_price)
        
        fifty_two_week = quote.get("fifty_two_week", {})
        fifty_two_week_high = float(fifty_two_week.get("high", max(closes) if closes else current_price * 1.2))
        fifty_two_week_low = float(fifty_two_week.get("low", min(closes) if closes else current_price * 0.8))
        
        return {
            "ticker": ticker.upper(),
            "name": quote.get("name", get_company_name_fallback(ticker)),
            "exchange": quote.get("exchange", "US Market"),
            "currency": quote.get("currency", "USD"),
            "logo": COMPANY_LOGOS.get(ticker.upper(), ""),
            "current_price": round(current_price, 2),
            "prev_close": round(prev_close, 2),
            "day_change": round(current_price - prev_close, 2),
            "day_change_pct": round(float(quote.get("percent_change", 0)), 2),
            "month_ago_price": round(month_ago_price, 2),
            "month_change_pct": round((current_price - month_ago_price) / month_ago_price * 100, 2) if month_ago_price else 0,
            "three_month_ago_price": round(three_month_price, 2),
            "three_month_change_pct": round((current_price - three_month_price) / three_month_price * 100, 2) if three_month_price else 0,
            "year_ago_price": round(year_ago_price, 2),
            "year_change_pct": round((current_price - year_ago_price) / year_ago_price * 100, 2) if year_ago_price else 0,
            "day_high": round(day_high, 2),
            "day_low": round(day_low, 2),
            "volume": volume,
            "fifty_two_week_high": round(fifty_two_week_high, 2),
            "fifty_two_week_low": round(fifty_two_week_low, 2),
            "market_cap": 0,
            "last_updated": quote.get("datetime", datetime.now().strftime("%Y-%m-%d")),
        }


async def fetch_yahoo_finance(ticker: str, provider_symbol: str) -> dict:
    """Fetch stock data from Yahoo Finance API."""
    urls = [
        f"https://query1.finance.yahoo.com/v8/finance/chart/{provider_symbol}?range=1y&interval=1d",
        f"https://query2.finance.yahoo.com/v8/finance/chart/{provider_symbol}?range=1y&interval=1d",
        f"https://query1.finance.yahoo.com/v10/finance/chart/{provider_symbol}?range=1y&interval=1d",
    ]
    
    last_error = None
    
    for url in urls:
        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                headers = {
                    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Accept': 'application/json',
                    'Accept-Language': 'en-US,en;q=0.9',
                    'Origin': 'https://finance.yahoo.com',
                    'Referer': 'https://finance.yahoo.com/',
                }
                resp = await client.get(url, headers=headers, follow_redirects=True)
                
                if resp.status_code == 429:
                    last_error = "Yahoo Finance API rate limit exceeded"
                    await asyncio.sleep(3)
                    continue
                
                if resp.status_code == 403:
                    last_error = "Yahoo Finance API access forbidden"
                    await asyncio.sleep(1)
                    continue
                    
                resp.raise_for_status()
                data = resp.json()
                
                if not data.get("chart", {}).get("result"):
                    last_error = f"No data found for ticker: {provider_symbol}"
                    continue
                    
                result = data["chart"]["result"][0]
                meta = result["meta"]
                quotes = result["indicators"]["quote"][0]
                closes = [c for c in quotes["close"] if c is not None]
                
                current_price = meta["regularMarketPrice"]
                prev_close = meta.get("chartPreviousClose", meta.get("previousClose", current_price))
                
                month_ago_price = closes[max(0, len(closes) - 22)] if len(closes) >= 22 else closes[0]
                three_month_price = closes[max(0, len(closes) - 63)] if len(closes) >= 63 else closes[0]
                year_ago_price = closes[0] if closes else current_price
                
                return {
                    "ticker": ticker,
                    "name": meta.get("shortName", get_company_name_fallback(ticker)),
                    "exchange": meta.get("fullExchangeName", ""),
                    "currency": meta.get("currency", "USD"),
                    "logo": COMPANY_LOGOS.get(ticker.upper(), ""),
                    "current_price": round(current_price, 2),
                    "prev_close": round(prev_close, 2),
                    "day_change": round(current_price - prev_close, 2),
                    "day_change_pct": round((current_price - prev_close) / prev_close * 100, 2) if prev_close else 0,
                    "month_ago_price": round(month_ago_price, 2),
                    "month_change_pct": round((current_price - month_ago_price) / month_ago_price * 100, 2) if month_ago_price else 0,
                    "three_month_ago_price": round(three_month_price, 2),
                    "three_month_change_pct": round((current_price - three_month_price) / three_month_price * 100, 2) if three_month_price else 0,
                    "year_ago_price": round(year_ago_price, 2),
                    "year_change_pct": round((current_price - year_ago_price) / year_ago_price * 100, 2) if year_ago_price else 0,
                    "day_high": round(meta.get("regularMarketDayHigh", current_price), 2),
                    "day_low": round(meta.get("regularMarketDayLow", current_price), 2),
                    "volume": meta.get("regularMarketVolume", 0),
                    "fifty_two_week_high": round(meta.get("fiftyTwoWeekHigh", current_price), 2),
                    "fifty_two_week_low": round(meta.get("fiftyTwoWeekLow", current_price), 2),
                    "market_cap": meta.get("regularMarketPrice", 0) * meta.get("regularMarketVolume", 0),
                    "last_updated": datetime.fromtimestamp(meta.get("regularMarketTime", int(datetime.now().timestamp()))).strftime("%Y-%m-%d"),
                }
                
        except httpx.HTTPStatusError as e:
            last_error = f"HTTP error: {e.response.status_code}"
            await asyncio.sleep(1)
        except Exception as e:
            last_error = str(e)
            await asyncio.sleep(1)
    
    raise Exception(f"Yahoo Finance failed: {last_error}")


async def fetch_alphavantage(ticker: str, provider_symbol: str) -> dict:
    """Fetch stock data from Alpha Vantage API (free tier: 25 requests/day)."""
    async with httpx.AsyncClient(timeout=15.0) as client:
        # Get quote endpoint for current price
        quote_url = f"https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol={provider_symbol}&apikey={ALPHA_VANTAGE_API_KEY}"
        resp = await client.get(quote_url)
        resp.raise_for_status()
        quote_data = resp.json()
        
        if "Global Quote" not in quote_data or not quote_data["Global Quote"]:
            raise Exception(f"Alpha Vantage: No data for {provider_symbol}")
        
        quote = quote_data["Global Quote"]
        current_price = float(quote.get("05. price", 0))
        prev_close = float(quote.get("08. previous close", current_price))
        
        # Get daily data for historical prices
        daily_url = f"https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol={provider_symbol}&outputsize=compact&apikey={ALPHA_VANTAGE_API_KEY}"
        resp = await client.get(daily_url)
        resp.raise_for_status()
        daily_data = resp.json()
        
        time_series = daily_data.get("Time Series (Daily)", {})
        dates = sorted(time_series.keys(), reverse=True)
        
        month_ago_price = current_price
        three_month_price = current_price
        year_ago_price = current_price
        
        if len(dates) >= 22:
            month_ago_price = float(time_series[dates[21]]["4. close"])
        if len(dates) >= 63:
            three_month_price = float(time_series[dates[62]]["4. close"])
        if len(dates) >= 252:
            year_ago_price = float(time_series[dates[251]]["4. close"])
        
        day_high = float(quote.get("03. high", current_price))
        day_low = float(quote.get("04. low", current_price))
        volume = int(quote.get("06. volume", 0))
        
        return {
            "ticker": ticker,
            "name": get_company_name_fallback(ticker),
            "exchange": "US Market",
            "currency": "USD",
            "current_price": round(current_price, 2),
            "prev_close": round(prev_close, 2),
            "day_change": round(current_price - prev_close, 2),
            "day_change_pct": round((current_price - prev_close) / prev_close * 100, 2) if prev_close else 0,
            "month_ago_price": round(month_ago_price, 2),
            "month_change_pct": round((current_price - month_ago_price) / month_ago_price * 100, 2) if month_ago_price else 0,
            "three_month_ago_price": round(three_month_price, 2),
            "three_month_change_pct": round((current_price - three_month_price) / three_month_price * 100, 2) if three_month_price else 0,
            "year_ago_price": round(year_ago_price, 2),
            "year_change_pct": round((current_price - year_ago_price) / year_ago_price * 100, 2) if year_ago_price else 0,
            "day_high": round(day_high, 2),
            "day_low": round(day_low, 2),
            "volume": volume,
            "fifty_two_week_high": round(current_price * 1.2, 2),
            "fifty_two_week_low": round(current_price * 0.8, 2),
            "market_cap": 0,
            "last_updated": datetime.now().strftime("%Y-%m-%d"),
        }


async def fetch_finnhub(ticker: str, provider_symbol: str) -> dict:
    """Fetch stock data from Finnhub API (free tier: 60 requests/minute)."""
    async with httpx.AsyncClient(timeout=15.0) as client:
        # Get current quote
        quote_url = f"https://finnhub.io/api/v1/quote?symbol={provider_symbol}&token={FINNHUB_API_KEY}"
        resp = await client.get(quote_url)
        resp.raise_for_status()
        quote = resp.json()
        
        if not quote or quote.get("c") == 0:
            raise Exception(f"Finnhub: No data for {provider_symbol}")
        
        current_price = quote.get("c", 0)
        prev_close = quote.get("pc", current_price)
        day_high = quote.get("h", current_price)
        day_low = quote.get("l", current_price)
        
        # Get candle data for historical prices
        end_time = int(datetime.now().timestamp())
        start_time = end_time - (365 * 24 * 60 * 60)  # 1 year ago
        candle_url = f"https://finnhub.io/api/v1/stock/candle?symbol={provider_symbol}&resolution=D&from={start_time}&to={end_time}&token={FINNHUB_API_KEY}"
        resp = await client.get(candle_url)
        resp.raise_for_status()
        candle = resp.json()
        
        closes = candle.get("c", [])
        closes = [c for c in closes if c > 0]
        
        month_ago_price = closes[max(0, len(closes) - 22)] if len(closes) >= 22 else (closes[0] if closes else current_price)
        three_month_price = closes[max(0, len(closes) - 63)] if len(closes) >= 63 else (closes[0] if closes else current_price)
        year_ago_price = closes[0] if closes else current_price
        
        return {
            "ticker": ticker,
            "name": get_company_name_fallback(ticker),
            "exchange": "US Market",
            "currency": "USD",
            "current_price": round(current_price, 2),
            "prev_close": round(prev_close, 2),
            "day_change": round(current_price - prev_close, 2),
            "day_change_pct": round((current_price - prev_close) / prev_close * 100, 2) if prev_close else 0,
            "month_ago_price": round(month_ago_price, 2),
            "month_change_pct": round((current_price - month_ago_price) / month_ago_price * 100, 2) if month_ago_price else 0,
            "three_month_ago_price": round(three_month_price, 2),
            "three_month_change_pct": round((current_price - three_month_price) / three_month_price * 100, 2) if three_month_price else 0,
            "year_ago_price": round(year_ago_price, 2),
            "year_change_pct": round((current_price - year_ago_price) / year_ago_price * 100, 2) if year_ago_price else 0,
            "day_high": round(day_high, 2),
            "day_low": round(day_low, 2),
            "volume": 0,
            "fifty_two_week_high": round(max(closes) if closes else current_price * 1.2, 2),
            "fifty_two_week_low": round(min(closes) if closes else current_price * 0.8, 2),
            "market_cap": 0,
            "last_updated": datetime.now().strftime("%Y-%m-%d"),
        }


def get_fallback_stock_data(ticker: str) -> dict:
    """Generate fallback stock data when all APIs are unavailable."""
    import random
    
    base_prices = {
        'AAPL': 190.0, 'MSFT': 420.0, 'GOOGL': 175.0, 'AMZN': 185.0,
        'TSLA': 250.0, 'NVDA': 890.0, 'META': 510.0, 'NFLX': 630.0,
    }
    
    base_price = base_prices.get(ticker.upper(), 100.0)
    current_price = round(base_price * (1 + random.uniform(-0.05, 0.05)), 2)
    prev_close = round(base_price * (1 + random.uniform(-0.03, 0.03)), 2)
    
    day_change = round(current_price - prev_close, 2)
    day_change_pct = round(day_change / prev_close * 100, 2) if prev_close else 0
    
    normalized = ticker.upper()
    is_hk = bool(re.fullmatch(r"\d{4,5}:(HKEX|XHKG)", normalized))
    return {
        "ticker": normalized,
        "name": get_company_name_fallback(normalized),
        "exchange": "HKEX" if is_hk else "NASDAQ",
        "currency": "HKD" if is_hk else "USD",
        "current_price": current_price,
        "prev_close": prev_close,
        "day_change": day_change,
        "day_change_pct": day_change_pct,
        "month_ago_price": round(current_price * (1 - random.uniform(-0.1, 0.1)), 2),
        "month_change_pct": round(random.uniform(-10, 10), 2),
        "three_month_ago_price": round(current_price * (1 - random.uniform(-0.15, 0.15)), 2),
        "three_month_change_pct": round(random.uniform(-15, 15), 2),
        "year_ago_price": round(current_price * (1 - random.uniform(-0.3, 0.3)), 2),
        "year_change_pct": round(random.uniform(-30, 30), 2),
        "day_high": round(current_price * 1.02, 2),
        "day_low": round(current_price * 0.98, 2),
        "volume": random.randint(10000000, 100000000),
        "fifty_two_week_high": round(current_price * 1.2, 2),
        "fifty_two_week_low": round(current_price * 0.8, 2),
        "market_cap": round(current_price * random.randint(1000000000, 5000000000), 2),
        "last_updated": datetime.now().strftime("%Y-%m-%d"),
        "is_fallback": True,
    }


# ============================================
# LLM Integration with Retry
# ============================================
async def call_llm_stream(system_prompt: str, user_prompt: str):
    """Stream LLM response chunks with exponential backoff retry."""
    from openai import AsyncOpenAI

    last_error = None
    for attempt in range(LLM_MAX_RETRIES):
        try:
            client = AsyncOpenAI(
                api_key=OPENAI_API_KEY,
                base_url=OPENAI_BASE_URL,
                timeout=30.0,
            )

            stream = await client.chat.completions.create(
                model=LLM_MODEL,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
                temperature=0.6,
                max_tokens=260,
                stream=True,
            )

            async for chunk in stream:
                if chunk.choices and chunk.choices[0].delta.content:
                    yield chunk.choices[0].delta.content
            return  # Success, exit the retry loop

        except Exception as e:
            last_error = str(e)
            if attempt < LLM_MAX_RETRIES - 1:
                delay = LLM_RETRY_BASE_DELAY * (2 ** attempt)
                logger.warning(f"LLM call failed (attempt {attempt + 1}/{LLM_MAX_RETRIES}): {e}. Retrying in {delay}s...")
                await asyncio.sleep(delay)
            else:
                logger.error(f"LLM call failed after {LLM_MAX_RETRIES} attempts: {e}")
                raise Exception(f"LLM 调用失败（已重试 {LLM_MAX_RETRIES} 次）: {last_error}")


def build_market_context(stock_data: dict) -> str:
    """Build market data context string for LLM prompt."""
    direction = "上涨" if stock_data["day_change"] >= 0 else "下跌"
    month_trend = "上涨" if stock_data["month_change_pct"] >= 0 else "下跌"
    year_trend = "上涨" if stock_data["year_change_pct"] >= 0 else "下跌"

    return f"""=== {stock_data['ticker']} 实时市场数据 ===
公司名称：{stock_data['name']}
交易所：{stock_data['exchange']}
当前股价：{stock_data['currency']} {stock_data['current_price']}
今日变动：{direction} {abs(stock_data['day_change_pct'])}%（前收盘 {stock_data['prev_close']}）
近1个月涨跌：{month_trend} {abs(stock_data['month_change_pct'])}%
近3个月涨跌：{'上涨' if stock_data['three_month_change_pct'] >= 0 else '下跌'} {abs(stock_data['three_month_change_pct'])}%
近1年涨跌（同比）：{year_trend} {abs(stock_data['year_change_pct'])}%
今日最高/最低：{stock_data['day_high']} / {stock_data['day_low']}
成交量：{stock_data['volume']:,}
52周最高/最低：{stock_data['fifty_two_week_high']} / {stock_data['fifty_two_week_low']}
数据日期：{stock_data['last_updated']}"""


def build_debate_prompt(master: dict, stock_data: dict, other_masters: list) -> str:
    """Build the debate prompt for a specific master."""
    others_str = "、".join([m["name"] for m in other_masters if m["id"] != master["id"]])
    if not others_str:
        others_str = "其他投资大师"

    return f"""分析 {stock_data['ticker']}（{stock_data['name']}）。

{build_market_context(stock_data)}

要求：
1. 用2-3句话阐述核心论据，引用具体数据（如当前股价、涨跌幅等）
2. 重点强调的部分用**加粗**标记
3. 适当使用专业术语（如护城河、安全边际、自由现金流、DCF等）
4. 符合你的投资风格，使用中文
5. opinion 控制在150字以内
6. stance 必须严格取 bullish、bearish、neutral 之一

反驳对象必须从这些大师中选择一位：{others_str}

只返回一个 JSON 对象，不要返回 Markdown 代码块，不要添加解释文字。格式如下：
{{
  "stance": "bullish",
  "opinion": "你的核心观点",
  "rebuttal_target": "对方大师名字",
  "rebuttal": "一句话反驳"
}}"""


# ============================================
# API Endpoints
# ============================================
class DebateRequest(BaseModel):
    ticker: str


class MasterDebateRequest(BaseModel):
    ticker: str
    master_id: str


def normalize_ticker(ticker: str) -> str:
    """Validate and normalize public ticker input."""
    normalized = ticker.strip().upper()

    # Hong Kong stocks: allow shorthand like 0700 / 0700.HK
    if re.fullmatch(r"\d{4,5}", normalized):
        normalized = f"{normalized}:HKEX"
    elif re.fullmatch(r"\d{4,5}\.HK", normalized):
        normalized = normalized.replace(".HK", ":HKEX")

    # Allow exchange-qualified symbols (e.g., 0700:HKEX, 0005:XHKG)
    if not re.fullmatch(r"[A-Z0-9.:-]{1,20}", normalized):
        raise HTTPException(status_code=400, detail="标的代码格式不正确")
    return normalized


@app.get("/api/stock/{ticker}")
async def get_stock_data(ticker: str):
    """Get real-time stock data from configured provider."""
    try:
        data = await fetch_stock_data(normalize_ticker(ticker))
        return {"success": True, "data": data}
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=f"获取股价数据失败: {str(e)}")


@app.post("/api/debate")
async def start_debate(request: DebateRequest):
    """Start a debate and stream master opinions via SSE."""
    ticker = normalize_ticker(request.ticker)

    try:
        stock_data = await fetch_stock_data(ticker)
    except Exception as e:
        error_msg = json.dumps({"type": "error", "message": f"获取股价数据失败: {str(e)}"}, ensure_ascii=False)
        return StreamingResponse(iter([error_msg]), media_type="text/event-stream")

    cache_key = build_debate_cache_key(ticker, stock_data)
    if cache_key:
        cached = DEBATE_CACHE.get(cache_key)
        if isinstance(cached, dict):
            cached_entries = cached.get("entries", [])
            if isinstance(cached_entries, list) and cached_entries:
                async def cached_stream():
                    yield json.dumps({"type": "stock_data", "data": stock_data}, ensure_ascii=False) + "\n"
                    yield json.dumps({"type": "generating", "message": "已命中收盘缓存，正在快速加载大师观点..."}, ensure_ascii=False) + "\n"
                    total = len(cached_entries)
                    for idx, entry in enumerate(cached_entries, start=1):
                        yield json.dumps({"type": "progress", "generated": idx, "total": total}, ensure_ascii=False) + "\n"
                        yield json.dumps(entry, ensure_ascii=False) + "\n"
                    yield json.dumps({"type": "done"}, ensure_ascii=False) + "\n"
                return StreamingResponse(cached_stream(), media_type="text/event-stream")

    async def event_stream():
        yield json.dumps({"type": "stock_data", "data": stock_data}, ensure_ascii=False) + "\n"
        yield json.dumps({"type": "generating", "message": "正在生成 12 位大师观点..."}, ensure_ascii=False) + "\n"

        # Limit concurrency to avoid API throttling (429 errors)
        # Increased to 4 for faster generation
        semaphore = asyncio.Semaphore(4)
        
        async def limited_generate(master, prompt):
            async with semaphore:
                return await generate_master_opinion(master, prompt)

        streamed_count = 0
        total = len(MASTERS)
        generated_entries = []

        # Create tasks for all masters with concurrency limit
        all_tasks = []
        for master in MASTERS:
            prompt = build_debate_prompt(master, stock_data, MASTERS)
            all_tasks.append(limited_generate(master, prompt))

        # Process results as they complete
        for coro in asyncio.as_completed(all_tasks):
            result = await coro

            # Update progress
            streamed_count += 1
            yield json.dumps({"type": "progress", "generated": streamed_count, "total": total}, ensure_ascii=False) + "\n"

            # Stream each completed opinion immediately for real-time UX.
            yield json.dumps(result, ensure_ascii=False) + "\n"
            generated_entries.append(result)

        yield json.dumps({"type": "done"}, ensure_ascii=False) + "\n"

        if cache_key and generated_entries:
            async with DEBATE_CACHE_LOCK:
                DEBATE_CACHE[cache_key] = {
                    "ticker": ticker,
                    "trade_day": str(stock_data.get("last_updated", "")),
                    "created_at": datetime.now(MARKET_TZ).isoformat(),
                    "entries": generated_entries,
                }
                # Keep cache bounded for simplicity.
                if len(DEBATE_CACHE) > 120:
                    ordered = sorted(
                        DEBATE_CACHE.items(),
                        key=lambda kv: kv[1].get("created_at", ""),
                        reverse=True,
                    )
                    trimmed = dict(ordered[:120])
                    DEBATE_CACHE.clear()
                    DEBATE_CACHE.update(trimmed)
                save_debate_cache()

    return StreamingResponse(event_stream(), media_type="text/event-stream")


@app.post("/api/debate/master")
async def regenerate_master_opinion(request: MasterDebateRequest):
    """Regenerate one master's opinion for the given ticker."""
    ticker = normalize_ticker(request.ticker)
    master_id = (request.master_id or "").strip().lower()
    master = next((m for m in MASTERS if m["id"] == master_id), None)
    if not master:
        raise HTTPException(status_code=400, detail="大师ID无效")

    stock_data = await fetch_stock_data(ticker)
    prompt = build_debate_prompt(master, stock_data, MASTERS)
    result = await generate_master_opinion(master, prompt)
    return {"success": True, "data": result}


async def generate_master_opinion(master: dict, prompt: str) -> dict:
    """Generate a single master's structured opinion via LLM with retry."""
    try:
        full_text = ""
        async for chunk in call_llm_stream(master["system_prompt"], prompt):
            full_text += chunk

        payload = parse_llm_payload(full_text)
        stance = normalize_stance(payload.get("stance"), payload.get("opinion", full_text))
        opinion_html = build_safe_opinion_html(payload.get("opinion", full_text))
        rebuttal_html = build_safe_opinion_html(payload.get("rebuttal", ""))
        rebuttal_target = sanitize_plain_text(payload.get("rebuttal_target", ""))

        return {
            "type": "master_opinion",
            "master_id": master["id"],
            "master_name": master["name"],
            "school": master["school"],
            "school_label": master["school_label"],
            "stance": stance,
            "opinion": opinion_html,
            "rebuttal": {
                "target": rebuttal_target,
                "text": rebuttal_html,
            } if rebuttal_target and rebuttal_html else None,
        }
    except Exception as e:
        return {
            "type": "master_opinion",
            "master_id": master["id"],
            "master_name": master["name"],
            "school": master["school"],
            "school_label": master["school_label"],
            "stance": "neutral",
            "opinion": build_safe_opinion_html(f"（分析生成失败：{str(e)}）"),
            "rebuttal": None,
            "error": True,
        }


def parse_llm_payload(text: str) -> dict:
    """Parse the model's JSON payload, with a defensive fallback for malformed output."""
    cleaned = text.strip()
    if cleaned.startswith("```"):
        cleaned = cleaned.strip("`")
        if cleaned.lower().startswith("json"):
            cleaned = cleaned[4:].strip()

    try:
        payload = json.loads(cleaned)
    except json.JSONDecodeError:
        payload = _extract_first_json_object(cleaned)
        if payload is None:
            payload = {"stance": None, "opinion": cleaned, "rebuttal_target": "", "rebuttal": ""}

    if not isinstance(payload, dict):
        return {"stance": None, "opinion": cleaned, "rebuttal_target": "", "rebuttal": ""}
    return _normalize_payload(payload, cleaned)


def _extract_first_json_object(text: str):
    """Try to parse the first valid JSON object found in text."""
    if "{" not in text:
        return None

    length = len(text)
    for start in range(length):
        if text[start] != "{":
            continue
        depth = 0
        in_string = False
        escape = False
        for end in range(start, length):
            ch = text[end]
            if in_string:
                if escape:
                    escape = False
                elif ch == "\\":
                    escape = True
                elif ch == '"':
                    in_string = False
                continue

            if ch == '"':
                in_string = True
                continue
            if ch == "{":
                depth += 1
            elif ch == "}":
                depth -= 1
                if depth == 0:
                    candidate = text[start:end + 1]
                    try:
                        obj = json.loads(candidate)
                        if isinstance(obj, dict):
                            return obj
                    except json.JSONDecodeError:
                        # Some models return Python-dict-like strings with single quotes.
                        try:
                            obj = ast.literal_eval(candidate)
                            if isinstance(obj, dict):
                                return obj
                        except Exception:
                            pass
                    break
    return None


def _normalize_payload(payload: dict, fallback_text: str) -> dict:
    """Coerce model payload into expected shape and avoid raw JSON leaks."""
    out = {
        "stance": payload.get("stance"),
        "opinion": payload.get("opinion"),
        "rebuttal_target": payload.get("rebuttal_target"),
        "rebuttal": payload.get("rebuttal"),
    }

    if not isinstance(out["opinion"], str) or not out["opinion"].strip():
        out["opinion"] = fallback_text
    if not isinstance(out["rebuttal_target"], str):
        out["rebuttal_target"] = ""
    if not isinstance(out["rebuttal"], str):
        out["rebuttal"] = ""

    # Some models return a JSON string inside "opinion". Try one more parse.
    opinion_candidate = out["opinion"].strip()
    if opinion_candidate.startswith("{") and opinion_candidate.endswith("}"):
        nested = _extract_first_json_object(opinion_candidate)
        if isinstance(nested, dict):
            nested_opinion = nested.get("opinion")
            if isinstance(nested_opinion, str) and nested_opinion.strip():
                out["opinion"] = nested_opinion
            nested_target = nested.get("rebuttal_target")
            if isinstance(nested_target, str) and nested_target.strip() and not out["rebuttal_target"]:
                out["rebuttal_target"] = nested_target
            nested_rebuttal = nested.get("rebuttal")
            if isinstance(nested_rebuttal, str) and nested_rebuttal.strip() and not out["rebuttal"]:
                out["rebuttal"] = nested_rebuttal
    return out


def normalize_stance(stance, fallback_text: str = "") -> str:
    """Normalize structured stance, falling back to keyword parsing only for malformed output."""
    if isinstance(stance, str):
        value = stance.strip().lower()
        if value in {"bullish", "bearish", "neutral"}:
            return value

    text_lower = str(fallback_text).lower()
    bullish_keywords = ["看多", "看涨", "强烈看多", "积极", "乐观", "建议买入", "值得买入", "bullish"]
    bearish_keywords = ["看空", "看跌", "强烈看空", "悲观", "建议卖出", "远离", "高估", "bearish", "做空"]

    bullish_score = sum(1 for kw in bullish_keywords if kw in text_lower)
    bearish_score = sum(1 for kw in bearish_keywords if kw in text_lower)

    if bullish_score > bearish_score:
        return "bullish"
    elif bearish_score > bullish_score:
        return "bearish"
    else:
        return "neutral"


# ============================================
# Company Logos
# ============================================
COMPANY_LOGOS = {
    "AAPL": "https://logo.clearbit.com/apple.com",
    "MSFT": "https://logo.clearbit.com/microsoft.com",
    "GOOGL": "https://logo.clearbit.com/abc.xyz",
    "GOOG": "https://logo.clearbit.com/abc.xyz",
    "AMZN": "https://logo.clearbit.com/amazon.com",
    "TSLA": "https://logo.clearbit.com/tesla.com",
    "NVDA": "https://logo.clearbit.com/nvidia.com",
    "META": "https://logo.clearbit.com/meta.com",
    "NFLX": "https://logo.clearbit.com/netflix.com",
    "QQQ": "https://logo.clearbit.com/invesco.com",
    "SPY": "https://logo.clearbit.com/spdrs.com",
    "BABA": "https://logo.clearbit.com/alibabagroup.com",
    "TCEHY": "https://logo.clearbit.com/tencent.com",
    "NKE": "https://logo.clearbit.com/nike.com",
    "DIS": "https://logo.clearbit.com/disney.com",
    "BA": "https://logo.clearbit.com/boeing.com",
    "JPM": "https://logo.clearbit.com/jpmorganchase.com",
    "V": "https://logo.clearbit.com/visa.com",
    "MA": "https://logo.clearbit.com/mastercard.com",
    "WMT": "https://logo.clearbit.com/walmart.com",
    "PG": "https://logo.clearbit.com/pg.com",
    "JNJ": "https://logo.clearbit.com/jnj.com",
    "UNH": "https://logo.clearbit.com/unitedhealthgroup.com",
    "HD": "https://logo.clearbit.com/homedepot.com",
    "BAC": "https://logo.clearbit.com/bankofamerica.com",
    "XOM": "https://logo.clearbit.com/exxonmobil.com",
    "PFE": "https://logo.clearbit.com/pfizer.com",
    "INTC": "https://logo.clearbit.com/intel.com",
    "AMD": "https://logo.clearbit.com/amd.com",
    "CRM": "https://logo.clearbit.com/salesforce.com",
    "ORCL": "https://logo.clearbit.com/oracle.com",
    "CSCO": "https://logo.clearbit.com/cisco.com",
    "ADBE": "https://logo.clearbit.com/adobe.com",
    "PYPL": "https://logo.clearbit.com/paypal.com",
    "UBER": "https://logo.clearbit.com/uber.com",
    "ABNB": "https://logo.clearbit.com/airbnb.com",
    "COIN": "https://logo.clearbit.com/coinbase.com",
    "SQ": "https://logo.clearbit.com/block.xyz",
    "SHOP": "https://logo.clearbit.com/shopify.com",
    "SNOW": "https://logo.clearbit.com/snowflake.com",
    "PLTR": "https://logo.clearbit.com/palantir.com",
    "RIVN": "https://logo.clearbit.com/rivian.com",
    "LCID": "https://logo.clearbit.com/lucidmotors.com",
    "NIO": "https://logo.clearbit.com/nio.com",
    "XPEV": "https://logo.clearbit.com/xiaopeng.com",
    "LI": "https://logo.clearbit.com/lixiang.com",
    "BIDU": "https://logo.clearbit.com/baidu.com",
    "JD": "https://logo.clearbit.com/jd.com",
    "PDD": "https://logo.clearbit.com/pinduoduo.com",
}


# ============================================
# Financial Glossary
# ============================================
FINANCIAL_GLOSSARY = {
    "护城河": "企业难以被竞争对手超越的竞争优势，如品牌、专利、网络效应等",
    "安全边际": "投资价格应显著低于估算的内在价值，为错误预留缓冲空间",
    "自由现金流": "企业在扣除资本支出后剩余的现金，是衡量企业质量的终极指标",
    "DCF": "折现现金流模型，将未来现金流折算为当前价值来估算内在价值",
    "PEG比率": "市盈率除以盈利增长率，比单纯市盈率更能反映成长股估值",
    "转换成本": "用户因已投入的时间和习惯难以转换到竞品，形成隐性护城河",
    "网络效应": "企业生态系统中各产品相互增强，用户越多价值越大",
    "反脆弱": "在极端事件中能保持稳定甚至获益的能力，超越单纯的抗风险",
    "黑天鹅": "可能造成极端影响的低概率事件，往往主导了历史走向",
    "杠铃策略": "大部分资金配置在极度安全的资产上，小部分押注高凸性机会",
    "全天候策略": "在不同经济环境下都能表现稳健的资产配置策略",
    "分散化投资": "将投资分散在不同大类资产中，降低非系统性风险",
    "闲聊调研": "与供应商、客户、竞争对手交流获取一手信息的调研方法",
    "颠覆性创新": "利用新技术彻底改变行业格局，重塑市场规则",
    "十倍股": "能涨10倍的股票，通常来自快速增长型公司",
    "内在价值": "企业真实的盈利能力和现金流所决定的合理价值",
    "均值回归": "行业利润率在竞争中持续下降，最终回归历史平均水平",
    "尾部风险": "可能造成极端影响的低概率事件，需要特别防范",
    "资本支出": "企业用于购买或维护固定资产的投资，会减少自由现金流",
    "经常性收入": "可预测的持续性收入，如订阅制服务，增强现金流稳定性",
}


def sanitize_plain_text(value) -> str:
    """Convert untrusted model output into plain text for display."""
    return html.escape(str(value or "").strip(), quote=True)


def build_safe_opinion_html(value) -> str:
    """Escape model output, then add only the small set of HTML we control."""
    text = sanitize_plain_text(value)
    text = text.replace("\n", "<br>")
    text = convert_safe_bold(text)
    return wrap_glossary_terms(text)


def convert_safe_bold(text: str) -> str:
    """Convert escaped markdown bold markers into safe strong tags."""
    parts = text.split("**")
    if len(parts) < 3:
        return text

    output = []
    for index, part in enumerate(parts):
        if index % 2 == 1:
            output.append(f"<strong>{part}</strong>")
        else:
            output.append(part)
    return "".join(output)


def wrap_glossary_terms(text: str) -> str:
    """Wrap financial glossary terms in already-escaped text with hover tooltip spans."""
    if not text:
        return text
    
    # Sort terms by length (longest first) to avoid partial matches
    sorted_terms = sorted(FINANCIAL_GLOSSARY.keys(), key=len, reverse=True)
    
    # First pass: replace terms with placeholders
    placeholder_map = {}
    result = text
    for i, term in enumerate(sorted_terms):
        if term in result:
            placeholder = f"__TERM_{i}__"
            placeholder_map[placeholder] = term
            result = result.replace(term, placeholder)
    
    # Second pass: replace placeholders with wrapped spans
    # Use the original explanation (no nested wrapping)
    for placeholder, term in placeholder_map.items():
        explanation = html.escape(FINANCIAL_GLOSSARY[term], quote=True)
        replacement = f'<span class="concept-tag" data-tip="{explanation}">{term}</span>'
        result = result.replace(placeholder, replacement)
    
    return result


@app.get("/api/masters")
async def get_masters():
    """Get the list of all investment masters."""
    return {
        "masters": [
            {"id": m["id"], "name": m["name"], "title": m["title"],
             "photo": m.get("photo", ""), "school": m["school"],
             "school_label": m["school_label"], "catchphrase": m.get("catchphrase", ""),
             "desc": m.get("desc", "")}
            for m in MASTERS
        ]
    }


@app.get("/api/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "ok",
        "llm_provider": LLM_PROVIDER,
        "model": LLM_MODEL,
        "stock_provider": STOCK_DATA_PROVIDER,
        "cors_origins": CORS_ORIGINS,
        "debate_cache_keys": len(DEBATE_CACHE),
    }


@app.get("/api/debate-cache")
async def get_debate_cache_status():
    """Inspect current debate cache keys."""
    keys = sorted(DEBATE_CACHE.keys())
    return {"count": len(keys), "keys": keys[:200]}


@app.get("/")
async def root():
    """Root endpoint to avoid ambiguous 404 on service base URL."""
    return {
        "service": "invest-giant-battle-backend",
        "status": "ok",
        "message": "Backend is running. Open the frontend site for UI, or use /api/* endpoints.",
        "frontend_hint": "https://invest-giant-frontend.onrender.com",
        "health": "/api/health",
    }


# ============================================
# Entry Point
# ============================================
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
