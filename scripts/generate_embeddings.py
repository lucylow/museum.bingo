import json
from io import BytesIO

import boto3
import clip
import torch
from PIL import Image

device = "cuda" if torch.cuda.is_available() else "cpu"
model, preprocess = clip.load("ViT-B/32", device=device)

s3 = boto3.client("s3")
INPUT_BUCKET = "museum-bingo-raw-images"
OUTPUT_BUCKET = "museum-bingo-embeddings"


def generate_embeddings_for_museum(museum_id: str):
    paginator = s3.get_paginator("list_objects_v2")
    artworks = []

    for page in paginator.paginate(Bucket=INPUT_BUCKET, Prefix=f"museums/{museum_id}/raw/"):
        for item in page.get("Contents", []):
            key = item["Key"]

            response = s3.get_object(Bucket=INPUT_BUCKET, Key=key)
            image_bytes = response["Body"].read()
            image = Image.open(BytesIO(image_bytes)).convert("RGB")
            image_tensor = preprocess(image).unsqueeze(0).to(device)

            with torch.no_grad():
                embedding = model.encode_image(image_tensor)
                embedding = embedding / embedding.norm(dim=-1, keepdim=True)

            artwork_id = key.split("/")[-1].split(".")[0]
            artworks.append(
                {
                    "artwork_id": artwork_id,
                    "museum_id": museum_id,
                    "embedding": embedding.cpu().numpy().tolist()[0],
                }
            )

    output_key = f"embeddings/{museum_id}/embeddings.jsonl"
    output_body = "\n".join(json.dumps(artwork) for artwork in artworks)
    s3.put_object(Bucket=OUTPUT_BUCKET, Key=output_key, Body=output_body)
    print(f"Generated {len(artworks)} embeddings for museum {museum_id}")


if __name__ == "__main__":
    generate_embeddings_for_museum("met_nyc")
