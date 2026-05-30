from io import BytesIO

import clip
import pandas as pd
import requests
import torch
from PIL import Image
from tower import app, run, tables

device = "cuda" if torch.cuda.is_available() else "cpu"
model, preprocess = clip.load("ViT-B/32", device=device)


@app.pipeline(name="museum-bingo-embedding-generator", schedule=None)
def generate_embeddings(inputs: dict) -> dict:
    """
    Input: { "museumId": "xxx", "artworks": [ {"id": "...", "imageUrl": "..."} ] }
    Output: { "embeddings": [ {"artworkId": "...", "vector": [...]} ] }
    """
    museum_id = inputs["museumId"]
    artworks = inputs["artworks"]
    embeddings = []

    for art in artworks:
        response = requests.get(art["imageUrl"], timeout=30)
        response.raise_for_status()

        img = Image.open(BytesIO(response.content)).convert("RGB")
        image_tensor = preprocess(img).unsqueeze(0).to(device)
        with torch.no_grad():
            embedding = model.encode_image(image_tensor)

        embeddings.append(
            {
                "artworkId": art["id"],
                "vector": embedding.cpu().numpy().tolist(),
            }
        )

    df = pd.DataFrame(embeddings)
    tables.write("artwork_embeddings", df, mode="append")

    return {"embeddings": embeddings, "museumId": museum_id}


if __name__ == "__main__":
    run()
