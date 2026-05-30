#!/bin/bash
set -euo pipefail

# Daily backup of Firestore, S3, Redis, and Iceberg exports.
gcloud firestore export "gs://museum-bingo-backups/firestore/$(date +%Y%m%d)"
aws s3 sync s3://museum-bingo-artworks s3://museum-bingo-artworks-backup --source-region us-east-1 --region us-west-2
aws elasticache create-snapshot --cache-cluster-id museum-bingo-redis --snapshot-name "daily-$(date +%Y%m%d)"
python scripts/export_iceberg_to_parquet.py
