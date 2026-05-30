"""
Analytics Dashboard API for museum partner reporting.
Serves pre-aggregated metrics from Gold Iceberg tables.
"""

from datetime import datetime, timedelta
from typing import Dict

import polars as pl
from fastapi import Depends, FastAPI, HTTPException, Security
from fastapi.security import APIKeyHeader
from tower import tables

app = FastAPI(title="Museum.Bingo Analytics API", version="1.0.0")
api_key_header = APIKeyHeader(name="X-API-Key")

VALID_API_KEYS = {"demo_museum_key": "museum_barberini_demo"}


def verify_api_key(api_key: str = Security(api_key_header)) -> str:
    if api_key not in VALID_API_KEYS:
        raise HTTPException(status_code=403, detail="Invalid API key")
    return api_key


@app.get("/api/analytics/engagement/{museum_id}", dependencies=[Depends(verify_api_key)])
async def get_engagement_metrics(museum_id: str, days: int = 7) -> Dict[str, object]:
    start_date = (datetime.now() - timedelta(days=days)).strftime("%Y-%m-%d")
    df = tables.read(
        "gold.engagement_metrics",
        filter=f"museum_id = '{museum_id}' AND date >= '{start_date}'",
        engine="polars",
    )
    if df.height == 0:
        return {"museum_id": museum_id, "message": "No data available for this period"}
    return {"museum_id": museum_id, "period_days": days, "data": df.to_dicts()}


@app.get("/api/analytics/popular-artworks/{museum_id}", dependencies=[Depends(verify_api_key)])
async def get_popular_artworks(
    museum_id: str, limit: int = 20, include_overlooked: bool = False
) -> Dict[str, object]:
    df = tables.read(
        "gold.artwork_popularity",
        filter=f"museum_id = '{museum_id}'",
        engine="polars",
    ).sort("validation_count", descending=True)
    if include_overlooked:
        df = df.filter(pl.col("is_overlooked")).sort("validation_count")
    return {"museum_id": museum_id, "artworks": df.head(limit).to_dicts()}


@app.get("/api/analytics/visitor-flow/{museum_id}", dependencies=[Depends(verify_api_key)])
async def get_visitor_flows(museum_id: str) -> Dict[str, object]:
    flows_df = tables.read(
        "gold.popular_routes",
        filter=f"museum_id = '{museum_id}'",
        engine="polars",
    ).head(10)
    return {"museum_id": museum_id, "popular_routes": flows_df.to_dicts()}


@app.get("/api/analytics/retention/{museum_id}", dependencies=[Depends(verify_api_key)])
async def get_retention_metrics(museum_id: str) -> Dict[str, object]:
    df = tables.read(
        "gold.retention_metrics",
        filter=f"museum_id = '{museum_id}'",
        engine="polars",
    ).filter(pl.col("retention_bucket") != "Other")

    retention = {row["retention_bucket"]: row["retention_rate"] for row in df.to_dicts()}
    return {"museum_id": museum_id, "retention": retention}
