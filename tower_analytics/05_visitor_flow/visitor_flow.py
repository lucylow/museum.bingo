"""
Tower Pipeline: Visitor Flow Analysis.
"""

from datetime import datetime, timedelta

import polars as pl
from tower import app, run, tables


@app.pipeline(
    name="visitor_flow_analysis",
    description="Aggregates anonymized location data into visitor flow patterns",
    schedule="0 4 * * 0",
)
def compute_visitor_flow():
    end_date = datetime.now().strftime("%Y-%m-%d")
    start_date = (datetime.now() - timedelta(days=7)).strftime("%Y-%m-%d")
    print(f"Analysing visitor flow from {start_date} to {end_date}")

    location_df = tables.read(
        "bronze.location_events",
        filter=f"date >= '{start_date}' AND date <= '{end_date}'",
        engine="polars",
    )

    if location_df.height == 0:
        return {"status": "no_location_data"}

    flows = (
        location_df.sort(["museum_id", "user_id", "timestamp"])
        .with_columns(
            [
                pl.col("location_hash")
                .shift(1)
                .over(["museum_id", "user_id"])
                .alias("prev_location"),
                pl.col("timestamp")
                .shift(1)
                .over(["museum_id", "user_id"])
                .alias("prev_timestamp"),
            ]
        )
        .filter(pl.col("prev_location").is_not_null())
        .group_by(["museum_id", "prev_location", "location_hash"])
        .agg(
            [
                pl.len().alias("transition_count"),
                ((pl.col("timestamp") - pl.col("prev_timestamp")).mean() / 1000).alias(
                    "avg_transition_seconds"
                ),
            ]
        )
    )

    popular_routes = (
        flows.sort(["museum_id", "transition_count"], descending=[False, True])
        .group_by("museum_id")
        .head(10)
    )

    tables.write("silver.visitor_flows", flows, mode="append")
    tables.write("gold.popular_routes", popular_routes, mode="overwrite")

    print(f"Identified {flows.height} unique flow patterns across museums")
    return {"status": "success", "flow_patterns": flows.height}


if __name__ == "__main__":
    run()
