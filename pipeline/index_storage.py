"""
S3 utilities for FAISS index delivery and lifecycle.
"""

from __future__ import annotations

from typing import Dict, List

import boto3
from botocore.config import Config


INDEX_BUCKET = "museum-bingo-indices"
s3_client = boto3.client("s3", config=Config(signature_version="s3v4"))


def generate_presigned_download_url(museum_id: str, expires_in_hours: int = 24) -> str:
    key = f"museums/{museum_id}/faiss_index.bin"
    return s3_client.generate_presigned_url(
        "get_object",
        Params={"Bucket": INDEX_BUCKET, "Key": key},
        ExpiresIn=expires_in_hours * 3600,
    )


def list_index_versions(museum_id: str) -> List[Dict[str, str]]:
    prefix = f"museums/{museum_id}/faiss_index_"
    paginator = s3_client.get_paginator("list_objects_v2")
    versions: List[Dict[str, str]] = []
    for page in paginator.paginate(Bucket=INDEX_BUCKET, Prefix=prefix):
        for obj in page.get("Contents", []):
            versions.append(
                {
                    "key": obj["Key"],
                    "last_modified": obj["LastModified"].isoformat(),
                }
            )
    return sorted(versions, key=lambda row: row["last_modified"], reverse=True)


def archive_old_index(museum_id: str, keep_last: int = 5) -> int:
    versions = list_index_versions(museum_id)
    to_archive = versions[keep_last:]
    for version in to_archive:
        s3_client.copy_object(
            Bucket=INDEX_BUCKET,
            CopySource={"Bucket": INDEX_BUCKET, "Key": version["key"]},
            Key=version["key"],
            StorageClass="GLACIER",
            MetadataDirective="COPY",
        )
    return len(to_archive)

