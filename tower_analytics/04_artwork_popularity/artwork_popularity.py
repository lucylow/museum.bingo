"""
Tower Pipeline: Artwork Popularity Analysis (Silver -> Gold).
"""

from datetime import datetime, timedelta

import polars as pl
from tower import app, run, tables


@app.pipeline(
    name="artwork_popularity",
    description="Identifies popular artworks based on validation frequency and dwell patterns",
    schedule="0 3 * * *",
)
def compute_artwork_popularity():
    yesterday = (datetime.now() - timedelta(days=1)).strftime("%Y-%m-%d")
    window_start = (datetime.now() - timedelta(days=7)).strftime("%Y-%m-%d")
    print(f"Computing artwork popularity for 7-day period ending {yesterday}")

    events_df = tables.read(
        "silver.validation_events",
        filter=f"date >= '{window_start}' AND date <= '{yesterday}'",
        engine="polars",
    )

    if events_df.height == 0:
        return {"status": "no_data"}

    popularity = events_df.group_by(["museum_id", "artwork_id", "artwork_title"]).agg(
        [
            pl.len().alias("validation_count"),
            pl.col("user_id").n_unique().alias("unique_validators"),
            pl.col("time_to_validate").mean().alias("avg_time_to_find_seconds"),
        ]
    ).with_columns(
        [
            pl.col("validation_count")
            .rank(method="dense", descending=True)
            .over("museum_id")
            .alias("popularity_rank")
        ]
    )

    museum_avg = popularity.group_by("museum_id").agg(
        [pl.col("validation_count").mean().alias("museum_avg_validations")]
    )
    popularity = popularity.join(museum_avg, on="museum_id").with_columns(
        [
            pl.when(pl.col("validation_count") < (pl.col("museum_avg_validations") / 2))
            .then(pl.lit(True))
            .otherwise(pl.lit(False))
            .alias("is_overlooked"),
            pl.lit(datetime.now().strftime("%Y-%m-%d")).alias("analysis_date"),
        ]
    )

    tables.write("gold.artwork_popularity", popularity, mode="overwrite")
    print(f"Analysed {popularity.height} unique artworks across all museums")
    return {"status": "success", "artworks_analysed": popularity.height}


if __name__ == "__main__":
    run()
