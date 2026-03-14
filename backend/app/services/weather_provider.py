"""Weather data provider — NOAA NWS + Open-Meteo. No API keys required.

NOAA NWS: https://api.weather.gov/alerts/active — User-Agent header only
Open-Meteo: https://api.open-meteo.com/v1/forecast — quantitative 3-day deterministic weather forecasts
"""

from typing import Optional

import httpx

from app.services.cache import Cache
from app.services.data_provider import DataProvider

NOAA_ALERTS_URL = "https://api.weather.gov/alerts/active"
OPENMETEO_ARCHIVE_URL = "https://archive-api.open-meteo.com/v1/archive"
OPENMETEO_FORECAST_URL = "https://api.open-meteo.com/v1/forecast"

HEADERS = {"User-Agent": "Helicity/1.0 (stablecoin-risk-engine; contact@helicity.dev)"}
class WeatherProvider(DataProvider):
    """Fetches high-resolution deterministic weather forecasts, active alerts, and historical data."""

    provider_name = "weather"

    def __init__(self, cache: Cache, ttl_seconds: int = 900) -> None:
        super().__init__(cache, ttl_seconds)  # 15-min TTL for weather
        self.client = httpx.AsyncClient(timeout=15.0, headers=HEADERS)

    async def fetch_live(self, source_id: str) -> Optional[dict]:
        """Fetch weather data. source_id format: 'alerts:{state}' or 'history:{lat},{lng},{start},{end}' or 'forecast:{lat},{lng}'.

        Examples:
            source_id='alerts:FL' → active NOAA alerts for Florida
            source_id='history:27.8,-82.6,2022-09-24,2022-09-30' → Open-Meteo historical
            source_id='forecast:27.8,-82.6' → Open-Meteo 3-day forecast at exact coordinates
        """
        kind, _, params = source_id.partition(":")

        if kind == "alerts":
            return await self._fetch_alerts(params if params else None)
        elif kind == "forecast":
            parts = params.split(",")
            if len(parts) == 2:
                return await self._fetch_forecast(
                    lat=float(parts[0]),
                    lng=float(parts[1])
                )
        elif kind == "history":
            parts = params.split(",")
            if len(parts) == 4:
                return await self._fetch_historical(
                    lat=float(parts[0]),
                    lng=float(parts[1]),
                    start=parts[2],
                    end=parts[3],
                )
        return None

    async def _fetch_forecast(self, lat: float, lng: float) -> Optional[dict]:
        """Fetch high-resolution 3-day weather forecast (wind gusts, precipitation)."""
        params = {
            "latitude": lat,
            "longitude": lng,
            "hourly": "precipitation,wind_gusts_10m",
            "timezone": "auto",
            "forecast_days": 3,
            "models": "best_match"
        }
        resp = await self.client.get(OPENMETEO_FORECAST_URL, params=params)
        resp.raise_for_status()

        data = resp.json()
        hourly = data.get("hourly", {})
        
        # Calculate max intensity over the next 3 days
        max_wind_gust = max(hourly.get("wind_gusts_10m", [0])) if hourly.get("wind_gusts_10m") else 0
        total_precip = sum(hourly.get("precipitation", [0])) if hourly.get("precipitation") else 0
        max_precip_rate = max(hourly.get("precipitation", [0])) if hourly.get("precipitation") else 0
        
        return {
            "latitude": lat,
            "longitude": lng,
            "max_wind_gust_kmh": max_wind_gust,
            "total_precipitation_mm": total_precip,
            "max_precipitation_rate_mm": max_precip_rate,
            "forecast_days": 3
        }

    async def _fetch_alerts(self, state: Optional[str] = None) -> Optional[dict]:
        """Fetch active NOAA weather alerts, optionally filtered by state."""
        params = {}
        if state:
            params["area"] = state
        resp = await self.client.get(NOAA_ALERTS_URL, params=params)
        resp.raise_for_status()

        data = resp.json()
        features = data.get("features", [])

        alerts = []
        for f in features[:50]:  # cap at 50 alerts
            props = f.get("properties", {})
            alerts.append({
                "event": props.get("event"),
                "severity": props.get("severity"),
                "headline": props.get("headline"),
                "area": props.get("areaDesc"),
                "onset": props.get("onset"),
                "expires": props.get("expires"),
            })

        return {"state": state, "alert_count": len(alerts), "alerts": alerts}

    async def _fetch_historical(
        self, lat: float, lng: float, start: str, end: str
    ) -> Optional[dict]:
        """Fetch historical weather from Open-Meteo archive API."""
        params = {
            "latitude": lat,
            "longitude": lng,
            "start_date": start,
            "end_date": end,
            "daily": "temperature_2m_max,temperature_2m_min,precipitation_sum,wind_speed_10m_max",
            "timezone": "auto",
        }
        resp = await self.client.get(OPENMETEO_ARCHIVE_URL, params=params)
        resp.raise_for_status()

        data = resp.json()
        daily = data.get("daily", {})
        return {
            "latitude": lat,
            "longitude": lng,
            "start_date": start,
            "end_date": end,
            "daily": daily,
        }

    def load_fixture(self, source_id: str) -> Optional[dict]:
        """No fixture fallback for weather — returns None to signal no data."""
        return None
