"""
Tower Pipeline: Daily Engagement Metrics Aggregation (Bronze -> Silver).
"""

from datetime import datetime, timedelta

import polars as pl
from tower import app, run, tables


@app.pipeline(
    name="daily_engagement_metrics",
    description="Aggregates daily visitor engagement metrics from raw analytics events",
    schedule="0 2 * * *",
)
def compute_daily_engagement():
    yesterday = (datetime.now() - timedelta(days=1)).strftime("%Y-%m-%d")
    print(f"Computing engagement metrics for {yesterday}")

    events_df = tables.read(
        "bronze.analytics_events",
        filter=f"date = '{yesterday}'",
        engine="polars",
    )

    if events_df.height == 0:
        print("No events found for date, skipping")
        return {"status": "no_data", "date": yesterday}

    metrics = events_df.group_by("museum_id", "user_id").agg(
        [
            pl.col("event_type").count().alias("total_actions"),
            pl.col("event_type")
            .filter(pl.col("event_type") == "tile_validated")
            .count()
            .alias("tiles_validated"),
            pl.col("event_type")
            .filter(pl.col("event_type") == "bingo_completed")
            .count()
            .alias("bingos_completed"),
            pl.col("event_type")
            .filter(pl.col("event_type") == "heatvision_activated")
            .count()
            .alias("hints_used"),
            pl.col("timestamp").max().alias("session_end"),
            pl.col("timestamp").min().alias("session_start"),
        ]
    ).with_columns(
        [
            ((pl.col("session_end") - pl.col("session_start")) / 1000).alias(
                "session_duration_seconds"
            )
        ]
    )

    museum_aggregates = metrics.group_by("museum_id").agg(
        [
            pl.len().alias("unique_visitors"),
            pl.col("session_duration_seconds").mean().alias("avg_duration_seconds"),
            pl.col("tiles_validated").mean().alias("avg_tiles_per_session"),
            pl.col("bingos_completed").mean().alias("avg_bingos_per_session"),
            pl.col("total_actions").mean().alias("avg_actions_per_session"),
        ]
    ).with_columns([pl.lit(yesterday).alias("date")])

    tables.write("silver.engagement_metrics", museum_aggregates, mode="append")
    print(
        f"Wrote {museum_aggregates.height} museum engagement records for {yesterday}"
    )
    return {"status": "success", "date": yesterday, "records": museum_aggregates.height}


if __name__ == "__main__":
    run()
