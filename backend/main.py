import os
from datetime import datetime, timezone

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

load_dotenv()

app = FastAPI(title="Helicity API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Global service instances (initialized on startup) ---
from app.services.cache import Cache
from app.services.knowledge_graph import KnowledgeGraphService
from app.services.llm_jury import LLMJuryService
from app.services.weather_provider import WeatherProvider

cache = Cache()
graph_service = KnowledgeGraphService()
llm_jury = LLMJuryService()
weather_provider = WeatherProvider(cache)
scoring_engine = None  # Initialized on startup


def envelope(data=None, error=None):
    return {
        "data": data,
        "error": error,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


# --- Register routers ---
from app.routers import scores, weather, graph, extraction, onchain

app.include_router(scores.router)
app.include_router(weather.router)
app.include_router(graph.router)
app.include_router(extraction.router)
app.include_router(onchain.router)


@app.get("/health")
async def health():
    return envelope({"status": "ok"})


@app.on_event("startup")
async def startup():
    # Validate API keys
    keys = {
        "ANTHROPIC_API_KEY": os.getenv("ANTHROPIC_API_KEY"),
        "GEMINI_API_KEY": os.getenv("GEMINI_API_KEY"),
        "ETHERSCAN_API_KEY": os.getenv("ETHERSCAN_API_KEY"),
        "PINATA_API_KEY": os.getenv("PINATA_API_KEY"),
        "PINATA_SECRET_API_KEY": os.getenv("PINATA_SECRET_API_KEY"),
    }
    for name, val in keys.items():
        if not val:
            print(f"  WARNING: {name} not set — related features will be disabled")
        else:
            print(f"  OK: {name} is set")

    # Initialize cache
    await cache.initialize()
    print("  Cache initialized")

    # Build knowledge graph from registry fixtures
    from app.services.registry import get_all_symbols, get_reserve_data

    reserves = {}
    for symbol in get_all_symbols():
        try:
            reserves[symbol] = get_reserve_data(symbol)
        except (ValueError, FileNotFoundError) as e:
            print(f"  WARNING: Could not load {symbol}: {e}")

    graph_service.build_from_reserves(reserves)
    print(f"  Knowledge graph built: {graph_service.graph.number_of_nodes()} nodes, {graph_service.graph.number_of_edges()} edges")

    # Initialize scoring engine
    global scoring_engine
    from app.services.scoring_engine import ScoringEngine

    scoring_engine = ScoringEngine(cache, graph_service, llm_jury)
    print("  Scoring engine ready")
    print("Helicity API started successfully.")


@app.on_event("shutdown")
async def shutdown():
    await cache.close()
    print("Helicity API shut down.")
