"""
Tower Pipeline: User Retention & Repeat Visitor Analysis.
"""

from datetime import datetime, timedelta

import polars as pl
from tower import app, run, tables


@app.pipeline(
    name="retention_analysis",
    description="Computes anonymized retention metrics (1-day, 7-day, 30-day)",
    schedule="0 4 1 * *",
)
def compute_retention_metrics():
    end_date = datetime.now().strftime("%Y-%m-%d")
    start_date = (datetime.now() - timedelta(days=90)).strftime("%Y-%m-%d")
    print(f"Calculating retention metrics from {start_date} to {end_date}")

    sessions_df = tables.read(
        "silver.sessions",
        filter=f"date >= '{start_date}' AND date <= '{end_date}'",
        engine="polars",
    )

    if sessions_df.height == 0:
        return {"status": "no_session_data"}

    first_activity = sessions_df.group_by(["museum_id", "user_id"]).agg(
        [pl.col("date").min().alias("first_date")]
    )

    retention_data = (
        sessions_df.join(first_activity, on=["museum_id", "user_id"])
        .with_columns(
            [
                (
                    pl.col("date").str.strptime(pl.Date, strict=False)
                    - pl.col("first_date").str.strptime(pl.Date, strict=False)
                )
                .dt.total_days()
                .alias("days_since_first")
            ]
        )
        .unique(subset=["museum_id", "user_id", "days_since_first"])
    )

    cohort_sizes = retention_data.filter(pl.col("days_since_first") == 0).group_by(
        "museum_id"
    ).agg([pl.len().alias("cohort_size")])

    retention_curves = retention_data.group_by(["museum_id", "days_since_first"]).agg(
        [pl.len().alias("users_returning")]
    ).join(cohort_sizes, on="museum_id", how="left").with_columns(
        [
            (pl.col("users_returning") / pl.col("cohort_size")).alias("retention_rate")
        ]
    )

    retention_curves = retention_curves.with_columns(
        [
            pl.when(pl.col("days_since_first") == 1)
            .then(pl.lit("D1"))
            .when(pl.col("days_since_first") == 7)
            .then(pl.lit("D7"))
            .when(pl.col("days_since_first") == 30)
            .then(pl.lit("D30"))
            .otherwise(pl.lit("Other"))
            .alias("retention_bucket"),
            pl.lit(datetime.now().strftime("%Y-%m")).alias("analysis_month"),
        ]
    )

    tables.write("gold.retention_metrics", retention_curves, mode="overwrite")
    print(f"Retention analysis complete for {sessions_df.height} sessions")

    return {
        "status": "success",
        "retention_buckets": retention_curves["retention_bucket"].n_unique(),
    }


if __name__ == "__main__":
    run()
