import pickle

import boto3
import faiss
import numpy as np
from tower import app, run, tables

s3 = boto3.client("s3")
INDEX_BUCKET = "museum-bingo-indices"


@app.pipeline(name="build_faiss_index", schedule=None)
def build_faiss_index(museum_id: str):
    embeddings_df = tables.read(
        "silver.artwork_embeddings",
        filter=f"museum_id = '{museum_id}'",
        engine="polars",
    )

    if embeddings_df.height == 0:
        return {"status": "no_embeddings"}

    vectors = np.vstack(embeddings_df["embedding_vector"].to_numpy()).astype(np.float32)
    faiss.normalize_L2(vectors)
    index = faiss.IndexFlatIP(vectors.shape[1])
    index.add(vectors)

    index_bytes = faiss.serialize_index(index)
    s3.put_object(
        Bucket=INDEX_BUCKET,
        Key=f"museums/{museum_id}/faiss_index.bin",
        Body=index_bytes,
    )

    mapping = {i: row["artwork_id"] for i, row in enumerate(embeddings_df.to_dicts())}
    s3.put_object(
        Bucket=INDEX_BUCKET,
        Key=f"museums/{museum_id}/id_mapping.json",
        Body=pickle.dumps(mapping),
    )

    return {"status": "success", "vectors": len(vectors)}


if __name__ == "__main__":
    run()
