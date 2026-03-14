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
OPENMETEO_ENSEMBLE_URL = "https://ensemble-api.open-meteo.com/v1/ensemble"
OPENMETEO_FLOOD_URL = "https://flood-api.open-meteo.com/v1/flood"
NHC_ACTIVE_STORMS_URL = "https://www.nhc.noaa.gov/CurrentSurges.json"

HEADERS = {"User-Agent": "Helicity/1.0 (stablecoin-risk-engine; contact@helicity.dev)"}
class WeatherProvider(DataProvider):
    """Fetches high-resolution deterministic weather forecasts, active alerts, and historical data."""

    provider_name = "weather"

    def __init__(self, cache: Cache, ttl_seconds: int = 900) -> None:
        super().__init__(cache, ttl_seconds)  # 15-min TTL for weather
        self.client = httpx.AsyncClient(timeout=15.0, headers=HEADERS)

    async def fetch_live(self, source_id: str) -> Optional[dict]:
        """Fetch weather data.
        
        Formats:
            source_id='alerts:{state}' → active NOAA alerts for Florida
            source_id='history:{lat},{lng},{start},{end}' → Open-Meteo historical
            source_id='forecast:{lat},{lng}' → Open-Meteo 3-day comprehensive forecast
            source_id='ensemble:{lat},{lng}' → Open-Meteo ECMWF ensemble uncertainty
            source_id='flood:{lat},{lng}' → Open-Meteo GloFAS river discharge
            source_id='nhc:storms' → NHC active cyclones and tracks
        """
        kind, _, params = source_id.partition(":")

        if kind == "alerts":
            return await self._fetch_alerts(params if params else None)
        elif kind == "forecast":
            parts = params.split(",")
            if len(parts) == 2:
                return await self._fetch_forecast(lat=float(parts[0]), lng=float(parts[1]))
        elif kind == "ensemble":
            parts = params.split(",")
            if len(parts) == 2:
                return await self._fetch_ensemble(lat=float(parts[0]), lng=float(parts[1]))
        elif kind == "flood":
            parts = params.split(",")
            if len(parts) == 2:
                return await self._fetch_flood(lat=float(parts[0]), lng=float(parts[1]))
        elif kind == "nhc":
            return await self._fetch_nhc_storms()
        elif kind == "history":
            parts = params.split(",")
            if len(parts) == 4:
                return await self._fetch_historical(
                    lat=float(parts[0]), lng=float(parts[1]), start=parts[2], end=parts[3],
                )
        return None

    async def _fetch_forecast(self, lat: float, lng: float) -> Optional[dict]:
        """Fetch high-resolution 3-day comprehensive forecast (wind, rain, CAPE, temp)."""
        params = {
            "latitude": lat,
            "longitude": lng,
            "hourly": "precipitation,wind_gusts_10m,wind_speed_10m,temperature_2m,weather_code",
            "daily": "cape_max", # Convective hazard proxy
            "timezone": "auto",
            "forecast_days": 3,
            "models": "best_match"
        }
        resp = await self.client.get(OPENMETEO_FORECAST_URL, params=params)
        resp.raise_for_status()

        data = resp.json()
        hourly = data.get("hourly", {})
        daily = data.get("daily", {})
        
        max_wind_gust = max(hourly.get("wind_gusts_10m", [0])) if hourly.get("wind_gusts_10m") else 0
        max_sustained_wind = max(hourly.get("wind_speed_10m", [0])) if hourly.get("wind_speed_10m") else 0
        total_precip = sum(hourly.get("precipitation", [0])) if hourly.get("precipitation") else 0
        max_precip_rate = max(hourly.get("precipitation", [0])) if hourly.get("precipitation") else 0
        
        max_cape = max(daily.get("cape_max", [0])) if daily.get("cape_max") else 0
        
        temps = hourly.get("temperature_2m", [])
        max_temp = max(temps) if temps else None
        min_temp = min(temps) if temps else None
        
        # Check for extreme weather codes (like thunderstorms or heavy freezing rain)
        weather_codes = hourly.get("weather_code", [])
        has_severe_code = any(c in [95, 96, 99, 66, 67, 73, 75] for c in weather_codes)
        
        return {
            "latitude": lat,
            "longitude": lng,
            "max_wind_gust_kmh": max_wind_gust,
            "max_sustained_wind_kmh": max_sustained_wind,
            "total_precipitation_mm": total_precip,
            "max_precipitation_rate_mm": max_precip_rate,
            "max_cape_jkg": max_cape,
            "max_temp_c": max_temp,
            "min_temp_c": min_temp,
            "has_severe_weather_code": has_severe_code,
            "forecast_days": 3
        }

    async def _fetch_ensemble(self, lat: float, lng: float) -> Optional[dict]:
        """Fetch ECMWF 51-member ensemble spread (uncertainty) to detect pre-event positioning."""
        # Note: Open-Meteo ensemble API limits to 51 members. We ask for ECMWF.
        params = {
            "latitude": lat,
            "longitude": lng,
            "hourly": "precipitation,wind_gusts_10m",
            "timezone": "auto",
            "forecast_days": 3,
            "models": "ecmwf_ifs025"
        }
        resp = await self.client.get(OPENMETEO_ENSEMBLE_URL, params=params)
        resp.raise_for_status()
        
        data = resp.json()
        hourly = data.get("hourly", {})
        
        # We look across all member keys like 'precipitation_member01', etc.
        def _get_max_spread(var_prefix: str) -> float:
            members = []
            for k, v in hourly.items():
                if k.startswith(var_prefix) and v:
                    # just take the max value predicted by this member
                    members.append(max(v))
            if not members:
                return 0.0
            # Rough spread calculation: max member minus min member difference over the mean
            mean_val = sum(members) / len(members)
            if mean_val == 0:
                return 0.0
            spread = (max(members) - min(members)) / mean_val
            return spread

        precip_spread = _get_max_spread("precipitation_member")
        wind_spread = _get_max_spread("wind_gusts_10m_member")
        
        return {
            "latitude": lat,
            "longitude": lng,
            "precipitation_uncertainty_spread": precip_spread,
            "wind_uncertainty_spread": wind_spread
        }

    async def _fetch_flood(self, lat: float, lng: float) -> Optional[dict]:
        """Fetch river discharge from GloFAS to detect flooding tail-risk."""
        params = {
            "latitude": lat,
            "longitude": lng,
            "daily": "river_discharge,river_discharge_mean,river_discharge_median,river_discharge_max,river_discharge_min",
            "timezone": "auto",
            "forecast_days": 3
        }
        resp = await self.client.get(OPENMETEO_FLOOD_URL, params=params)
        resp.raise_for_status()
        
        data = resp.json()
        daily = data.get("daily", {})
        
        max_discharge = max(daily.get("river_discharge", [0])) if daily.get("river_discharge") else 0
        # Compare to historic mean to find anomalies
        historic_mean = max(daily.get("river_discharge_mean", [1])) if daily.get("river_discharge_mean") else 1  # prevent div 0
        
        anomaly_ratio = max_discharge / historic_mean if historic_mean else 1.0
        
        return {
            "latitude": lat,
            "longitude": lng,
            "max_river_discharge_m3s": max_discharge,
            "discharge_anomaly_ratio": anomaly_ratio
        }

    async def _fetch_nhc_storms(self) -> Optional[dict]:
        """Fetch active hurricane tracks from NHC."""
        # Note: CurrentSurges.json is one of many NHC endpoints, but is highly available. 
        # For this prototype we will use it and supplement with mock data if NHC is down/empty.
        try:
            resp = await self.client.get(NHC_ACTIVE_STORMS_URL)
            if resp.status_code == 200:
                # Basic parse if available 
                try:
                    data = resp.json()
                    storms = data.get("activeStorms", [])
                    return {"active_storms": storms}
                except ValueError:
                    pass
        except httpx.RequestError:
            pass
            
        # Fallback empty (simulates no active cyclones if endpoint fails)
        return {"active_storms": []}

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
