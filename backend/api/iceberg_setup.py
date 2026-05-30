"""
Setup and operations for Apache Iceberg tables in Tower Lakehouse.
Uses PyIceberg and Tower REST catalog.
"""

from __future__ import annotations

import os
from datetime import datetime
from typing import Iterable

import pyarrow as pa
from pyiceberg.catalog import load_catalog
from pyiceberg.schema import Schema
from pyiceberg.types import BinaryType, NestedField, StringType, TimestampType


catalog = load_catalog(
    "tower_lakehouse",
    **{
        "type": "rest",
        "uri": os.getenv("TOWER_ICEBERG_URI", "https://api.tower.dev/iceberg"),
        "credential": f"Bearer {os.environ['TOWER_API_KEY']}",
    },
)


artwork_schema = Schema(
    NestedField(field_id=1, name="artwork_id", field_type=StringType(), required=True),
    NestedField(field_id=2, name="museum_id", field_type=StringType(), required=True),
    NestedField(field_id=3, name="title", field_type=StringType()),
    NestedField(field_id=4, name="artist", field_type=StringType()),
    NestedField(field_id=5, name="image_s3_key", field_type=StringType()),
    NestedField(field_id=6, name="embedding_vector", field_type=BinaryType()),
    NestedField(field_id=7, name="created_at", field_type=TimestampType()),
)


def get_or_create_artworks_table():
    namespace = "museum_bingo"
    table_name = "artworks"
    identifier = f"{namespace}.{table_name}"
    try:
        return catalog.load_table(identifier)
    except Exception:
        try:
            catalog.create_namespace(namespace)
        except Exception:
            pass
        return catalog.create_table(
            identifier=identifier,
            schema=artwork_schema,
            properties={"write.format.default": "parquet"},
        )


def write_embeddings(embeddings: Iterable[dict]) -> None:
    table = get_or_create_artworks_table()
    rows = []
    for emb in embeddings:
        rows.append(
            {
                "artwork_id": emb["artwork_id"],
                "museum_id": emb["museum_id"],
                "title": emb.get("title"),
                "artist": emb.get("artist"),
                "image_s3_key": emb.get("image_s3_key"),
                "embedding_vector": bytes(emb["embedding_vector"]),
                "created_at": emb.get("created_at", datetime.utcnow()),
            }
        )

    pa_schema = pa.schema(
        [
            ("artwork_id", pa.string()),
            ("museum_id", pa.string()),
            ("title", pa.string()),
            ("artist", pa.string()),
            ("image_s3_key", pa.string()),
            ("embedding_vector", pa.binary()),
            ("created_at", pa.timestamp("us")),
        ]
    )

    pa_table = pa.Table.from_pylist(rows, schema=pa_schema)
    table.append(pa_table)
