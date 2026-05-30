from __future__ import annotations

from datetime import datetime

import pyarrow as pa
import pyarrow.parquet as pq
from pyiceberg.catalog import load_catalog


def export_table_to_parquet(table_name: str, output_path: str) -> None:
    catalog = load_catalog("tower_lakehouse")
    table = catalog.load_table(table_name)
    dataframe = table.scan().to_pandas()
    table_pa = pa.Table.from_pandas(dataframe)
    pq.write_table(table_pa, output_path)


if __name__ == "__main__":
    export_table_to_parquet(
        "museum_bingo.artworks",
        f"s3://backups/artworks_{datetime.now():%Y%m%d}.parquet",
    )
