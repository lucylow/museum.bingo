"""
Tower Pipeline: Automated Engagement Anomaly Notification.
"""

import os
from datetime import datetime, timedelta

import polars as pl
import requests
from tower import app, run, tables

SLACK_WEBHOOK_URL = os.getenv("SLACK_ALERTS_WEBHOOK")
EMAIL_API_KEY = os.getenv("EMAIL_ALERTS_API_KEY")


@app.pipeline(
    name="engagement_anomaly_detection",
    description="Detects drops/spikes in engagement and alerts museum partners",
    schedule="0 5 * * *",
)
def detect_engagement_anomalies():
    today = datetime.now().strftime("%Y-%m-%d")
    today_minus_7 = (datetime.now() - timedelta(days=7)).strftime("%Y-%m-%d")
    today_minus_28 = (datetime.now() - timedelta(days=28)).strftime("%Y-%m-%d")

    metrics_df = tables.read(
        "gold.engagement_metrics",
        filter=f"date >= '{today_minus_28}' AND date <= '{today}'",
        engine="polars",
    )

    if metrics_df.height < 14:
        return {"status": "insufficient_data"}

    recent_avg = metrics_df.filter(pl.col("date") >= today_minus_7).group_by(
        "museum_id"
    ).agg([pl.col("unique_visitors").mean().alias("recent_visitors_avg")])

    baseline_avg = metrics_df.filter(pl.col("date") < today_minus_7).group_by(
        "museum_id"
    ).agg([pl.col("unique_visitors").mean().alias("baseline_visitors_avg")])

    anomalies = (
        recent_avg.join(baseline_avg, on="museum_id", how="inner")
        .filter(pl.col("baseline_visitors_avg") > 0)
        .with_columns(
            [
                (
                    pl.col("recent_visitors_avg") / pl.col("baseline_visitors_avg")
                ).alias("engagement_ratio"),
                pl.when(pl.col("recent_visitors_avg") < pl.col("baseline_visitors_avg") * 0.7)
                .then(pl.lit("SIGNIFICANT_DROP"))
                .when(
                    pl.col("recent_visitors_avg")
                    > pl.col("baseline_visitors_avg") * 1.5
                )
                .then(pl.lit("SIGNIFICANT_SPIKE"))
                .otherwise(pl.lit("NORMAL"))
                .alias("alert_status"),
            ]
        )
        .filter(pl.col("alert_status") != "NORMAL")
    )

    for anomaly in anomalies.to_dicts():
        send_alert_to_museum(
            museum_id=anomaly["museum_id"],
            status=anomaly["alert_status"],
            ratio=anomaly["engagement_ratio"],
        )

    print(f"Anomaly detection complete - {anomalies.height} museums alerted")
    return {"status": "success", "anomalies_detected": anomalies.height}


def send_alert_to_museum(museum_id: str, status: str, ratio: float) -> None:
    message = (
        f"[Museum.Bingo Analytics] Museum {museum_id}: {status} "
        f"- Engagement ratio: {ratio:.2f}x baseline"
    )
    print(f"ALERT: {message}")

    if SLACK_WEBHOOK_URL:
        try:
            requests.post(SLACK_WEBHOOK_URL, json={"text": message}, timeout=10)
        except Exception as exc:  # pylint: disable=broad-except
            print(f"Failed to send Slack alert: {exc}")

    if EMAIL_API_KEY:
        print("Email alert API key configured (email delivery implementation omitted)")


if __name__ == "__main__":
    run()
